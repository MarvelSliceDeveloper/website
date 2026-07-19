import { Router, type Response } from "express";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET / — List all categories with course count
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { courses: true } } },
      orderBy: { order: "asc" },
    });

    return res.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        order: c.order,
        isActive: c.isActive,
        _count: { courses: c._count.courses },
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch categories",
    });
  }
});

// POST / — Create category
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, order, isActive } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name is required" });
    }

    const slug = slugify(name);

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Category with this name already exists" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description ?? null,
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    });

    return res.status(201).json({ data: category });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to create category",
    });
  }
});

// PUT /:id — Update category
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, order, isActive } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Name cannot be empty" });
      }
      const slug = slugify(name);
      if (name !== existing.name) {
        const duplicate = await prisma.category.findFirst({
          where: { OR: [{ name }, { slug }], id: { not: id } },
        });
        if (duplicate) {
          return res
            .status(409)
            .json({ error: "Category with this name already exists" });
        }
      }
      updateData.name = name;
      updateData.slug = slug;
    }
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return res.json({ data: category });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to update category",
    });
  }
});

// DELETE /:id — Delete category
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    });
    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (existing._count.courses > 0) {
      return res.status(409).json({
        error: `Cannot delete category: ${existing._count.courses} course(s) are assigned to it`,
      });
    }

    await prisma.category.delete({ where: { id } });

    return res.json({ message: "Category deleted" });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to delete category",
    });
  }
});

export default router;
