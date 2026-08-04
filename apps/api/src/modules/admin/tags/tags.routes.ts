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

// GET / — List all tags with course count
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      include: { _count: { select: { courses: true } } },
      orderBy: { name: "asc" },
    });

    return res.json({
      tags: tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        _count: { courses: t._count.courses },
        createdAt: t.createdAt,
      })),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch tags",
    });
  }
});

// POST / — Create tag
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name is required" });
    }

    const slug = slugify(name);

    const existing = await prisma.tag.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Tag with this name already exists" });
    }

    const tag = await prisma.tag.create({
      data: { name, slug },
    });

    return res.status(201).json({ data: tag });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create tag",
    });
  }
});

// PUT /:id — Update tag
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Tag not found" });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Name cannot be empty" });
      }
      const slug = slugify(name);
      if (name !== existing.name) {
        const duplicate = await prisma.tag.findFirst({
          where: { OR: [{ name }, { slug }], id: { not: id } },
        });
        if (duplicate) {
          return res
            .status(409)
            .json({ error: "Tag with this name already exists" });
        }
      }

      const tag = await prisma.tag.update({
        where: { id },
        data: { name, slug },
      });
      return res.json({ data: tag });
    }

    return res.json({ data: existing });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update tag",
    });
  }
});

// DELETE /:id — Delete tag
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    });
    if (!existing) {
      return res.status(404).json({ error: "Tag not found" });
    }

    if (existing._count.courses > 0) {
      return res.status(409).json({
        error: `Cannot delete tag: ${existing._count.courses} course(s) use it`,
      });
    }

    await prisma.tag.delete({ where: { id } });

    return res.json({ message: "Tag deleted" });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete tag",
    });
  }
});

export default router;
