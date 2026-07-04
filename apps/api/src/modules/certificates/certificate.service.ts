import { prisma } from "../../utils/prisma";

type CertificateSummary = {
  id: string;
  courseId: string;
  issuedAt: Date;
  course: {
    id: string;
    title: string;
    description: string;
    category: string | null;
    thumbnailUrl: string | null;
    coverImageUrl: string | null;
    price: number;
    updatedAt: Date;
  };
  totalRecordings: number;
  completedRecordings: number;
  progressPercent: number;
};

type ClaimableCertificate = {
  courseId: string;
  course: CertificateSummary["course"];
  totalRecordings: number;
  completedRecordings: number;
  progressPercent: number;
};

// Builds a map of completed courses and claimable certificates
async function buildCourseCompletionMap(userId: string) {
  const enrollments = await prisma.enrollmentRequest.findMany({
    where: { userId, status: "APPROVED" },
    select: { courseId: true },
  });

  const courseIds = [
    ...new Set(enrollments.map((enrollment) => enrollment.courseId)),
  ];
  if (courseIds.length === 0) {
    return {
      certificates: [] as CertificateSummary[],
      claimable: [] as ClaimableCertificate[],
    };
  }

  const [certificates, courses, batches] = await Promise.all([
    prisma.certificate.findMany({
      where: { userId, courseId: { in: courseIds } },
      select: { id: true, courseId: true, issuedAt: true },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        thumbnailUrl: true,
        coverImageUrl: true,
        price: true,
        updatedAt: true,
      },
    }),
    prisma.batch.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true, courseId: true },
    }),
  ]);

  const batchToCourse = new Map(
    batches.map((batch) => [batch.id, batch.courseId]),
  );
  const batchIds = batches.map((batch) => batch.id);

  const recordings = batchIds.length
    ? await prisma.recording.findMany({
        where: { session: { batchId: { in: batchIds } } },
        select: {
          id: true,
          session: { select: { batchId: true } },
          progress: {
            where: { userId },
            select: { completedAt: true },
          },
        },
      })
    : [];

  const recordingsByCourse = new Map<
    string,
    { total: number; completed: number }
  >();
  for (const courseId of courseIds) {
    recordingsByCourse.set(courseId, { total: 0, completed: 0 });
  }

  for (const recording of recordings) {
    const batchId = recording.session.batchId;
    if (!batchId) continue;
    const courseId = batchToCourse.get(batchId);
    if (!courseId) continue;

    const stats = recordingsByCourse.get(courseId);
    if (!stats) continue;

    stats.total += 1;
    if (recording.progress.some((progress) => progress.completedAt)) {
      stats.completed += 1;
    }
  }

  const issuedCourseIds = new Set(
    certificates.map((certificate) => certificate.courseId),
  );
  const courseById = new Map(courses.map((course) => [course.id, course]));

  const issued = certificates
    .map((certificate) => {
      const course = courseById.get(certificate.courseId);
      if (!course) return null;

      const stats = recordingsByCourse.get(certificate.courseId) || {
        total: 0,
        completed: 0,
      };

      return {
        id: certificate.id,
        courseId: certificate.courseId,
        issuedAt: certificate.issuedAt,
        course,
        totalRecordings: stats.total,
        completedRecordings: stats.completed,
        progressPercent:
          stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0,
      };
    })
    .filter(Boolean) as CertificateSummary[];

  const claimable: ClaimableCertificate[] = [];
  for (const courseId of courseIds) {
    const course = courseById.get(courseId);
    const stats = recordingsByCourse.get(courseId);

    if (!course || !stats || stats.total === 0) continue;
    if (issuedCourseIds.has(courseId)) continue;
    if (stats.completed !== stats.total) continue;

    claimable.push({
      courseId,
      course,
      totalRecordings: stats.total,
      completedRecordings: stats.completed,
      progressPercent: 100,
    });
  }

  return { certificates: issued, claimable };
}

export const certificateService = {
  // Gets all issued and claimable certificates for a user
  async getMyCertificates(userId: string) {
    return buildCourseCompletionMap(userId);
  },

  // Claims a certificate for a user if eligible
  async claimCertificate(userId: string, courseId: string) {
    const { claimable } = await buildCourseCompletionMap(userId);
    const eligible = claimable.find((item) => item.courseId === courseId);

    if (!eligible) {
      throw new Error("Certificate is not available to claim yet");
    }

    const existing = await prisma.certificate.findFirst({
      where: { userId, courseId },
    });

    if (existing) {
      return existing;
    }

    return prisma.certificate.create({
      data: { userId, courseId },
    });
  },
};
