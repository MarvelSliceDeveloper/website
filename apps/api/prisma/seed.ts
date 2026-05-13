import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Admin user ---
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.local' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@lms.local',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin:', admin.email);

  // --- Instructor user ---
  const instructorHash = await bcrypt.hash('instructor123', 10);
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@lms.local' },
    update: {},
    create: {
      name: 'Demo Instructor',
      email: 'instructor@lms.local',
      passwordHash: instructorHash,
      role: 'INSTRUCTOR',
    },
  });
  console.log('✅ Instructor:', instructor.email);

  // --- Student user ---
  const studentHash = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@lms.local' },
    update: {},
    create: {
      name: 'Demo Student',
      email: 'student@lms.local',
      passwordHash: studentHash,
      role: 'STUDENT',
    },
  });
  console.log('✅ Student:', student.email);

  // --- Demo Course ---
  const course = await prisma.course.upsert({
    where: { slug: 'intro-to-typescript' },
    update: {},
    create: {
      title: 'Introduction to TypeScript',
      slug: 'intro-to-typescript',
      description: 'A comprehensive beginner course on TypeScript — types, interfaces, generics, and more.',
      price: 2999,
      category: 'Programming',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      createdBy: admin.id,
      tags: ['typescript', 'javascript', 'programming'],
      learningObjectives: [
        'Understand TypeScript type system',
        'Build type-safe applications',
        'Use generics and utility types',
      ],
    },
  });
  console.log('✅ Course:', course.title);

  // --- Demo Modules ---
  const existingModules = await prisma.module.count({ where: { courseId: course.id } });
  if (existingModules === 0) {
    await prisma.module.createMany({
      data: [
        {
          courseId: course.id,
          title: 'Getting Started with TypeScript',
          description: 'Setup, tooling, and your first .ts file.',
          order: 0,
          videoType: 'youtube',
          videoUrl: 'https://www.youtube.com/watch?v=BwuLxPH8IDs',
          videoEmbedId: 'BwuLxPH8IDs',
          durationSeconds: 1200,
          isFreePreview: true,
        },
        {
          courseId: course.id,
          title: 'Types and Interfaces',
          description: 'Primitive types, type aliases, and interface definitions.',
          order: 1,
          videoType: 'youtube',
          videoUrl: 'https://www.youtube.com/watch?v=WlsTVZ0nFWk',
          videoEmbedId: 'WlsTVZ0nFWk',
          durationSeconds: 1800,
          isFreePreview: false,
        },
        {
          courseId: course.id,
          title: 'Generics and Utility Types',
          description: 'Building reusable code with generics, Partial, Required, and more.',
          order: 2,
          durationSeconds: 2400,
          isFreePreview: false,
        },
      ],
    });
    console.log('✅ Modules created');
  }

  // --- Demo Batch ---
  const existingBatch = await prisma.batch.findFirst({
    where: { courseId: course.id },
  });
  if (!existingBatch) {
    const batch = await prisma.batch.create({
      data: {
        courseId: course.id,
        instructorId: instructor.id,
        name: 'TypeScript Batch — June 2025',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-08-31'),
        maxStudents: 30,
        status: 'UPCOMING',
        description: 'First cohort for the TypeScript course.',
      },
    });
    console.log('✅ Batch:', batch.name);

    // Enroll demo student
    await prisma.enrollmentRequest.create({
      data: {
        userId: student.id,
        courseId: course.id,
        batchId: batch.id,
        status: 'APPROVED',
        reviewedAt: new Date(),
      },
    });
    console.log('✅ Student enrolled in batch');
  }

  console.log('\n🎉 Seed complete!');
  console.log('   Admin:      admin@lms.local / admin123');
  console.log('   Instructor: instructor@lms.local / instructor123');
  console.log('   Student:    student@lms.local / student123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
