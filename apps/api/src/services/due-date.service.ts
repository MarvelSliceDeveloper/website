import { prisma } from "../utils/prisma";

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getEffectiveDueDate(
  enrollmentDate: Date | null | undefined,
  daysFromEnrollment: number | null | undefined,
  absoluteDueDate: Date,
  extensionDate?: Date | null,
): Date {
  if (extensionDate) return extensionDate;
  if (daysFromEnrollment && enrollmentDate) {
    return addDays(enrollmentDate, daysFromEnrollment);
  }
  return absoluteDueDate;
}

export async function getStudentEnrollmentDate(
  studentId: string,
  courseId: string,
  batchId: string,
): Promise<Date | null> {
  const enrollment = await prisma.enrollmentRequest.findFirst({
    where: { userId: studentId, courseId, batchId, status: "APPROVED" },
    select: { appliedAt: true },
  });
  if (enrollment) return enrollment.appliedAt;

  const pec = await prisma.packageEnrollmentCourse.findFirst({
    where: { batchId, courseId, enrollment: { userId: studentId, status: "APPROVED" } },
    select: { enrollment: { select: { createdAt: true } } },
  });
  if (pec) return pec.enrollment.createdAt;

  return null;
}

export async function getBatchLevelExtension(
  batchId: string,
  assignmentId?: string,
  quizId?: string,
): Promise<Date | null> {
  if (!assignmentId && !quizId) return null;

  const ext = await prisma.batchAssignmentExtension.findFirst({
    where: {
      batchId,
      ...(assignmentId ? { assignmentId } : {}),
      ...(quizId ? { quizId } : {}),
    },
    select: { extendedDueDate: true },
  });

  return ext?.extendedDueDate ?? null;
}

export interface LatePenaltyResult {
  isLate: boolean;
  penaltyPercent: number;
  penaltyAmount: number;
  originalScore: number;
  finalScore: number;
}

export function calculateLatePenalty(
  submittedAt: Date,
  effectiveDueDate: Date,
  maxScore: number,
  penaltyPercent: number | null | undefined,
  gracePeriodHrs: number | null | undefined,
  rawScore: number,
): LatePenaltyResult {
  const isLate = submittedAt > effectiveDueDate;
  if (!isLate) {
    return { isLate: false, penaltyPercent: 0, penaltyAmount: 0, originalScore: rawScore, finalScore: rawScore };
  }

  const pct = penaltyPercent ?? 25;
  const penaltyAmount = Math.round(maxScore * (pct / 100));
  const finalScore = Math.max(0, rawScore - penaltyAmount);

  return {
    isLate: true,
    penaltyPercent: pct,
    penaltyAmount,
    originalScore: rawScore,
    finalScore,
  };
}
