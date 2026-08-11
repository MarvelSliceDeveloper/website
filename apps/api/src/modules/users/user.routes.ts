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
import { paginate } from "../../utils/paginate";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

function handleError(res: Response, error: unknown) {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return res.status(500).json({ error: message });
}

// GET /api/users — list non-admin users (admin only)
// Lists STUDENT and INSTRUCTOR users only (ADMIN/SUPER_ADMIN users only visible to super admins)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { packageId, page, limit, role } = req.query;

    const where: any = { deletedAt: null };

    // Admin users are only visible to super admins
    if ((req as AuthRequest).user?.role !== UserRole.SUPER_ADMIN) {
      where.role = { in: [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.INTERN] };
    }

    if (role && typeof role === "string") {
      where.role = role;
    }

    // If packageId is provided, filter users who have a PackageEnrollment for that package
    if (packageId && typeof packageId === "string") {
      where.packageEnrollments = {
        some: { packageId, status: "APPROVED" },
      };
    }

    const {
      skip,
      take,
      page: currentPage,
      limit: currentLimit,
    } = paginate({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          createdAt: true,
          designation: true,
          internFieldId: true,
          internField: { select: { id: true, name: true } },
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
      }),
      prisma.user.count({ where }),
    ]);

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
      total,
      page: currentPage,
      limit: currentLimit,
      packages: Array.from(packageMap.values()),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// GET /api/users/:id — user detail with quiz attempts + assignment submissions for students (admin only)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
        designation: true,
        internFieldId: true,
        internField: { select: { id: true, name: true } },
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
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const quizAttempts =
      user.role === UserRole.STUDENT
        ? await prisma.quizAttempt.findMany({
            where: { userId: id },
            select: {
              id: true,
              score: true,
              total: true,
              percentage: true,
              isPassed: true,
              status: true,
              submittedAt: true,
              quiz: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: "desc" },
          })
        : [];

    const assignmentSubmissions =
      user.role === UserRole.STUDENT
        ? await prisma.assignmentSubmission.findMany({
            where: { studentId: id },
            select: {
              id: true,
              submittedAt: true,
              status: true,
              grade: true,
              feedback: true,
              gradedAt: true,
              totalScore: true,
              assignment: { select: { id: true, title: true, type: true } },
            },
            orderBy: { submittedAt: "desc" },
          })
        : [];

    return res.json({ ...user, quizAttempts, assignmentSubmissions });
  } catch (error) {
    return handleError(res, error);
  }
});

// POST /api/users — create a new user (admin only)
// Creates a new user account
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, packageId, batchId, designation, internFieldId } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Name, email, password, and role are required" });
    }

    if (!["STUDENT", "INSTRUCTOR", "ADMIN", "INTERN"].includes(role)) {
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

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: role as UserRole,
          ...(role === "INTERN"
            ? {
                designation: designation || null,
                internFieldId:
                  typeof internFieldId === "string" ? internFieldId : null,
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
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
        // Package batch (courseId=null) assigns batch to ALL courses
        for (const pc of packageCourses) {
          await tx.packageEnrollmentCourse.create({
            data: {
              enrollmentId: enrollment.id,
              courseId: pc.courseId,
              batchId: !batchId
                ? null
                : !batchCourseId
                  ? batchId
                  : pc.courseId === batchCourseId
                    ? batchId
                    : null,
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
    const { name, email, role, packageId, batchId, designation, internFieldId } = req.body;

    const hasUserFields =
      name || email || role || designation !== undefined || internFieldId !== undefined;
    const hasEnrollmentFields =
      packageId !== undefined || batchId !== undefined;

    if (!hasUserFields && !hasEnrollmentFields) {
      return res.status(400).json({
        error:
          "At least one field (name, email, role, designation, internFieldId, packageId, batchId) is required",
      });
    }

    if (
      role &&
      !["STUDENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN", "INTERN"].includes(role)
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
      const updateData: Record<string, string | string[] | null> = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (designation !== undefined) updateData.designation = designation || null;
      if (internFieldId !== undefined) {
        updateData.internFieldId =
          typeof internFieldId === "string" ? internFieldId : null;
      }

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
                batchId: !batchId
                  ? null
                  : !batchCourseId
                    ? batchId
                    : pc.courseId === batchCourseId
                      ? batchId
                      : null,
              },
            });
          }
        } else if (batchId && currentEnrollment) {
          // Same package but batch changed — update the batch assignment
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
            // Assign batch — for package batches (courseId=null), update ALL courses
            await tx.packageEnrollmentCourse.updateMany({
              where: {
                enrollmentId: currentEnrollment.id,
                ...(batch.courseId ? { courseId: batch.courseId } : {}),
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

// DELETE /api/users/:id — soft-delete a user (admin only)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authUser = (req as AuthRequest).user;

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

    if (
      authUser?.role !== UserRole.SUPER_ADMIN &&
      (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)
    ) {
      return res.status(403).json({
        error: "You do not have permission to delete this user.",
      });
    }

    if (user.instructorOf.length > 0) {
      return res.status(409).json({
        error:
          "Cannot delete user: they are the instructor of one or more batches. Reassign the batches before deleting this user.",
      });
    }

    await prisma.$transaction(async (tx) => {
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

      await tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: authUser!.userId,
        },
      });
    });

    return res.json({ message: "User soft-deleted" });
  } catch (error) {
    return handleError(res, error);
  }
});

export const userRouter = router;
