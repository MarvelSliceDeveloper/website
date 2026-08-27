import { describe, it, expect, vi, beforeEach } from "vitest";
import { certificateService } from "../../modules/certificates/certificate.service";

// Mock Prisma — vi.hoisted() initializes this before the hoisted vi.mock runs
const mockPrisma = vi.hoisted(() => ({
  certificate: {
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  certificateTemplate: {
    findFirst: vi.fn(),
  },
  enrollmentRequest: {
    findMany: vi.fn(),
  },
  packageEnrollment: {
    findMany: vi.fn(),
  },
  batchCourseVisibility: {
    findMany: vi.fn(),
  },
  course: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  packageCourse: {
    findMany: vi.fn(),
  },
  batch: {
    findMany: vi.fn(),
  },
  recording: {
    findMany: vi.fn(),
  },
  quiz: {
    findMany: vi.fn(),
  },
  assignment: {
    findMany: vi.fn(),
  },
  quizAttempt: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  assignmentSubmission: {
    findMany: vi.fn(),
  },
}));

vi.mock("../../utils/prisma", () => ({ prisma: mockPrisma }));

describe("certificateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Defaults for models added after the initial mock was written — without
    // these, buildCourseCompletionMap throws "Cannot read properties of
    // undefined (reading 'findMany')" when it hits the missing mock.
    mockPrisma.packageEnrollment.findMany.mockResolvedValue([]);
    mockPrisma.batchCourseVisibility.findMany.mockResolvedValue([]);
    mockPrisma.quiz.findMany.mockResolvedValue([]);
    mockPrisma.assignment.findMany.mockResolvedValue([]);
    mockPrisma.quizAttempt.findMany.mockResolvedValue([]);
    mockPrisma.quizAttempt.findFirst.mockResolvedValue(null);
    mockPrisma.assignmentSubmission.findMany.mockResolvedValue([]);
  });

  describe("claimCertificate", () => {
    it("should create certificate when user is eligible", async () => {
      // Mock enrollment
      mockPrisma.enrollmentRequest.findMany.mockResolvedValue([
        { courseId: "course-1" },
      ]);

      // Mock existing certificates (none)
      mockPrisma.certificate.findMany.mockResolvedValue([]);

      // Mock course
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: "course-1",
          title: "Test Course",
          description: "Desc",
          category: null,
          thumbnailUrl: null,
          coverImageUrl: null,
          updatedAt: new Date(),
        },
      ]);

      // Mock package courses
      mockPrisma.packageCourse.findMany.mockResolvedValue([]);

      // Mock batches
      mockPrisma.batch.findMany.mockResolvedValue([
        { id: "batch-1", courseId: "course-1" },
      ]);

      // Mock recordings (all completed)
      mockPrisma.recording.findMany.mockResolvedValue([
        {
          id: "rec-1",
          session: { batchId: "batch-1", courseId: "course-1" },
          progress: [{ completedAt: new Date() }],
        },
      ]);

      // Mock existing cert check
      mockPrisma.certificate.findFirst.mockResolvedValue(null);

      // Mock create
      const mockCert = {
        id: "cert-1",
        userId: "user-1",
        courseId: "course-1",
        certificateNumber: "CERT-001",
        status: "ISSUED",
        issuedAt: new Date(),
      };
      mockPrisma.certificate.create.mockResolvedValue(mockCert as never);

      const result = await certificateService.claimCertificate(
        "user-1",
        "course-1",
      );

      expect(result).toEqual(mockCert);
      expect(mockPrisma.certificate.create).toHaveBeenCalledWith({
        data: { userId: "user-1", courseId: "course-1" },
      });
    });

    it("should throw error when course is not eligible", async () => {
      // Mock enrollment
      mockPrisma.enrollmentRequest.findMany.mockResolvedValue([
        { courseId: "course-1" },
      ]);

      // Mock existing certificates (none)
      mockPrisma.certificate.findMany.mockResolvedValue([]);

      // Mock course
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: "course-1",
          title: "Test Course",
          description: "Desc",
          category: null,
          thumbnailUrl: null,
          coverImageUrl: null,
          updatedAt: new Date(),
        },
      ]);

      // Mock package courses
      mockPrisma.packageCourse.findMany.mockResolvedValue([]);

      // Mock batches
      mockPrisma.batch.findMany.mockResolvedValue([
        { id: "batch-1", courseId: "course-1" },
      ]);

      // Mock recordings (NOT all completed)
      mockPrisma.recording.findMany.mockResolvedValue([
        {
          id: "rec-1",
          session: { batchId: "batch-1", courseId: "course-1" },
          progress: [], // Not completed
        },
      ]);

      await expect(
        certificateService.claimCertificate("user-1", "course-1"),
      ).rejects.toThrow("Certificate is not available to claim yet");
    });

    it("should throw if certificate already exists for this course", async () => {
      // Mock enrollment
      mockPrisma.enrollmentRequest.findMany.mockResolvedValue([
        { courseId: "course-1" },
      ]);

      // Mock existing certificates
      mockPrisma.certificate.findMany.mockResolvedValue([
        { id: "existing-cert", courseId: "course-1", issuedAt: new Date() },
      ]);

      // Mock course
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: "course-1",
          title: "Test Course",
          description: "Desc",
          category: null,
          thumbnailUrl: null,
          coverImageUrl: null,
          updatedAt: new Date(),
        },
      ]);

      // Mock package courses
      mockPrisma.packageCourse.findMany.mockResolvedValue([]);

      // Mock batches
      mockPrisma.batch.findMany.mockResolvedValue([
        { id: "batch-1", courseId: "course-1" },
      ]);

      // Mock recordings (all completed)
      mockPrisma.recording.findMany.mockResolvedValue([
        {
          id: "rec-1",
          session: { batchId: "batch-1", courseId: "course-1" },
          progress: [{ completedAt: new Date() }],
        },
      ]);

      // Already claimed course is NOT in claimable, so claimCertificate throws
      await expect(
        certificateService.claimCertificate("user-1", "course-1"),
      ).rejects.toThrow("Certificate is not available to claim yet");

      expect(mockPrisma.certificate.create).not.toHaveBeenCalled();
    });
  });

  describe("generatePdf", () => {
    it("should generate PDF buffer for valid certificate", async () => {
      // Mock certificate
      mockPrisma.certificate.findFirst.mockResolvedValue({
        id: "cert-1",
        certificateNumber: "CERT-001",
        issuedAt: new Date("2024-01-15"),
        course: { title: "Web Development", description: "Learn web dev" },
        user: { name: "John Doe", email: "john@example.com" },
      } as never);

      // Mock template
      mockPrisma.certificateTemplate.findFirst.mockResolvedValue(null);

      const result = await certificateService.generatePdf("user-1", "cert-1");

      expect(result).toHaveProperty("pdfBuffer");
      expect(result).toHaveProperty("fileName");
      expect(result.fileName).toBe("certificate-CERT-001.pdf");
      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.pdfBuffer.length).toBeGreaterThan(0);
    });

    it("should use template colors when template exists", async () => {
      // Mock certificate
      mockPrisma.certificate.findFirst.mockResolvedValue({
        id: "cert-1",
        certificateNumber: "CERT-002",
        issuedAt: new Date("2024-01-15"),
        course: { title: "React Course", description: "Learn React" },
        user: { name: "Jane Smith", email: "jane@example.com" },
      } as never);

      // Mock template with custom colors
      mockPrisma.certificateTemplate.findFirst.mockResolvedValue({
        id: "template-1",
        name: "Gold Template",
        primaryColor: "#d4af37",
        secondaryColor: "#f4e4bc",
        backgroundColor: "#fffdf5",
        textColor: "#2c2c2c",
        title: "CERTIFICATE OF ACHIEVEMENT",
        subtitle: "This is to certify that",
        footerText: "Gold Academy",
        logoUrl: null,
      } as never);

      const result = await certificateService.generatePdf("user-1", "cert-1");

      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.pdfBuffer.length).toBeGreaterThan(0);
    });

    it("should throw error for non-existent certificate", async () => {
      mockPrisma.certificate.findFirst.mockResolvedValue(null);

      await expect(
        certificateService.generatePdf("user-1", "non-existent"),
      ).rejects.toThrow("Certificate not found");
    });
  });

  describe("getMyCertificates", () => {
    it("should return empty arrays for user with no enrollments", async () => {
      mockPrisma.enrollmentRequest.findMany.mockResolvedValue([]);

      const result = await certificateService.getMyCertificates("user-1");

      expect(result.certificates).toEqual([]);
      expect(result.claimable).toEqual([]);
    });
  });
});
