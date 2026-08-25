import fs from "fs";
import path from "path";

const env = fs.readFileSync("D:/Harish Kumar/Project/LMS/.env", "utf8");
process.env.DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)![1];

async function main() {
  const { prisma } = await import("./src/utils/prisma");
  const templates = await prisma.certificateTemplate.findMany({
    select: {
      id: true,
      name: true,
      isDefault: true,
      pdfTemplateType: true,
      pdfTemplateUrl: true,
    },
  });
  console.log("TEMPLATES:", JSON.stringify(templates));

  const uploadsDir = path.resolve(
    __dirname,
    "..",
    "uploads",
    "certificate-templates",
  );
  console.log("UPLOADS DIR:", uploadsDir, "EXISTS:", fs.existsSync(uploadsDir));
  if (fs.existsSync(uploadsDir)) {
    console.log("FILES:", JSON.stringify(fs.readdirSync(uploadsDir)));
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("ERROR", err);
  process.exit(1);
});
