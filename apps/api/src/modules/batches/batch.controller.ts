import { Response } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  batchService,
  CreateBatchSchema,
  UpdateBatchSchema,
  AddStudentsSchema,
} from "./batch.service";

export const batchController = {
  // Creates a new batch (single with courseId, or one-per-course when only packageId)
  async create(req: AuthRequest, res: Response) {
    try {
      const data = CreateBatchSchema.parse(req.body);

      if (data.courseId) {
        // Single batch for a specific course
        const batch = await batchService.createBatch(data);
        return res.status(201).json(batch);
      } else {
        // packageId is guaranteed by Zod refinement — creates one batch for the whole package
        const batch = await batchService.createBatchesForPackage(data);
        return res.status(201).json(batch);
      }
    } catch (error: any) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      return res.status(400).json({ error: error.message });
    }
  },

  // Lists batches with filters
  async list(req: AuthRequest, res: Response) {
    try {
      const { courseId, status, search, packageId } = req.query;
      const instructorId =
        req.user?.role === "INSTRUCTOR" ? req.user.userId : undefined;
      const batches = await batchService.listBatches({
        courseId: courseId as string,
        status: status as string,
        search: search as string,
        instructorId,
        packageId: packageId as string,
      });
      return res.json(batches);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Gets a single batch by ID
  async getById(req: AuthRequest, res: Response) {
    try {
      const batch = await batchService.getBatchById(req.params.id);
      if (
        req.user?.role === "INSTRUCTOR" &&
        batch.instructorId !== req.user.userId
      ) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      return res.json(batch);
    } catch (error: any) {
      if (error.message === "Batch not found")
        return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: error.message });
    }
  },

  // Updates a batch
  async update(req: AuthRequest, res: Response) {
    try {
      const data = UpdateBatchSchema.parse(req.body);
      const batch = await batchService.updateBatch(req.params.id, data);
      return res.json(batch);
    } catch (error: any) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      if (error.message === "Batch not found")
        return res.status(404).json({ error: error.message });
      return res.status(400).json({ error: error.message });
    }
  },

  // Deletes a batch
  async delete(req: AuthRequest, res: Response) {
    try {
      await batchService.deleteBatch(req.params.id);
      return res.json({ message: "Batch deleted" });
    } catch (error: any) {
      if (error.message === "Batch not found")
        return res.status(404).json({ error: error.message });
      return res.status(400).json({ error: error.message });
    }
  },

  // Lists students in a batch
  async listStudents(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role === "INSTRUCTOR") {
        const batch = await batchService.getBatchById(req.params.id);
        if (batch.instructorId !== req.user.userId) {
          return res.status(403).json({ error: "Insufficient permissions" });
        }
      }
      const students = await batchService.listStudents(req.params.id);
      return res.json(students);
    } catch (error: any) {
      if (error.message === "Batch not found")
        return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: error.message });
    }
  },

  // Adds students to a batch
  async addStudents(req: AuthRequest, res: Response) {
    try {
      const { userIds } = AddStudentsSchema.parse(req.body);
      const result = await batchService.addStudents(req.params.id, userIds);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      return res.status(400).json({ error: error.message });
    }
  },

  // Removes a student from a batch
  async removeStudent(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      await batchService.removeStudent(req.params.id, req.params.uid, req.user);
      return res.json({ message: "Student removed from batch" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  // Gets available instructors
  async getInstructors(req: AuthRequest, res: Response) {
    try {
      const instructors = await batchService.getInstructors();
      return res.json(instructors);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Gets batches grouped by course for a package
  async getBatchesByPackage(req: AuthRequest, res: Response) {
    try {
      const { packageId } = req.params;
      const result = await batchService.getBatchesByPackage(packageId);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  // Gets available courses for batch creation
  async getCourses(req: AuthRequest, res: Response) {
    try {
      const courses = await batchService.getCoursesForBatch();
      return res.json(courses);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Lists all courses in a batch with visibility state
  async getBatchCourses(req: AuthRequest, res: Response) {
    try {
      const courses = await batchService.getBatchCourses(req.params.id);
      return res.json({ courses });
    } catch (error: any) {
      if (error.message === "Batch not found")
        return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: error.message });
    }
  },

  // Toggles visibility of a course in a batch
  async toggleVisibility(req: AuthRequest, res: Response) {
    try {
      const { id, courseId } = req.params;
      const result = await batchService.toggleCourseVisibility(id, courseId);
      return res.json(result);
    } catch (error: any) {
      if (error.message === "Course not found in this batch")
        return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: error.message });
    }
  },

  // Gets batch details for an enrolled student
  async getByIdForStudent(req: AuthRequest, res: Response) {
    try {
      const batch = await batchService.getBatchById(req.params.id);
      // Verify student is enrolled in this batch
      const isEnrolled = batch.enrollments.some(
        (e) => e.user.id === req.user?.userId,
      );
      if (!isEnrolled) {
        return res
          .status(403)
          .json({ error: "You are not enrolled in this batch" });
      }
      return res.json({ batch });
    } catch (error: any) {
      if (error.message === "Batch not found")
        return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: error.message });
    }
  },
};
