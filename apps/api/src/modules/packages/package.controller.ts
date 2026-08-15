import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import {
  packageService,
  CreatePackageSchema,
  UpdatePackageSchema,
  EnrollStudentSchema,
  ApproveEnrollmentSchema,
} from "./package.service";

export const packageController = {
  // Create a new package
  async create(req: AuthRequest, res: Response) {
    try {
      const data = CreatePackageSchema.parse(req.body);
      const pkg = await packageService.createPackage(data);
      return res.status(201).json(pkg);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // List all packages
  async list(req: AuthRequest, res: Response) {
    try {
      const { status, search, page, limit } = req.query;
      const result = await packageService.listPackages({
        status: status as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Get package by ID
  async getById(req: AuthRequest, res: Response) {
    try {
      const pkg = await packageService.getPackageById(req.params.id);
      return res.json(pkg);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Update package
  async update(req: AuthRequest, res: Response) {
    try {
      const data = UpdatePackageSchema.parse(req.body);
      const pkg = await packageService.updatePackage(req.params.id, data);
      return res.json(pkg);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Delete package
  async delete(req: AuthRequest, res: Response) {
    try {
      await packageService.deletePackage(req.params.id);
      return res.json({ message: "Package deleted" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Update package status
  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { status } = req.body;
      if (!status || !["DRAFT", "ACTIVE", "ARCHIVED"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const pkg = await packageService.updatePackageStatus(
        req.params.id,
        status,
      );
      return res.json(pkg);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Enroll student into package
  async enrollStudent(req: AuthRequest, res: Response) {
    try {
      const data = EnrollStudentSchema.parse(req.body);
      const enrollment = await packageService.enrollStudent(
        req.params.id,
        data,
      );
      return res.status(201).json(enrollment);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // List package enrollments
  async listEnrollments(req: AuthRequest, res: Response) {
    try {
      const { status, packageId, page, limit } = req.query;
      const result = await packageService.listEnrollments({
        status: status as string,
        packageId: packageId as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Approve package enrollment
  async approveEnrollment(req: AuthRequest, res: Response) {
    try {
      const data = ApproveEnrollmentSchema.parse(req.body);
      const enrollment = await packageService.approveEnrollment(
        req.params.id,
        data,
      );
      return res.json({ message: "Enrollment approved", enrollment });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Reject package enrollment
  async rejectEnrollment(req: AuthRequest, res: Response) {
    try {
      const enrollment = await packageService.rejectEnrollment(req.params.id);
      return res.json({ message: "Enrollment rejected", enrollment });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Get a single ACTIVE package by slug
  async getPublicPackage(req: AuthRequest, res: Response) {
    try {
      const pkg = await packageService.getPublicPackageBySlug(req.params.slug);
      return res.json({ package: pkg });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Get public catalogue of ACTIVE packages
  async getPublicCatalogue(_req: AuthRequest, res: Response) {
    try {
      const packages = await packageService.getPublicCatalogue();
      return res.json({ packages });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(
        err,
        (_req as any).log,
      );
      return res.status(statusCode).json(body);
    }
  },

  // Get student's enrolled packages
  async getStudentPackages(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const packages = await packageService.getStudentPackages(req.user.userId);
      return res.json({ packages });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Get all available courses (for package creation dropdown)
  async getAvailableCourses(req: AuthRequest, res: Response) {
    try {
      const { prisma } = await import("../../utils/prisma");
      const courses = await prisma.course.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          category: true,
          tags: true,
        },
        orderBy: { title: "asc" },
      });
      return res.json({ courses });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
