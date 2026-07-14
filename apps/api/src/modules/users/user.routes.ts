import { Router, type Request, type Response } from "express";
import { prisma } from "../../utils/prisma";
import {
  requireAuth,
  requireRole,
  type AuthRequest,
} from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import bcrypt from "bcryptjs";
import { emailService } from "../../services/email.service";
import { notificationService } from "../notifications/notification.service";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

function handleError(res: Response, error: unknown) {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return res.status(500).json({ error: message });
}

// GET /api/users — list non-admin users (admin only)
// Lists STUDENT and INSTRUCTOR users only
router.get("/", async (req: Request, res: Response) => {
  try {
    const { packageId } = req.query;

    const where: any = {};

    // If packageId is provided, filter users who have a PackageEnrollment for that package
    if (packageId && typeof packageId === "string") {
      where.packageEnrollments = {
        some: { packageId, status: "APPROVED" },
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuspended: true,
        packageEnrollments: {
          select: {
            id: true,
            status: true,
            package: { select: { id: true, name: true } },
            courses: { select: { courseId: true, batchId: true } },
          },
        },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    // Build unique packages list with counts
    const packageMap = new Map<
      string,
      { id: string; name: string; count: number }
    >();
    for (const user of users) {
      for (const pe of user.packageEnrollments) {
        if (pe.status === "APPROVED") {
          const existing = packageMap.get(pe.package.id);
          if (existing) {
            existing.count++;
          } else {
            packageMap.set(pe.package.id, {
              id: pe.package.id,
              name: pe.package.name,
              count: 1,
            });
          }
        }
      }
    }

    return res.json({
      users,
      packages: Array.from(packageMap.values()),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// POST /api/users — create a new user (admin only)
// Creates a new user account
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, packageId, batchId } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Name, email, password, and role are required" });
    }

    if (!["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "Invalid user role" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // If packageId is provided, verify it exists and is active
    if (packageId && role === "STUDENT") {
      const pkg = await prisma.coursePackage.findUnique({
        where: { id: packageId },
      });
      if (!pkg) {
        return res.status(400).json({ error: "Package not found" });
      }
      if (pkg.status !== "ACTIVE") {
        return res.status(400).json({ error: "Package is not active" });
      }

      // If batchId is provided, verify it belongs to this package
      if (batchId) {
        const batch = await prisma.batch.findUnique({
          where: { id: batchId },
        });
        if (!batch) {
          return res.status(400).json({ error: "Batch not found" });
        }
        if (batch.packageId !== packageId) {
          return res.status(400).json({
            error: "Batch does not belong to the selected package",
          });
        }
      }
    }

    const isSuspended = role === "INSTRUCTOR";
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: role as UserRole,
          isSuspended,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isSuspended: true,
        },
      });

      // Create package enrollment if packageId is provided for STUDENT
      if (packageId && role === "STUDENT") {
        const enrollment = await tx.packageEnrollment.create({
          data: {
            userId: createdUser.id,
            packageId,
            status: "APPROVED",
          },
        });

        // Get all courses in the package
        const packageCourses = await tx.packageCourse.findMany({
          where: { packageId },
          select: { courseId: true },
        });

        // If a batch was provided, look up which course it belongs to
        let batchCourseId: string | null = null;
        if (batchId) {
          const batch = await tx.batch.findUnique({
            where: { id: batchId },
            select: { courseId: true },
          });
          batchCourseId = batch?.courseId ?? null;
        }

        // Create enrollment courses for each course in the package
        // The batch is only assigned to the matching course
        for (const pc of packageCourses) {
          await tx.packageEnrollmentCourse.create({
            data: {
              enrollmentId: enrollment.id,
              courseId: pc.courseId,
              batchId:
                batchCourseId && pc.courseId === batchCourseId ? batchId : null,
            },
          });
        }
      }

      return createdUser;
    });

    emailService
      .sendWelcomeEmail({ name: user.name, email: user.email })
      .catch((err) => {
        console.error("[users] Failed to send welcome email:", err);
      });

    if (isSuspended) {
      const superAdmins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
      });
      if (superAdmins.length > 0) {
        notificationService.createMany(
          superAdmins.map((sa) => ({
            userId: sa.id,
            title: "Instructor Pending Approval",
            message: `${user.name} (${user.email}) has registered as an instructor and is awaiting your approval.`,
            type: "SYSTEM",
          })),
        );
      }
    }

    return res.status(201).json(user);
  } catch (error) {
    return handleError(res, error);
  }
});

// PATCH /api/users/:id — update user name, email, role, package, batch (admin only)
// Updates a user's details. For STUDENTs, also supports changing package and batch.
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, packageId, batchId } = req.body;

    const hasUserFields = name || email || role;
    const hasEnrollmentFields =
      packageId !== undefined || batchId !== undefined;

    if (!hasUserFields && !hasEnrollmentFields) {
      return res.status(400).json({
        error:
          "At least one field (name, email, role, packageId, batchId) is required",
      });
    }

    if (
      role &&
      !["STUDENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(role)
    ) {
      return res.status(400).json({ error: "Invalid user role" });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        packageEnrollments: {
          include: {
            courses: true,
            package: true,
          },
        },
      },
    });
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    if (role && existing.role === "ADMIN" && role !== "ADMIN") {
      if (id === (req as AuthRequest).user!.userId) {
        return res.status(403).json({ error: "You cannot demote yourself" });
      }
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return res
          .status(403)
          .json({ error: "Cannot demote the last admin in the system" });
      }
    }

    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }

    // Validate package if provided
    const targetPackageId =
      packageId || existing.packageEnrollments[0]?.packageId;

    if (packageId) {
      const pkg = await prisma.coursePackage.findUnique({
        where: { id: packageId },
      });
      if (!pkg) {
        return res.status(400).json({ error: "Package not found" });
      }
      if (pkg.status !== "ACTIVE") {
        return res.status(400).json({ error: "Package is not active" });
      }
    }

    // Validate batch if provided
    if (batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });
      if (!batch) {
        return res.status(400).json({ error: "Batch not found" });
      }
      if (targetPackageId && batch.packageId !== targetPackageId) {
        return res.status(400).json({
          error: "Batch does not belong to the selected package",
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update user fields
      const updateData: Record<string, string> = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;

      const user = hasUserFields
        ? await tx.user.update({
            where: { id },
            data: updateData,
            select: { id: true, name: true, email: true, role: true },
          })
        : await tx.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true },
          });

      // Handle enrollment changes (package/batch) for students
      if (hasEnrollmentFields) {
        const currentEnrollment = existing.packageEnrollments[0];

        if (
          packageId &&
          (!currentEnrollment || currentEnrollment.packageId !== packageId)
        ) {
          // Package changed or new — delete old enrollment if exists
          if (currentEnrollment) {
            await tx.packageEnrollment.delete({
              where: { id: currentEnrollment.id },
            });
          }

          // Create new enrollment
          const enrollment = await tx.packageEnrollment.create({
            data: {
              userId: id,
              packageId,
              status: "APPROVED",
            },
          });

          // Get all courses in the package
          const packageCourses = await tx.packageCourse.findMany({
            where: { packageId },
            select: { courseId: true },
          });

          // Look up batch course if batchId provided
          let batchCourseId: string | null = null;
          if (batchId) {
            const batch = await tx.batch.findUnique({
              where: { id: batchId },
              select: { courseId: true },
            });
            batchCourseId = batch?.courseId ?? null;
          }

          // Create enrollment courses
          for (const pc of packageCourses) {
            await tx.packageEnrollmentCourse.create({
              data: {
                enrollmentId: enrollment.id,
                courseId: pc.courseId,
                batchId:
                  batchCourseId && pc.courseId === batchCourseId
                    ? batchId
                    : null,
              },
            });
          }
        } else if (batchId && currentEnrollment) {
          // Same package but batch changed — update the batch assignment
          // Find the batch's course and update only that enrollment course
          const batch = await tx.batch.findUnique({
            where: { id: batchId },
            select: { courseId: true },
          });

          if (batch) {
            // Clear all batch assignments first
            await tx.packageEnrollmentCourse.updateMany({
              where: { enrollmentId: currentEnrollment.id },
              data: { batchId: null },
            });
            // Assign batch to the matching course
            await tx.packageEnrollmentCourse.updateMany({
              where: {
                enrollmentId: currentEnrollment.id,
                courseId: batch.courseId,
              },
              data: { batchId },
            });
          }
        }
      }

      return user;
    });

    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
});

// DELETE /api/users/:id — delete a user (admin only)
// Deletes a user and their related records
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        instructorOf: { take: 1, select: { id: true, name: true } },
        sessionsLed: { take: 1, select: { id: true } },
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.instructorOf.length > 0) {
      return res.status(409).json({
        error:
          "Cannot delete user: they are the instructor of one or more batches. Reassign the batches before deleting this user.",
      });
    }

    await prisma.$transaction(async (tx) => {
      // Nullify optional foreign keys
      if (user.sessionsLed.length > 0) {
        await tx.liveSession.updateMany({
          where: { instructorId: id },
          data: { instructorId: null },
        });
      }
      await tx.mentorshipTicket.updateMany({
        where: { mentorId: id },
        data: { mentorId: null },
      });

      // Delete owned records
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.notificationPreference.deleteMany({ where: { userId: id } });
      await tx.progress.deleteMany({ where: { userId: id } });
      await tx.certificate.deleteMany({ where: { userId: id } });
      await tx.enrollmentRequest.deleteMany({ where: { userId: id } });
      await tx.attendance.deleteMany({ where: { userId: id } });
      await tx.mentorshipTicket.deleteMany({ where: { studentId: id } });
      await tx.assignmentSubmission.deleteMany({ where: { studentId: id } });
      await tx.packageEnrollmentCourse.deleteMany({
        where: { enrollment: { userId: id } },
      });
      await tx.packageEnrollment.deleteMany({ where: { userId: id } });

      await tx.user.delete({ where: { id } });
    });

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    return handleError(res, error);
  }
});

export const userRouter = router;
