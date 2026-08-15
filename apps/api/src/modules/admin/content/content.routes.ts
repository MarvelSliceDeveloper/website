import { Router, type Response } from "express";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireSuperAdmin,
  requireRole,
  type AuthRequest,
} from "../../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

router.use(requireAuth);

// Reads are available to admin/instructor/superadmin so the course & package
// creation forms can display DB-managed options during filling.
const READ_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INSTRUCTOR];

// --- Categories (read) ---

router.get(
  "/categories",
  requireRole(READ_ROLES),
  async (_req: AuthRequest, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { order: "asc" },
        include: { _count: { select: { courses: true } } },
      });
      return res.json({ categories });
    } catch (error: unknown) {
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to fetch categories",
      });
    }
  },
);

// --- Tags (read) ---

router.get(
  "/tags",
  requireRole(READ_ROLES),
  async (_req: AuthRequest, res: Response) => {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { courses: true } } },
      });
      return res.json({ tags });
    } catch (error: unknown) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch tags",
      });
    }
  },
);

// Writes are superadmin-only
router.use(requireSuperAdmin);

// --- Course Titles ---

// GET /api/admin/content/titles — list all course titles
router.get("/titles", async (_req: AuthRequest, res: Response) => {
  try {
    const titles = await prisma.courseTitle.findMany({
      orderBy: { name: "asc" },
    });
    return res.json({ titles });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch titles",
    });
  }
});

// POST /api/admin/content/titles — create a course title
router.post("/titles", async (req: AuthRequest, res: Response) => {
  try {
    const { name, isActive } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Title name is required" });
    }
    const existing = await prisma.courseTitle.findFirst({
      where: { name: name.trim() },
    });
    if (existing) {
      return res.status(409).json({ error: "This title already exists" });
    }
    const title = await prisma.courseTitle.create({
      data: { name: name.trim(), isActive: isActive ?? true },
    });
    return res.status(201).json({ data: title });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create title",
    });
  }
});

// PUT /api/admin/content/titles/:id — update a course title
router.put("/titles/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    const existing = await prisma.courseTitle.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Title not found" });
    }
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Name cannot be empty" });
      }
      if (name.trim() !== existing.name) {
        const duplicate = await prisma.courseTitle.findFirst({
          where: { name: name.trim(), id: { not: id } },
        });
        if (duplicate) {
          return res.status(409).json({ error: "This title already exists" });
        }
      }
      updateData.name = name.trim();
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    const title = await prisma.courseTitle.update({
      where: { id },
      data: updateData,
    });
    return res.json({ data: title });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update title",
    });
  }
});

// DELETE /api/admin/content/titles/:id — delete a course title
router.delete("/titles/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.courseTitle.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Title not found" });
    }
    await prisma.courseTitle.delete({ where: { id } });
    return res.json({ message: "Title deleted" });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete title",
    });
  }
});

// --- Package Names ---

// GET /api/admin/content/package-names — list all package names
router.get("/package-names", async (_req: AuthRequest, res: Response) => {
  try {
    const packageNames = await prisma.packageName.findMany({
      orderBy: { name: "asc" },
    });
    return res.json({ packageNames });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch package names",
    });
  }
});

// POST /api/admin/content/package-names — create a package name
router.post("/package-names", async (req: AuthRequest, res: Response) => {
  try {
    const { name, isActive } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Package name is required" });
    }
    const existing = await prisma.packageName.findFirst({
      where: { name: name.trim() },
    });
    if (existing) {
      return res.status(409).json({ error: "This package name already exists" });
    }
    const packageName = await prisma.packageName.create({
      data: { name: name.trim(), isActive: isActive ?? true },
    });
    return res.status(201).json({ data: packageName });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create package name",
    });
  }
});

// PUT /api/admin/content/package-names/:id — update a package name
router.put("/package-names/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    const existing = await prisma.packageName.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Package name not found" });
    }
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Name cannot be empty" });
      }
      if (name.trim() !== existing.name) {
        const duplicate = await prisma.packageName.findFirst({
          where: { name: name.trim(), id: { not: id } },
        });
        if (duplicate) {
          return res
            .status(409)
            .json({ error: "This package name already exists" });
        }
      }
      updateData.name = name.trim();
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    const packageName = await prisma.packageName.update({
      where: { id },
      data: updateData,
    });
    return res.json({ data: packageName });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to update package name",
    });
  }
});

// DELETE /api/admin/content/package-names/:id — delete a package name
router.delete("/package-names/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageName.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Package name not found" });
    }
    await prisma.packageName.delete({ where: { id } });
    return res.json({ message: "Package name deleted" });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete package name",
    });
  }
});

export default router;