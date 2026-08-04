import { Router, type Response } from "express";
import { prisma } from "../../utils/prisma";
import {
  requireAuth,
  requireRole,
  type AuthRequest,
} from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

// POST /api/admin/courses/:id/quiz-templates — attach quiz template to course
router.post("/:id/quiz-templates", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quizTemplateId, dueDate, maxPoints } = req.body;

    if (!quizTemplateId) {
      return res.status(400).json({ error: "quizTemplateId is required" });
    }

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const template = await prisma.quizTemplate.findUnique({
      where: { id: quizTemplateId },
    });
    if (!template) {
      return res.status(404).json({ error: "Quiz template not found" });
    }

    const attachment = await prisma.courseQuizTemplate.upsert({
      where: { courseId_quizTemplateId: { courseId: id, quizTemplateId } },
      update: { dueDate: dueDate ? new Date(dueDate) : undefined, maxPoints },
      create: {
        courseId: id,
        quizTemplateId,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxPoints: maxPoints ?? 100,
      },
    });

    return res.status(201).json({ attachment });
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /api/admin/courses/:id/quiz-templates/:templateId — detach quiz template
router.delete(
  "/:id/quiz-templates/:templateId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, templateId } = req.params;

      const attachment = await prisma.courseQuizTemplate.findUnique({
        where: {
          courseId_quizTemplateId: { courseId: id, quizTemplateId: templateId },
        },
      });
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      await prisma.courseQuizTemplate.delete({
        where: { id: attachment.id },
      });

      return res.json({ message: "Quiz template detached from course" });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },
);

// POST /api/admin/courses/:id/assignment-templates — attach assignment template
router.post(
  "/:id/assignment-templates",
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { assignmentTemplateId, dueDate, maxPoints } = req.body;

      if (!assignmentTemplateId) {
        return res
          .status(400)
          .json({ error: "assignmentTemplateId is required" });
      }

      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const template = await prisma.assignmentTemplate.findUnique({
        where: { id: assignmentTemplateId },
      });
      if (!template) {
        return res.status(404).json({ error: "Assignment template not found" });
      }

      const attachment = await prisma.courseAssignmentTemplate.upsert({
        where: {
          courseId_assignmentTemplateId: {
            courseId: id,
            assignmentTemplateId,
          },
        },
        update: {
          dueDate: dueDate ? new Date(dueDate) : undefined,
          maxPoints,
        },
        create: {
          courseId: id,
          assignmentTemplateId,
          dueDate: dueDate ? new Date(dueDate) : null,
          maxPoints: maxPoints ?? 100,
        },
      });

      return res.status(201).json({ attachment });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },
);

// DELETE /api/admin/courses/:id/assignment-templates/:templateId — detach
router.delete(
  "/:id/assignment-templates/:templateId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, templateId } = req.params;

      const attachment = await prisma.courseAssignmentTemplate.findUnique({
        where: {
          courseId_assignmentTemplateId: {
            courseId: id,
            assignmentTemplateId: templateId,
          },
        },
      });
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      await prisma.courseAssignmentTemplate.delete({
        where: { id: attachment.id },
      });

      return res.json({ message: "Assignment template detached from course" });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },
);

export const courseTemplateRouter = router;
