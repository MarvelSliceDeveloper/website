import { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { jsPDF } from "jspdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import path from "path";
import fs from "fs/promises";

type CertificateSummary = {
  id: string;
  courseId: string;
  issuedAt: Date;
  course: {
    id: string;
    title: string;
    description: string;
    category: string | null;
    thumbnailUrl: string | null;
    coverImageUrl: string | null;
    updatedAt: Date;
  };
  totalRecordings: number;
  completedRecordings: number;
  progressPercent: number;
};

type ClaimableCertificate = {
  courseId: string;
  course: CertificateSummary["course"];
  totalRecordings: number;
  completedRecordings: number;
  progressPercent: number;
};

// Builds a map of completed courses and claimable certificates
async function buildCourseCompletionMap(userId: string) {
  const enrollments = await prisma.enrollmentRequest.findMany({
    where: { userId, status: "APPROVED" },
    select: { courseId: true },
  });

  const courseIds = [
    ...new Set(enrollments.map((enrollment) => enrollment.courseId)),
  ];
  if (courseIds.length === 0) {
    return {
      certificates: [] as CertificateSummary[],
      claimable: [] as ClaimableCertificate[],
    };
  }

  // Start all independent queries in parallel
  const [certificates, courses, pkgCourseRows] = await Promise.all([
    prisma.certificate.findMany({
      where: { userId, courseId: { in: courseIds } },
      select: { id: true, courseId: true, issuedAt: true },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        thumbnailUrl: true,
        coverImageUrl: true,
        updatedAt: true,
      },
    }),
    prisma.packageCourse.findMany({
      where: { courseId: { in: courseIds } },
      select: { packageId: true },
    }),
  ]);

  const packageIds = pkgCourseRows.map((pc) => pc.packageId);

  // Fetch regular batches (with courseId) AND package-only batches whose package contains these courses
  const batches = await prisma.batch.findMany({
    where: {
      OR: [
        { courseId: { in: courseIds } },
        ...(packageIds.length
          ? [{ courseId: null as string | null, packageId: { in: packageIds } }]
          : []),
      ],
    },
    select: { id: true, courseId: true },
  });

  const batchIds = batches.map((batch) => batch.id);

  const recordings = batchIds.length
    ? await prisma.recording.findMany({
        where: { session: { batchId: { in: batchIds } } },
        select: {
          id: true,
          session: { select: { batchId: true, courseId: true } },
          progress: {
            where: { userId },
            select: { completedAt: true },
          },
        },
      })
    : [];

  const recordingsByCourse = new Map<
    string,
    { total: number; completed: number }
  >();
  for (const courseId of courseIds) {
    recordingsByCourse.set(courseId, { total: 0, completed: 0 });
  }

  for (const recording of recordings) {
    // Use session.courseId (direct field) when available, fall back to batch.courseId
    const courseId =
      recording.session.courseId ??
      batches.find((b) => b.id === recording.session.batchId)?.courseId;
    if (!courseId) continue;

    const stats = recordingsByCourse.get(courseId);
    if (!stats) continue;

    stats.total += 1;
    if (recording.progress.some((progress) => progress.completedAt)) {
      stats.completed += 1;
    }
  }

  const issuedCourseIds = new Set(
    certificates.map((certificate) => certificate.courseId),
  );
  const courseById = new Map(courses.map((course) => [course.id, course]));

  const issued = certificates
    .map((certificate) => {
      const course = courseById.get(certificate.courseId);
      if (!course) return null;

      const stats = recordingsByCourse.get(certificate.courseId) || {
        total: 0,
        completed: 0,
      };

      return {
        id: certificate.id,
        courseId: certificate.courseId,
        issuedAt: certificate.issuedAt,
        course,
        totalRecordings: stats.total,
        completedRecordings: stats.completed,
        progressPercent:
          stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0,
      };
    })
    .filter(Boolean) as CertificateSummary[];

  const claimable: ClaimableCertificate[] = [];
  for (const courseId of courseIds) {
    const course = courseById.get(courseId);
    const stats = recordingsByCourse.get(courseId);

    if (!course || !stats || stats.total === 0) continue;
    if (issuedCourseIds.has(courseId)) continue;
    if (stats.completed !== stats.total) continue;

    claimable.push({
      courseId,
      course,
      totalRecordings: stats.total,
      completedRecordings: stats.completed,
      progressPercent: 100,
    });
  }

  return { certificates: issued, claimable };
}

export const certificateService = {
  // Gets all issued and claimable certificates for a user
  async getMyCertificates(userId: string) {
    return buildCourseCompletionMap(userId);
  },

  // Claims a certificate for a user if eligible
  async claimCertificate(userId: string, courseId: string) {
    const { claimable } = await buildCourseCompletionMap(userId);
    const eligible = claimable.find((item) => item.courseId === courseId);

    if (!eligible) {
      throw new Error("Certificate is not available to claim yet");
    }

    // Fast path: already exists
    const existing = await prisma.certificate.findFirst({
      where: { userId, courseId },
    });
    if (existing) {
      return existing;
    }

    // Create atomically — @@unique constraint handles concurrent duplicates
    try {
      return await prisma.certificate.create({
        data: { userId, courseId },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // Concurrent create won — return what the other request created
        return prisma.certificate.findFirstOrThrow({
          where: { userId, courseId },
        });
      }
      throw err;
    }
  },

  // Generates a PDF certificate — supports two methods:
  // 1. jsPDF generated (default) — dynamically renders with template styling
  // 2. Uploaded PDF with overlay — loads a pre-designed PDF and overlays text at defined coordinates
  async generatePdf(userId: string, certificateId: string) {
    const certificate = await prisma.certificate.findFirst({
      where: { id: certificateId, userId },
      include: {
        course: { select: { title: true, description: true } },
        user: { select: { name: true, email: true } },
        uploadedTemplate: true,
      },
    });

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    if (certificate.uploadedTemplate?.pdfTemplateUrl && certificate.uploadedTemplate.pdfTemplateType === "uploadedPdf") {
      return this.generateFromUploadedTemplate(certificate);
    }

    return this.generateFromJsPdf(certificate);
  },

  // Uses uploaded PDF as background and overlays text at defined field positions
  async generateFromUploadedTemplate(certificate: any) {
    const template = certificate.uploadedTemplate;
    const templatePath = template.pdfTemplateUrl;

    if (!templatePath) {
      return this.generateFromJsPdf(certificate);
    }

    let pdfBytes: Uint8Array;
    try {
      const absolutePath = path.isAbsolute(templatePath)
        ? templatePath
        : path.resolve(__dirname, "../../../uploads", templatePath);
      pdfBytes = await fs.readFile(absolutePath);
    } catch {
      return this.generateFromJsPdf(certificate);
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fields = (template.pdfTemplateFields || []) as Array<{
      key: string;
      x: number;
      y: number;
      fontSize: number;
      color: string;
      align: string;
    }>;

    const values: Record<string, string> = {
      studentName: certificate.user.name || "Student",
      courseName: certificate.course.title,
      date: new Date(certificate.issuedAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      }),
      certificateNumber: certificate.certificateNumber,
      verifyUrl: `${process.env.WEB_URL || "https://lms.local"}/verify/${certificate.id}`,
    };

    for (const field of fields) {
      const text = values[field.key] || "";
      if (!text) continue;

      const font = field.key === "studentName" || field.key === "courseName" || field.key === "certificateNumber"
        ? helveticaBold : helveticaFont;

      const hexColor = field.color || "#1e293b";
      const r = parseInt(hexColor.slice(1, 3), 16) / 255;
      const g = parseInt(hexColor.slice(3, 5), 16) / 255;
      const b = parseInt(hexColor.slice(5, 7), 16) / 255;

      const { width } = helveticaFont.widthOfTextAtSize(text, field.fontSize || 22);
      const pageWidth = firstPage.getWidth();
      let xPos = field.x;

      if (field.align === "center") {
        xPos = pageWidth / 2 - width / 2 + field.x;
      } else if (field.align === "right") {
        xPos = pageWidth - width - field.x;
      }

      firstPage.drawText(text, {
        x: xPos,
        y: firstPage.getHeight() - field.y,
        size: field.fontSize || 22,
        font,
        color: rgb(r, g, b),
      });
    }

    const modifiedPdfBytes = await pdfDoc.save();

    return {
      pdfBuffer: Buffer.from(modifiedPdfBytes),
      fileName: `certificate-${certificate.certificateNumber}.pdf`,
    };
  },

  // Generates a styled certificate using jsPDF with template colors/fonts
  async generateFromJsPdf(certificate: any) {
    const template = await prisma.certificateTemplate.findFirst({
      where: { isDefault: true },
    });

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : { r: 0, g: 0, b: 0 };
    };

    const primaryRgb = hexToRgb(template?.primaryColor || "#3b82f6");
    const bgRgb = hexToRgb(template?.backgroundColor || "#f8fafc");
    const textRgb = hexToRgb(template?.textColor || "#1e293b");
    const borderRgb = hexToRgb(template?.borderColor || template?.primaryColor || "#3b82f6");
    const accentRgb = hexToRgb(template?.accentColor || template?.secondaryColor || "#93c5fd");

    const fontFamily = template?.fontFamily || "helvetica";
    const titleFontSize = template?.titleFontSize || 28;
    const nameFontSize = template?.nameFontSize || 22;
    const borderWidth = template?.borderWidth ?? 2;
    const borderRadius = template?.borderRadius ?? 5;
    const showBorder = template?.showBorder ?? true;
    const showSignatureLine = template?.showSignatureLine ?? true;
    const showVerificationUrl = template?.showVerificationUrl ?? true;
    const backgroundPattern = template?.backgroundPattern || "none";

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    if (backgroundPattern === "dots") {
      doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
      for (let x = 20; x < pageWidth - 10; x += 15)
        for (let y = 20; y < pageHeight - 10; y += 15) doc.circle(x, y, 0.5, "F");
    } else if (backgroundPattern === "lines") {
      doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setLineWidth(0.2);
      for (let y = 20; y < pageHeight - 10; y += 12) doc.line(15, y, pageWidth - 15, y);
    } else if (backgroundPattern === "corners") {
      doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setLineWidth(0.8);
      doc.line(15, 15, 15, 35); doc.line(15, 15, 35, 15);
      doc.line(pageWidth - 15, 15, pageWidth - 15, 35); doc.line(pageWidth - 15, 15, pageWidth - 35, 15);
      doc.line(15, pageHeight - 15, 15, pageHeight - 35); doc.line(15, pageHeight - 15, 35, pageHeight - 15);
      doc.line(pageWidth - 15, pageHeight - 15, pageWidth - 15, pageHeight - 35);
      doc.line(pageWidth - 15, pageHeight - 15, pageWidth - 35, pageHeight - 15);
    }

    if (showBorder) {
      doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
      doc.setLineWidth(borderWidth);
      doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, borderRadius, borderRadius);
      doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setLineWidth(0.5);
      doc.roundedRect(14, 14, pageWidth - 28, pageHeight - 28, Math.max(borderRadius - 1, 1), Math.max(borderRadius - 1, 1));
    }

    let contentStartY = 35;
    if (template?.logoUrl) {
      try { doc.addImage(template.logoUrl, "PNG", pageWidth / 2 - 15, 18, 30, 30); contentStartY = 55; } catch { }
    }

    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(pageWidth / 2 - 40, contentStartY - 8, 80, 1, "F");

    doc.setFont(fontFamily, "bold");
    doc.setFontSize(titleFontSize);
    doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
    doc.text(template?.title || "CERTIFICATE OF COMPLETION", pageWidth / 2, contentStartY + 5, { align: "center" });

    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(pageWidth / 2 - 40, contentStartY + 10, 80, 0.5, "F");

    doc.setFont(fontFamily, "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(template?.subtitle || "This certifies that", pageWidth / 2, contentStartY + 22, { align: "center" });

    doc.setFont(fontFamily, "bold");
    doc.setFontSize(nameFontSize);
    doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
    doc.text(certificate.user.name || "Student", pageWidth / 2, contentStartY + 35, { align: "center" });

    const nameWidth = doc.getTextWidth(certificate.user.name || "Student");
    doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - nameWidth / 2 - 10, contentStartY + 38, pageWidth / 2 + nameWidth / 2 + 10, contentStartY + 38);

    doc.setFont(fontFamily, "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text("has successfully completed the course", pageWidth / 2, contentStartY + 48, { align: "center" });

    doc.setFont(fontFamily, "bold");
    doc.setFontSize(18);
    doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
    const splitTitle = doc.splitTextToSize(certificate.course.title, pageWidth - 80);
    doc.text(splitTitle, pageWidth / 2, contentStartY + 60, { align: "center" });

    const issuedDate = new Date(certificate.issuedAt).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });

    doc.setFont(fontFamily, "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);

    const bottomY = pageHeight - 35;
    doc.text(`Issued: ${issuedDate}`, pageWidth / 2 - 60, bottomY, { align: "center" });
    doc.text(`Certificate #: ${certificate.certificateNumber}`, pageWidth / 2 + 60, bottomY, { align: "center" });

    if (showSignatureLine) {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(pageWidth / 2 - 50, bottomY + 12, pageWidth / 2 + 50, bottomY + 12);
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("Authorized Signature", pageWidth / 2, bottomY + 17, { align: "center" });
    }

    if (showVerificationUrl) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const verifyUrl = `${process.env.WEB_URL || "https://lms.local"}/verify/${certificate.id}`;
      doc.text(
        template?.footerText ? `${template.footerText} | Verify: ${verifyUrl}` : `Verify at: ${verifyUrl}`,
        pageWidth / 2, pageHeight - 18, { align: "center" },
      );
    } else if (template?.footerText) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(template.footerText, pageWidth / 2, pageHeight - 18, { align: "center" });
    }

    return {
      pdfBuffer: Buffer.from(doc.output("arraybuffer")),
      fileName: `certificate-${certificate.certificateNumber}.pdf`,
    };
  },
};
