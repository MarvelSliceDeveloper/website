import { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { jsPDF } from "jspdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import path from "path";
import fs from "fs/promises";
import { uploadsRoot } from "../../utils/uploads";
import { getCourseContentProgress } from "./certificate-completion.service";

type CertificateCourse = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  updatedAt: Date;
};

type CertificateSummary = {
  id: string;
  courseId: string | null;
  packageId?: string | null;
  package?: { id: string; name: string } | null;
  issuedAt: Date;
  autoIssued?: boolean;
  course: CertificateCourse | null;
  totalRecordings: number;
  completedRecordings: number;
  progressPercent: number;
};

type ClaimableCertificate = {
  courseId: string;
  course: CertificateCourse;
  totalRecordings: number;
  completedRecordings: number;
  progressPercent: number;
  details?: {
    totalLessons: number;
    completedLessons: number;
    totalQuizzes: number;
    completedQuizzes: number;
    totalAssignments: number;
    completedAssignments: number;
    isExamRequired: boolean;
    isExamPassed: boolean;
  };
};

// Builds a map of completed courses and claimable certificates
async function buildCourseCompletionMap(userId: string) {
  // Enrollments come from two sources: individual EnrollmentRequest rows AND
  // package enrollments (PackageEnrollment → PackageEnrollmentCourse).
  const [enrollments, packageEnrollments] = await Promise.all([
    prisma.enrollmentRequest.findMany({
      where: { userId, status: "APPROVED" },
      select: { courseId: true, batchId: true },
    }),
    prisma.packageEnrollment.findMany({
      where: { userId, status: "APPROVED" },
      select: {
        id: true,
        package: { select: { id: true, name: true } },
        courses: {
          select: { courseId: true, batchId: true },
        },
      },
    }),
  ]);

  // Only include package courses that are explicitly visible in their batch
  const packageBatchIds = [
    ...new Set(
      packageEnrollments
        .flatMap((pe) => pe.courses.map((c) => c.batchId))
        .filter((b): b is string => Boolean(b)),
    ),
  ];
  const visibilityRows = packageBatchIds.length
    ? await prisma.batchCourseVisibility.findMany({
        where: { batchId: { in: packageBatchIds } },
        select: { courseId: true, isVisible: true },
      })
    : [];
  const visibleCourseIds = new Set(
    visibilityRows.filter((r) => r.isVisible).map((r) => r.courseId),
  );

  const packageCourseRows: Array<{
    courseId: string;
    batchId: string | null;
    packageId: string;
  }> = packageEnrollments.flatMap((pe) =>
    pe.courses
      .filter((c) => !c.batchId || visibleCourseIds.has(c.courseId))
      .map((c) => ({
        courseId: c.courseId,
        batchId: c.batchId ?? null,
        packageId: pe.package.id,
      })),
  );

  // Unified enrollment records (individual + package) for batch resolution
  const allEnrollments: Array<{ courseId: string; batchId: string | null }> = [
    ...enrollments.map((e) => ({
      courseId: e.courseId,
      batchId: e.batchId ?? null,
    })),
    ...packageCourseRows.map((r) => ({
      courseId: r.courseId,
      batchId: r.batchId,
    })),
  ];

  const courseIds = [...new Set(allEnrollments.map((e) => e.courseId))];
  if (courseIds.length === 0 && packageEnrollments.length === 0) {
    return {
      certificates: [] as CertificateSummary[],
      claimable: [] as ClaimableCertificate[],
      inProgress: [] as Array<{
        courseId: string;
        course: CertificateCourse;
        totalRecordings: number;
        completedRecordings: number;
        progressPercent: number;
      }>,
    };
  }

  // Start all independent queries in parallel
  const [certificates, courses, pkgCourseRows] = await Promise.all([
    prisma.certificate.findMany({
      where: { userId },
      select: {
        id: true,
        courseId: true,
        packageId: true,
        batchId: true,
        issuedAt: true,
        autoIssued: true,
        package: { select: { id: true, name: true } },
      },
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
        updatedAt: true,
      },
    }),
    prisma.packageCourse.findMany({
      where: { courseId: { in: courseIds } },
      select: { packageId: true },
    }),
  ]);

  const packageIds = [
    ...new Set([
      ...pkgCourseRows.map((pc) => pc.packageId),
      ...packageCourseRows.map((r) => r.packageId),
    ]),
  ];

  // Fetch regular batches (with courseId) AND package-only batches whose package contains these courses
  const batches = await prisma.batch.findMany({
    where: {
      OR: [
        { courseId: { in: courseIds } },
        ...(packageIds.length
          ? [{ courseId: null as string | null, packageId: { in: packageIds } }]
          : []),
      ],
    },
    select: { id: true, courseId: true, examEnabled: true },
  });

  const disabledBatchIds = new Set(
    batches.filter((batch) => !batch.examEnabled).map((batch) => batch.id),
  );

  const batchIds = batches.map((batch) => batch.id);

  const recordings = batchIds.length
    ? await prisma.recording.findMany({
        where: { session: { batchId: { in: batchIds } } },
        select: {
          id: true,
          session: { select: { batchId: true, courseId: true } },
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
    // Use session.courseId (direct field) when available, fall back to batch.courseId
    const courseId =
      recording.session.courseId ??
      batches.find((b) => b.id === recording.session.batchId)?.courseId;
    if (!courseId) continue;

    const stats = recordingsByCourse.get(courseId);
    if (!stats) continue;

    stats.total += 1;
    if (recording.progress.some((progress) => progress.completedAt)) {
      stats.completed += 1;
    }
  }

  const issuedCourseIds = new Set(
    certificates
      .map((certificate) => certificate.courseId)
      .filter((id): id is string => Boolean(id)),
  );
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const claimable: ClaimableCertificate[] = [];

  const issued = certificates
    .map((certificate) => {
      // Package certificates (packageId set, no course) are returned as-is
      if (!certificate.courseId) {
        if (!certificate.packageId) return null;
        const effectiveBatchId = certificate.batchId ?? null;
        // Hide certificates when the batch has exams disabled
        if (effectiveBatchId && disabledBatchIds.has(effectiveBatchId)) {
          return null;
        }
        return {
          id: certificate.id,
          courseId: null as string | null,
          packageId: certificate.packageId,
          package: certificate.package,
          issuedAt: certificate.issuedAt,
          autoIssued: certificate.autoIssued,
          course: null as CertificateCourse | null,
          totalRecordings: 0,
          completedRecordings: 0,
          progressPercent: 100,
        };
      }
      // Hide certificates when the course's batch has exams disabled
      const enrollment = allEnrollments.find(
        (e) => e.courseId === certificate.courseId && e.batchId,
      );
      const effectiveBatchId = certificate.batchId ?? enrollment?.batchId;
      if (effectiveBatchId && disabledBatchIds.has(effectiveBatchId)) {
        return null;
      }
      const course = courseById.get(certificate.courseId);
      if (!course) return null;

      const stats = recordingsByCourse.get(certificate.courseId) || {
        total: 0,
        completed: 0,
      };

      return {
        id: certificate.id,
        courseId: certificate.courseId,
        packageId: certificate.packageId,
        issuedAt: certificate.issuedAt,
        autoIssued: certificate.autoIssued,
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

  const inProgress: Array<{
    courseId: string;
    course: CertificateCourse;
    totalRecordings: number;
    completedRecordings: number;
    progressPercent: number;
    details?: {
      totalLessons: number;
      completedLessons: number;
      totalQuizzes: number;
      completedQuizzes: number;
      totalAssignments: number;
      completedAssignments: number;
      isExamRequired: boolean;
      isExamPassed: boolean;
    };
  }> = [];

  for (const courseId of courseIds) {
    const course = courseById.get(courseId);
    const stats = recordingsByCourse.get(courseId);

    if (!course) continue;
    if (issuedCourseIds.has(courseId)) continue;

    // Hide when the course's batch has exams disabled
    const enrollment = allEnrollments.find(
      (e) => e.courseId === courseId && e.batchId,
    );
    if (enrollment?.batchId && disabledBatchIds.has(enrollment.batchId)) {
      continue;
    }

    const totalRec = stats?.total || 0;
    const compRec = stats?.completed || 0;
    const pct = totalRec > 0 ? Math.round((compRec / totalRec) * 100) : 0;

    // Fetch progress breakdown for this course
    let progressDetails;
    try {
      const p = await getCourseContentProgress(courseId, userId);
      progressDetails = {
        totalLessons: p.details.totalLessons,
        completedLessons: p.details.completedLessons,
        totalQuizzes: p.details.totalQuizzes,
        completedQuizzes: p.details.completedQuizzes,
        totalAssignments: p.details.totalAssignments,
        completedAssignments: p.details.completedAssignments,
        isExamRequired: p.hasCertificationModule,
        isExamPassed: p.certificationQuizPassed,
      };
    } catch {
      // Fallback
    }

    if (totalRec > 0 && compRec === totalRec) {
      claimable.push({
        courseId,
        course,
        totalRecordings: totalRec,
        completedRecordings: compRec,
        progressPercent: 100,
        details: progressDetails,
      });
    } else {
      inProgress.push({
        courseId,
        course,
        totalRecordings: totalRec,
        completedRecordings: compRec,
        progressPercent: pct,
        details: progressDetails,
      });
    }
  }

  return { certificates: issued, claimable, inProgress };
}

// Resolves what a certificate is about — a single course or a whole program.
// Package certificates have no course, so we fall back to the package name.
function resolveCertificateSubject(certificate: {
  course?: { title: string } | null;
  package?: { name: string } | null;
}): { title: string; kind: string } {
  if (certificate.course) {
    return { title: certificate.course.title, kind: "course" };
  }
  return {
    title: certificate.package?.name ?? "the program",
    kind: "program",
  };
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

    // Fast path: already exists
    const existing = await prisma.certificate.findFirst({
      where: { userId, courseId },
    });
    if (existing) {
      return existing;
    }

    // Create atomically — @@unique constraint handles concurrent duplicates
    try {
      return await prisma.certificate.create({
        data: { userId, courseId },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        // Concurrent create won — return what the other request created
        return prisma.certificate.findFirstOrThrow({
          where: { userId, courseId },
        });
      }
      throw err;
    }
  },

  // Generates a PDF certificate — supports two methods:
  // 1. jsPDF generated (default) — dynamically renders with template styling
  // 2. Uploaded PDF with overlay — loads a pre-designed PDF and overlays text at defined coordinates
  async generatePdf(userId: string, certificateId: string) {
    const certificate = await prisma.certificate.findFirst({
      where: { id: certificateId, userId },
      include: {
        course: { select: { title: true, description: true } },
        package: { select: { name: true } },
        user: { select: { name: true, email: true } },
        uploadedTemplate: true,
      },
    });

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    if (
      certificate.uploadedTemplate?.pdfTemplateUrl &&
      certificate.uploadedTemplate.pdfTemplateType === "uploadedPdf"
    ) {
      return this.generateFromUploadedTemplate(certificate);
    }

    // No template is pinned to this certificate — fall back to the default
    // template. If the default is an uploaded PDF, use it (otherwise jsPDF).
    if (!certificate.uploadedTemplate) {
      const defaultTemplate = await prisma.certificateTemplate.findFirst({
        where: { isDefault: true },
      });
      if (
        defaultTemplate?.pdfTemplateUrl &&
        defaultTemplate.pdfTemplateType === "uploadedPdf"
      ) {
        return this.generateFromUploadedTemplate({
          ...certificate,
          uploadedTemplate: defaultTemplate,
        });
      }
    }

    return this.generateFromJsPdf(certificate);
  },

  // Uses uploaded PDF as background and overlays text at defined field positions
  async generateFromUploadedTemplate(certificate: any) {
    const template = certificate.uploadedTemplate;
    const templatePath = template.pdfTemplateUrl;

    if (!templatePath) {
      return this.generateFromJsPdf(certificate);
    }

    let pdfBytes: Uint8Array;
    try {
      const absolutePath = path.isAbsolute(templatePath)
        ? templatePath
        : path.join(uploadsRoot, templatePath);
      pdfBytes = await fs.readFile(absolutePath);
    } catch {
      return this.generateFromJsPdf(certificate);
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fields = (template.pdfTemplateFields || []) as Array<{
      key: string;
      x: number;
      y: number;
      fontSize: number;
      color: string;
      align: string;
    }>;

    const subject = resolveCertificateSubject(certificate);
    const values: Record<string, string> = {
      studentName: certificate.user.name || "Student",
      courseName: subject.title,
      date: new Date(certificate.issuedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      certificateNumber: certificate.certificateNumber,
      verifyUrl: `${process.env.WEB_URL || "https://lms.local"}/verify/${certificate.id}`,
    };

    for (const field of fields) {
      const text = values[field.key] || "";
      if (!text) continue;

      const font =
        field.key === "studentName" ||
        field.key === "courseName" ||
        field.key === "certificateNumber"
          ? helveticaBold
          : helveticaFont;

      const hexColor = field.color || "#1e293b";
      const r = parseInt(hexColor.slice(1, 3), 16) / 255;
      const g = parseInt(hexColor.slice(3, 5), 16) / 255;
      const b = parseInt(hexColor.slice(5, 7), 16) / 255;

      const width = helveticaFont.widthOfTextAtSize(text, field.fontSize || 22);
      const pageWidth = firstPage.getWidth();
      let xPos = field.x;

      if (field.align === "center") {
        xPos = pageWidth / 2 - width / 2 + field.x;
      } else if (field.align === "right") {
        xPos = pageWidth - width - field.x;
      }

      firstPage.drawText(text, {
        x: xPos,
        y: firstPage.getHeight() - field.y,
        size: field.fontSize || 22,
        font,
        color: rgb(r, g, b),
      });
    }

    const modifiedPdfBytes = await pdfDoc.save();

    return {
      pdfBuffer: Buffer.from(modifiedPdfBytes),
      fileName: `certificate-${certificate.certificateNumber}.pdf`,
    };
  },

  // Generates a styled certificate using jsPDF with template colors/fonts
  async generateFromJsPdf(certificate: any) {
    const template = await prisma.certificateTemplate.findFirst({
      where: { isDefault: true },
    });

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
    };

    const primaryRgb = hexToRgb(template?.primaryColor || "#2551d9");
    const bgRgb = hexToRgb(template?.backgroundColor || "#f8fafc");
    const textRgb = hexToRgb(template?.textColor || "#1e293b");
    const borderRgb = hexToRgb(
      template?.borderColor || template?.primaryColor || "#2551d9",
    );
    const accentRgb = hexToRgb(
      template?.accentColor || template?.secondaryColor || "#93c5fd",
    );

    const fontFamily = template?.fontFamily || "helvetica";
    const titleFontSize = template?.titleFontSize || 28;
    const nameFontSize = template?.nameFontSize || 22;
    const borderWidth = template?.borderWidth ?? 2;
    const borderRadius = template?.borderRadius ?? 5;
    const showBorder = template?.showBorder ?? true;
    const showSignatureLine = template?.showSignatureLine ?? true;
    const showVerificationUrl = template?.showVerificationUrl ?? true;
    const backgroundPattern = template?.backgroundPattern || "none";

    const subject = resolveCertificateSubject(certificate);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    if (backgroundPattern === "dots") {
      doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
      for (let x = 20; x < pageWidth - 10; x += 15)
        for (let y = 20; y < pageHeight - 10; y += 15)
          doc.circle(x, y, 0.5, "F");
    } else if (backgroundPattern === "lines") {
      doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setLineWidth(0.2);
      for (let y = 20; y < pageHeight - 10; y += 12)
        doc.line(15, y, pageWidth - 15, y);
    } else if (backgroundPattern === "corners") {
      doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setLineWidth(0.8);
      doc.line(15, 15, 15, 35);
      doc.line(15, 15, 35, 15);
      doc.line(pageWidth - 15, 15, pageWidth - 15, 35);
      doc.line(pageWidth - 15, 15, pageWidth - 35, 15);
      doc.line(15, pageHeight - 15, 15, pageHeight - 35);
      doc.line(15, pageHeight - 15, 35, pageHeight - 15);
      doc.line(
        pageWidth - 15,
        pageHeight - 15,
        pageWidth - 15,
        pageHeight - 35,
      );
      doc.line(
        pageWidth - 15,
        pageHeight - 15,
        pageWidth - 35,
        pageHeight - 15,
      );
    }

    if (showBorder) {
      doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
      doc.setLineWidth(borderWidth);
      doc.roundedRect(
        10,
        10,
        pageWidth - 20,
        pageHeight - 20,
        borderRadius,
        borderRadius,
      );
      doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setLineWidth(0.5);
      doc.roundedRect(
        14,
        14,
        pageWidth - 28,
        pageHeight - 28,
        Math.max(borderRadius - 1, 1),
        Math.max(borderRadius - 1, 1),
      );
    }

    let contentStartY = 35;
    if (template?.logoUrl) {
      try {
        doc.addImage(template.logoUrl, "PNG", pageWidth / 2 - 15, 18, 30, 30);
        contentStartY = 55;
      } catch {
        /* ignore logo load errors */
      }
    }

    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(pageWidth / 2 - 40, contentStartY - 8, 80, 1, "F");

    doc.setFont(fontFamily, "bold");
    doc.setFontSize(titleFontSize);
    doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
    doc.text(
      template?.title || "CERTIFICATE OF COMPLETION",
      pageWidth / 2,
      contentStartY + 5,
      { align: "center" },
    );

    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(pageWidth / 2 - 40, contentStartY + 10, 80, 0.5, "F");

    doc.setFont(fontFamily, "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(
      template?.subtitle || "This certifies that",
      pageWidth / 2,
      contentStartY + 22,
      { align: "center" },
    );

    doc.setFont(fontFamily, "bold");
    doc.setFontSize(nameFontSize);
    doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
    doc.text(
      certificate.user.name || "Student",
      pageWidth / 2,
      contentStartY + 35,
      { align: "center" },
    );

    const nameWidth = doc.getTextWidth(certificate.user.name || "Student");
    doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.setLineWidth(0.3);
    doc.line(
      pageWidth / 2 - nameWidth / 2 - 10,
      contentStartY + 38,
      pageWidth / 2 + nameWidth / 2 + 10,
      contentStartY + 38,
    );

    doc.setFont(fontFamily, "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `has successfully completed the ${subject.kind}`,
      pageWidth / 2,
      contentStartY + 48,
      { align: "center" },
    );

    doc.setFont(fontFamily, "bold");
    doc.setFontSize(18);
    doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
    const splitTitle = doc.splitTextToSize(subject.title, pageWidth - 80);
    doc.text(splitTitle, pageWidth / 2, contentStartY + 60, {
      align: "center",
    });

    const issuedDate = new Date(certificate.issuedAt).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );

    doc.setFont(fontFamily, "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);

    const bottomY = pageHeight - 35;
    doc.text(`Issued: ${issuedDate}`, pageWidth / 2 - 60, bottomY, {
      align: "center",
    });
    doc.text(
      `Certificate #: ${certificate.certificateNumber}`,
      pageWidth / 2 + 60,
      bottomY,
      { align: "center" },
    );

    if (showSignatureLine) {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(
        pageWidth / 2 - 50,
        bottomY + 12,
        pageWidth / 2 + 50,
        bottomY + 12,
      );
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("Authorized Signature", pageWidth / 2, bottomY + 17, {
        align: "center",
      });
    }

    if (showVerificationUrl) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const verifyUrl = `${process.env.WEB_URL || "https://lms.local"}/verify/${certificate.id}`;
      doc.text(
        template?.footerText
          ? `${template.footerText} | Verify: ${verifyUrl}`
          : `Verify at: ${verifyUrl}`,
        pageWidth / 2,
        pageHeight - 18,
        { align: "center" },
      );
    } else if (template?.footerText) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(template.footerText, pageWidth / 2, pageHeight - 18, {
        align: "center",
      });
    }

    return {
      pdfBuffer: Buffer.from(doc.output("arraybuffer")),
      fileName: `certificate-${certificate.certificateNumber}.pdf`,
    };
  },
};
