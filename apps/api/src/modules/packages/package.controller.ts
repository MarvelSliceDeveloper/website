import { Response } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../middleware/auth.middleware";
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
    } catch (error: any) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      return res.status(400).json({ error: error.message });
    }
  },

  // List all packages
  async list(req: AuthRequest, res: Response) {
    try {
      const { status, search } = req.query;
      const packages = await packageService.listPackages({
        status: status as string,
        search: search as string,
      });
      return res.json({ packages });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Get package by ID
  async getById(req: AuthRequest, res: Response) {
    try {
      const pkg = await packageService.getPackageById(req.params.id);
      return res.json(pkg);
    } catch (error: any) {
      if (error.message === "Package not found")
        return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: error.message });
    }
  },

  // Update package
  async update(req: AuthRequest, res: Response) {
    try {
      const data = UpdatePackageSchema.parse(req.body);
      const pkg = await packageService.updatePackage(req.params.id, data);
      return res.json(pkg);
    } catch (error: any) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      if (error.message === "Package not found")
        return res.status(404).json({ error: error.message });
      return res.status(400).json({ error: error.message });
    }
  },

  // Delete package
  async delete(req: AuthRequest, res: Response) {
    try {
      await packageService.deletePackage(req.params.id);
      return res.json({ message: "Package deleted" });
    } catch (error: any) {
      if (error.message === "Package not found")
        return res.status(404).json({ error: error.message });
      return res.status(400).json({ error: error.message });
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
    } catch (error: any) {
      if (error.message === "Package not found")
        return res.status(404).json({ error: error.message });
      return res.status(400).json({ error: error.message });
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
    } catch (error: any) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      return res.status(400).json({ error: error.message });
    }
  },

  // List package enrollments
  async listEnrollments(req: AuthRequest, res: Response) {
    try {
      const { status, packageId } = req.query;
      const enrollments = await packageService.listEnrollments({
        status: status as string,
        packageId: packageId as string,
      });
      return res.json({ enrollments });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
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
    } catch (error: any) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      return res.status(400).json({ error: error.message });
    }
  },

  // Reject package enrollment
  async rejectEnrollment(req: AuthRequest, res: Response) {
    try {
      const enrollment = await packageService.rejectEnrollment(req.params.id);
      return res.json({ message: "Enrollment rejected", enrollment });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  // Get a single ACTIVE package by slug
  async getPublicPackage(req: AuthRequest, res: Response) {
    try {
      const pkg = await packageService.getPublicPackageBySlug(req.params.slug);
      return res.json({ package: pkg });
    } catch (error: any) {
      if (error.message === "Package not found")
        return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: error.message });
    }
  },

  // Get public catalogue of ACTIVE packages
  async getPublicCatalogue(_req: AuthRequest, res: Response) {
    try {
      const packages = await packageService.getPublicCatalogue();
      return res.json({ packages });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Get student's enrolled packages
  async getStudentPackages(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const packages = await packageService.getStudentPackages(req.user.userId);
      return res.json({ packages });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Get all available courses (for package creation dropdown)
  async getAvailableCourses(req: AuthRequest, res: Response) {
    try {
      const { prisma } = await import("../../utils/prisma");
      const courses = await prisma.course.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, slug: true, thumbnailUrl: true },
        orderBy: { title: "asc" },
      });
      return res.json({ courses });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
};
