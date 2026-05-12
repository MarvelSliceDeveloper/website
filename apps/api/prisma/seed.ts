import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const studentPasswordHash = await bcrypt.hash('student123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@lms.local' },
    update: {
      name: 'Admin Demo',
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
    },
    create: {
      name: 'Admin Demo',
      email: 'admin@lms.local',
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@lms.local' },
    update: {
      name: 'Student Demo',
      role: Role.STUDENT,
      passwordHash: studentPasswordHash,
    },
    create: {
      name: 'Student Demo',
      email: 'student@lms.local',
      role: Role.STUDENT,
      passwordHash: studentPasswordHash,
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
