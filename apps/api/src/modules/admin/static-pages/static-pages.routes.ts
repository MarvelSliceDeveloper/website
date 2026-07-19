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

// GET / — List all static pages
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const pages = await prisma.staticPage.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        isPublished: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ pages });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch pages",
    });
  }
});

// GET /:id — Get page detail
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const page = await prisma.staticPage.findUnique({ where: { id } });
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    return res.json({ page });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch page",
    });
  }
});

// POST / — Create static page
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { title, slug, content, isPublished } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Content is required" });
    }

    const pageSlug = slug || slugify(title);

    const existing = await prisma.staticPage.findUnique({
      where: { slug: pageSlug },
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: "A page with this slug already exists" });
    }

    const page = await prisma.staticPage.create({
      data: {
        title,
        slug: pageSlug,
        content,
        isPublished: isPublished ?? false,
        createdBy: req.user!.userId,
      },
    });

    return res.status(201).json({ data: page });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create page",
    });
  }
});

// PUT /:id — Update static page
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, slug, content, isPublished } = req.body;

    const existing = await prisma.staticPage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Page not found" });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    if (slug !== undefined && slug !== existing.slug) {
      const duplicate = await prisma.staticPage.findUnique({
        where: { slug },
      });
      if (duplicate) {
        return res
          .status(409)
          .json({ error: "A page with this slug already exists" });
      }
      updateData.slug = slug;
    } else if (title !== undefined && title !== existing.title && !slug) {
      const newSlug = slugify(title);
      if (newSlug !== existing.slug) {
        const duplicate = await prisma.staticPage.findUnique({
          where: { slug: newSlug },
        });
        if (duplicate) {
          return res
            .status(409)
            .json({ error: "A page with this slug already exists" });
        }
        updateData.slug = newSlug;
      }
    }

    const page = await prisma.staticPage.update({
      where: { id },
      data: updateData,
    });

    return res.json({ data: page });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update page",
    });
  }
});

// DELETE /:id — Delete static page
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.staticPage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Page not found" });
    }

    await prisma.staticPage.delete({ where: { id } });

    return res.json({ message: "Page deleted" });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete page",
    });
  }
});

export default router;
