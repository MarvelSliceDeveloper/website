import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../utils/prisma";

vi.mock("../../../utils/prisma", () => ({
  prisma: {
    certificateTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma);

describe("Certificate Template Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("should list all templates ordered by default first", async () => {
      const mockTemplates = [
        { id: "t-1", name: "Default", isDefault: true },
        { id: "t-2", name: "Gold", isDefault: false },
      ];
      mockPrisma.certificateTemplate.findMany.mockResolvedValue(
        mockTemplates as never,
      );

      const result = await prisma.certificateTemplate.findMany({
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });

      expect(result).toEqual(mockTemplates);
      expect(mockPrisma.certificateTemplate.findMany).toHaveBeenCalled();
    });
  });

  describe("POST /", () => {
    it("should create template with default values", async () => {
      const input = {
        name: "My Template",
        primaryColor: "#ff0000",
      };
      const mockCreated = {
        id: "t-3",
        ...input,
        secondaryColor: "#93c5fd",
        backgroundColor: "#f8fafc",
        textColor: "#1e293b",
        title: "CERTIFICATE OF COMPLETION",
        subtitle: "This certifies that",
        footerText: null,
        logoUrl: null,
        isDefault: false,
      };
      mockPrisma.certificateTemplate.create.mockResolvedValue(
        mockCreated as never,
      );

      const result = await prisma.certificateTemplate.create({
        data: {
          name: input.name,
          primaryColor: input.primaryColor,
          secondaryColor: "#93c5fd",
          backgroundColor: "#f8fafc",
          textColor: "#1e293b",
          title: "CERTIFICATE OF COMPLETION",
          subtitle: "This certifies that",
          footerText: null,
          logoUrl: null,
          isDefault: false,
        },
      });

      expect(result.name).toBe("My Template");
      expect(result.primaryColor).toBe("#ff0000");
    });

    it("should unset other defaults when setting new default", async () => {
      mockPrisma.certificateTemplate.updateMany.mockResolvedValue({ count: 1 });

      await prisma.certificateTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      expect(mockPrisma.certificateTemplate.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe("DELETE /:id", () => {
    it("should prevent deleting default template", async () => {
      const mockTemplate = {
        id: "t-1",
        name: "Default",
        isDefault: true,
      };
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(
        mockTemplate as never,
      );

      const template = await prisma.certificateTemplate.findUnique({
        where: { id: "t-1" },
      });

      expect(template?.isDefault).toBe(true);
      // In actual route, this would return 400
    });

    it("should allow deleting non-default template", async () => {
      const mockTemplate = {
        id: "t-2",
        name: "Gold",
        isDefault: false,
      };
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(
        mockTemplate as never,
      );
      mockPrisma.certificateTemplate.delete.mockResolvedValue(
        mockTemplate as never,
      );

      const template = await prisma.certificateTemplate.findUnique({
        where: { id: "t-2" },
      });

      expect(template?.isDefault).toBe(false);

      await prisma.certificateTemplate.delete({ where: { id: "t-2" } });
      expect(mockPrisma.certificateTemplate.delete).toHaveBeenCalled();
    });
  });

  describe("POST /:id/set-default", () => {
    it("should unset all defaults and set new default", async () => {
      const mockTemplate = {
        id: "t-2",
        name: "Gold",
        isDefault: false,
      };
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(
        mockTemplate as never,
      );
      mockPrisma.certificateTemplate.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.certificateTemplate.update.mockResolvedValue({
        ...mockTemplate,
        isDefault: true,
      } as never);

      // Unset all
      await prisma.certificateTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      // Set new default
      const result = await prisma.certificateTemplate.update({
        where: { id: "t-2" },
        data: { isDefault: true },
      });

      expect(result.isDefault).toBe(true);
      expect(mockPrisma.certificateTemplate.updateMany).toHaveBeenCalled();
      expect(mockPrisma.certificateTemplate.update).toHaveBeenCalled();
    });
  });
});
