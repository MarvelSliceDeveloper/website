

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin ────────────────────────────────────────────────────────────────
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

  // ─── Instructors ─────────────────────────────────────────────────────────
  const instructors = await Promise.all([
    upsertUser('instructor@lms.local', 'Demo Instructor', 'instructor123', 'INSTRUCTOR'),
    upsertUser('ravi.kumar@lms.local', 'Ravi Kumar', 'instructor123', 'INSTRUCTOR'),
    upsertUser('priya.mehta@lms.local', 'Priya Mehta', 'instructor123', 'INSTRUCTOR'),
    upsertUser('suresh.p@lms.local', 'Suresh P.', 'instructor123', 'INSTRUCTOR'),
    upsertUser('vikram.j@lms.local', 'Vikram J.', 'instructor123', 'INSTRUCTOR'),
    upsertUser('anita.r@lms.local', 'Anita R.', 'instructor123', 'INSTRUCTOR'),
  ]);
  const [demoInstructor, ravi, priya, suresh, vikram, anita] = instructors;
  console.log('✅ Instructors created');

  // ─── Students ─────────────────────────────────────────────────────────────
  const students = await Promise.all([
    upsertUser('student@lms.local', 'Demo Student', 'student123', 'STUDENT'),
    upsertUser('amit.sharma@example.com', 'Amit Sharma', 'student123', 'STUDENT'),
    upsertUser('neha.patel@example.com', 'Neha Patel', 'student123', 'STUDENT'),
    upsertUser('rohit.singh@example.com', 'Rohit Singh', 'student123', 'STUDENT'),
    upsertUser('priya.desai@example.com', 'Priya Desai', 'student123', 'STUDENT'),
    upsertUser('arjun.nair@example.com', 'Arjun Nair', 'student123', 'STUDENT'),
    upsertUser('sneha.reddy@example.com', 'Sneha Reddy', 'student123', 'STUDENT'),
  ]);
  const [demoStudent, ...moreStudents] = students;
  console.log('✅ Students created');

  // ─── Courses ──────────────────────────────────────────────────────────────
  const pythonCourse = await upsertCourse({
    slug: 'python-for-data-science',
    title: 'Python for Data Science',
    description: 'Master Python for data analysis, visualization, and machine learning.',
    price: 4999,
    category: 'Data Science',
    createdBy: ravi.id,
    tags: ['python', 'data-science', 'pandas', 'numpy'],
    learningObjectives: [
      'Write Python scripts with confidence',
      'Analyze data with Pandas & NumPy',
      'Create visualizations with Matplotlib',
      'Build machine learning models',
    ],
  });

  const reactCourse = await upsertCourse({
    slug: 'react-full-stack',
    title: 'React Full Stack',
    description: 'Build modern web apps with React, Next.js, and server components.',
    price: 3999,
    category: 'Frontend',
    createdBy: priya.id,
    tags: ['react', 'nextjs', 'frontend', 'javascript'],
    learningObjectives: [
      'Build reusable React components',
      'Master React Hooks and state management',
      'Build full-stack apps with Next.js',
      'Deploy production-ready applications',
    ],
  });

  const awsCourse = await upsertCourse({
    slug: 'aws-cloud-architecture',
    title: 'AWS Cloud Architecture',
    description: 'Learn AWS cloud computing from fundamentals to advanced architecture patterns.',
    price: 5499,
    category: 'Cloud',
    createdBy: suresh.id,
    tags: ['aws', 'cloud', 'devops', 'infrastructure'],
    learningObjectives: [
      'Design and deploy AWS infrastructure',
      'Master EC2, S3, VPC, and IAM',
      'Implement auto-scaling and high availability',
      'Apply cloud security best practices',
    ],
  });

  const jsCourse = await upsertCourse({
    slug: 'javascript-foundations',
    title: 'JavaScript Foundations',
    description: 'Core JavaScript concepts for beginners — from variables to closures.',
    price: 2499,
    category: 'Programming',
    createdBy: anita.id,
    tags: ['javascript', 'programming', 'web'],
    learningObjectives: [
      'Understand JS fundamentals and ES6+ features',
      'Work with DOM and browser APIs',
      'Master async programming with Promises',
      'Build interactive web pages',
    ],
  });

  console.log('✅ Courses created');

  // ─── Modules ──────────────────────────────────────────────────────────────
  await upsertModules(pythonCourse.id, [
    { title: 'Python Basics', description: 'Variables, data types, control flow.', order: 0 },
    { title: 'Data Structures', description: 'Lists, tuples, dicts, sets.', order: 1 },
    { title: 'File & IO', description: 'Reading and writing files.', order: 2 },
    { title: 'Pandas & NumPy', description: 'Data manipulation with Pandas and NumPy.', order: 3 },
    { title: 'Visualisation', description: 'Matplotlib and Seaborn.', order: 4 },
  ]);

  await upsertModules(reactCourse.id, [
    { title: 'React Basics', description: 'Components, JSX, props.', order: 0 },
    { title: 'Hooks & State', description: 'useState, useEffect, custom hooks.', order: 1 },
    { title: 'Server Components', description: 'React Server Components and Next.js.', order: 2 },
  ]);

  await upsertModules(awsCourse.id, [
    { title: 'AWS Fundamentals', description: 'Regions, AZs, IAM basics.', order: 0 },
    { title: 'Compute & Storage', description: 'EC2, S3, EBS, CloudFront.', order: 1 },
    { title: 'Networking & VPC', description: 'VPC, subnets, NAT, security groups.', order: 2 },
    { title: 'Security & IAM', description: 'IAM policies, roles, best practices.', order: 3 },
  ]);

  await upsertModules(jsCourse.id, [
    { title: 'JS Basics', description: 'Variables, functions, objects.', order: 0 },
    { title: 'DOM & Events', description: 'Manipulating the DOM, event handling.', order: 1 },
    { title: 'Async JS', description: 'Callbacks, Promises, async/await.', order: 2 },
  ]);

  console.log('✅ Modules created');

  // ─── Batches ──────────────────────────────────────────────────────────────
  const pythonBatch = await upsertBatch({
    courseId: pythonCourse.id,
    instructorId: ravi.id,
    name: 'Batch Jan 2025',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-03-30'),
    maxStudents: 30,
    status: 'ACTIVE',
    description: 'Python for Data Science cohort.',
  });

  const reactBatch = await upsertBatch({
    courseId: reactCourse.id,
    instructorId: priya.id,
    name: 'Batch Feb 2025',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-04-15'),
    maxStudents: 25,
    status: 'ACTIVE',
    description: 'React Full Stack cohort.',
  });

  const awsBatch = await upsertBatch({
    courseId: awsCourse.id,
    instructorId: suresh.id,
    name: 'Batch Mar 2025',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-05-30'),
    maxStudents: 30,
    status: 'ACTIVE',
    description: 'AWS Cloud Architecture cohort.',
  });

  const jsBatch = await upsertBatch({
    courseId: jsCourse.id,
    instructorId: anita.id,
    name: 'Batch Aug 2024',
    startDate: new Date('2024-08-01'),
    endDate: new Date('2024-09-30'),
    maxStudents: 25,
    status: 'COMPLETED',
    description: 'JavaScript Foundations completed cohort.',
  });

  console.log('✅ Batches created');

  // ─── Enrollments ──────────────────────────────────────────────────────────
  const enrollmentPairs: [typeof demoStudent, string][] = [
    [demoStudent, pythonBatch.id],
    [demoStudent, reactBatch.id],
    [demoStudent, awsBatch.id],
    [demoStudent, jsBatch.id],
    [moreStudents[0], pythonBatch.id],
    [moreStudents[1], pythonBatch.id],
    [moreStudents[2], reactBatch.id],
    [moreStudents[3], awsBatch.id],
    [moreStudents[4], pythonBatch.id],
    [moreStudents[5], reactBatch.id],
    [moreStudents[6], awsBatch.id],
  ];

  for (const [student, batchId] of enrollmentPairs) {
    const exists = await prisma.enrollmentRequest.findFirst({
      where: { userId: student.id, batchId },
    });
    if (!exists) {
      await prisma.enrollmentRequest.create({
        data: {
          userId: student.id,
          courseId: (await prisma.batch.findUnique({ where: { id: batchId } }))!.courseId,
          batchId,
          status: 'APPROVED',
          reviewedAt: new Date(),
        },
      });
    }
  }

  console.log('✅ Enrollments created');
  console.log('\n🎉 Seed complete!');
  console.log('   Admin (1):       admin@lms.local / admin123');
  console.log('   Instructors (6): instructor@lms.local / instructor123 (Ravi, Priya, Suresh, Vikram, Anita)');
  console.log('   Students (7):    student@lms.local / student123 (Amit, Neha, Rohit, Priya D, Arjun, Sneha)');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(email: string, name: string, password: string, role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT') {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash: hash, role },
  });
}

async function upsertCourse(data: {
  slug: string;
  title: string;
  description: string;
  price: number;
  category: string;
  createdBy: string;
  tags: string[];
  learningObjectives: string[];
}) {
  return prisma.course.upsert({
    where: { slug: data.slug },
    update: {},
    create: {
      ...data,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });
}

async function upsertModules(courseId: string, modules: { title: string; description: string; order: number }[]) {
  const existing = await prisma.module.count({ where: { courseId } });
  if (existing > 0) return;

  await prisma.module.createMany({
    data: modules.map((m) => ({
      courseId,
      title: m.title,
      description: m.description,
      order: m.order,
      durationSeconds: 1800,
      isFreePreview: m.order === 0,
    })),
  });
}

async function upsertBatch(data: {
  courseId: string;
  instructorId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  maxStudents: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  description: string;
}) {
  const existing = await prisma.batch.findFirst({
    where: { courseId: data.courseId, name: data.name },
  });
  if (existing) return existing;

  return prisma.batch.create({ data });
}

main()
  .catch((e: unknown) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

main()
  .catch((e: unknown) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());