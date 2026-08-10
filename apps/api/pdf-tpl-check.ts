import fs from "fs";

const env = fs.readFileSync("D:/Harish Kumar/Project/LMS/.env", "utf8");
process.env.DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)![1];

async function main() {
  const { prisma } = await import("./src/utils/prisma");
  const { certificateService } = await import(
    "./src/modules/certificates/certificate.service"
  );

  const defaultTemplate = await prisma.certificateTemplate.findFirst({
    where: { isDefault: true },
  });
  console.log("DEFAULT TEMPLATE:", JSON.stringify(defaultTemplate));

  if (!defaultTemplate?.pdfTemplateUrl) {
    console.log("=> No uploaded PDF on the default template (pdfTemplateUrl is null)");
  } else {
    const abs = require("path").isAbsolute(defaultTemplate.pdfTemplateUrl)
      ? defaultTemplate.pdfTemplateUrl
      : require("path").join(
          require("path").resolve(__dirname, "..", "uploads"),
          defaultTemplate.pdfTemplateUrl,
        );
    console.log("EXPECTED FILE:", abs, "EXISTS:", fs.existsSync(abs));
  }

  const created = await prisma.certificate.create({
    data: {
      userId: "cmsj0htiy0008ffg0yvefvc21",
      courseId: "cmsj0hye8000lffg0m20cz9jw",
      autoIssued: true,
      status: "ISSUED",
    },
  });

  try {
    const out = await certificateService.generatePdf(
      "cmsj0htiy0008ffg0yvefvc21",
      created.id,
    );
    console.log("GENERATED:", out.fileName, "bytes:", out.pdfBuffer.length);
  } finally {
    await prisma.certificate.delete({ where: { id: created.id } });
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("ERROR", err);
  process.exit(1);
});