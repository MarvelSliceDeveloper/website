import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Super Admin ────────────────────────────────────────────────────────────
  const superAdminHash = await bcrypt.hash("superadmin123", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@lms.local" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@lms.local",
      passwordHash: superAdminHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ Super Admin:", superAdmin.email);

  // ─── System Settings ────────────────────────────────────────────────────────
  const defaultSettings = [
    {
      key: "super_admin_id",
      value: superAdmin.id,
      type: "string",
      description: "Auto-set when SUPER_ADMIN exists",
    },
    {
      key: "platform_name",
      value: "Marvel Slice LMS",
      type: "string",
      description: "Display name for the LMS",
    },
    {
      key: "default_session_duration",
      value: "60",
      type: "number",
      description: "Default meeting length in minutes",
    },
    {
      key: "max_students_per_batch",
      value: "100",
      type: "number",
      description: "Global hard cap per batch",
    },
    {
      key: "session_timeout_admin",
      value: "480",
      type: "number",
      description: "Admin session timeout in minutes",
    },
    {
      key: "session_timeout_instructor",
      value: "480",
      type: "number",
      description: "Instructor session timeout in minutes",
    },
    {
      key: "session_timeout_student",
      value: "480",
      type: "number",
      description: "Student session timeout in minutes",
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("✅ System settings seeded");

  // ─── Admin ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@lms.local" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@lms.local",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin:", admin.email);

  // ─── Instructors ─────────────────────────────────────────────────────────
  const instructors = await Promise.all([
    upsertUser(
      "instructor@lms.local",
      "Demo Instructor",
      "instructor123",
      "INSTRUCTOR",
    ),
    upsertUser(
      "ravi.kumar@lms.local",
      "Ravi Kumar",
      "instructor123",
      "INSTRUCTOR",
    ),
    upsertUser(
      "priya.mehta@lms.local",
      "Priya Mehta",
      "instructor123",
      "INSTRUCTOR",
    ),
    upsertUser(
      "suresh.p@lms.local",
      "Suresh P.",
      "instructor123",
      "INSTRUCTOR",
    ),
    upsertUser(
      "vikram.j@lms.local",
      "Vikram J.",
      "instructor123",
      "INSTRUCTOR",
    ),
    upsertUser("anita.r@lms.local", "Anita R.", "instructor123", "INSTRUCTOR"),
  ]);
  const [demoInstructor, ravi, priya, suresh, vikram, anita] = instructors;
  console.log("✅ Instructors created");

  // ─── Students ─────────────────────────────────────────────────────────────
  const students = await Promise.all([
    upsertUser("student@lms.local", "Demo Student", "student123", "STUDENT"),
    upsertUser(
      "amit.sharma@example.com",
      "Amit Sharma",
      "student123",
      "STUDENT",
    ),
    upsertUser("neha.patel@example.com", "Neha Patel", "student123", "STUDENT"),
    upsertUser(
      "rohit.singh@example.com",
      "Rohit Singh",
      "student123",
      "STUDENT",
    ),
    upsertUser(
      "priya.desai@example.com",
      "Priya Desai",
      "student123",
      "STUDENT",
    ),
    upsertUser("arjun.nair@example.com", "Arjun Nair", "student123", "STUDENT"),
    upsertUser(
      "sneha.reddy@example.com",
      "Sneha Reddy",
      "student123",
      "STUDENT",
    ),
  ]);
  const [demoStudent, ...moreStudents] = students;
  console.log("✅ Students created");

  // ─── Courses ──────────────────────────────────────────────────────────────
  const pythonCourse = await upsertCourse({
    slug: "python-for-data-science",
    title: "Python for Data Science",
    description:
      "Master Python for data analysis, visualization, and machine learning.",
    price: 4999,
    category: "Data Science",
    createdBy: ravi.id,
    tags: ["python", "data-science", "pandas", "numpy"],
    learningObjectives: [
      "Write Python scripts with confidence",
      "Analyze data with Pandas & NumPy",
      "Create visualizations with Matplotlib",
      "Build machine learning models",
    ],
  });

  const reactCourse = await upsertCourse({
    slug: "react-full-stack",
    title: "React Full Stack",
    description:
      "Build modern web apps with React, Next.js, and server components.",
    price: 3999,
    category: "Frontend",
    createdBy: priya.id,
    tags: ["react", "nextjs", "frontend", "javascript"],
    learningObjectives: [
      "Build reusable React components",
      "Master React Hooks and state management",
      "Build full-stack apps with Next.js",
      "Deploy production-ready applications",
    ],
  });

  const awsCourse = await upsertCourse({
    slug: "aws-cloud-architecture",
    title: "AWS Cloud Architecture",
    description:
      "Learn AWS cloud computing from fundamentals to advanced architecture patterns.",
    price: 5499,
    category: "Cloud",
    createdBy: suresh.id,
    tags: ["aws", "cloud", "devops", "infrastructure"],
    learningObjectives: [
      "Design and deploy AWS infrastructure",
      "Master EC2, S3, VPC, and IAM",
      "Implement auto-scaling and high availability",
      "Apply cloud security best practices",
    ],
  });

  const jsCourse = await upsertCourse({
    slug: "javascript-foundations",
    title: "JavaScript Foundations",
    description:
      "Core JavaScript concepts for beginners — from variables to closures.",
    price: 2499,
    category: "Programming",
    createdBy: anita.id,
    tags: ["javascript", "programming", "web"],
    learningObjectives: [
      "Understand JS fundamentals and ES6+ features",
      "Work with DOM and browser APIs",
      "Master async programming with Promises",
      "Build interactive web pages",
    ],
  });

  console.log("✅ Courses created");

  // ─── Modules (containers) ─────────────────────────────────────────────────
  const pythonModules = await upsertModules(pythonCourse.id, [
    {
      title: "Python Fundamentals",
      description: "Core Python concepts.",
      order: 0,
    },
    { title: "Data Manipulation", description: "Working with data.", order: 1 },
    {
      title: "Visualisation & ML",
      description: "Charts and machine learning.",
      order: 2,
    },
  ]);

  const reactModules = await upsertModules(reactCourse.id, [
    { title: "React Core", description: "Components, JSX, props.", order: 0 },
    {
      title: "Advanced React",
      description: "Hooks, state, patterns.",
      order: 1,
    },
    {
      title: "Next.js",
      description: "Server Components and routing.",
      order: 2,
    },
  ]);

  const awsModules = await upsertModules(awsCourse.id, [
    { title: "AWS Core", description: "Fundamentals and IAM.", order: 0 },
    { title: "Compute & Storage", description: "EC2, S3, EBS.", order: 1 },
    {
      title: "Networking & Security",
      description: "VPC, security groups, best practices.",
      order: 2,
    },
  ]);

  const jsModules = await upsertModules(jsCourse.id, [
    {
      title: "JS Fundamentals",
      description: "Variables, functions, objects.",
      order: 0,
    },
    {
      title: "DOM & Async",
      description: "DOM manipulation and async JS.",
      order: 1,
    },
  ]);

  console.log("✅ Modules created");

  // ─── Lessons ──────────────────────────────────────────────────────────────
  await upsertLessons(pythonModules[0].id, [
    {
      title: "Variables & Data Types",
      description: "Strings, numbers, booleans.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 900,
      order: 0,
    },
    {
      title: "Control Flow",
      description: "if/else, loops.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1200,
      order: 1,
    },
    {
      title: "Functions",
      description: "Defining and calling functions.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1100,
      order: 2,
    },
  ]);
  await upsertLessons(pythonModules[1].id, [
    {
      title: "Lists & Tuples",
      description: "Ordered collections.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1000,
      order: 0,
    },
    {
      title: "Dicts & Sets",
      description: "Key-value pairs and unique sets.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 900,
      order: 1,
    },
  ]);
  await upsertLessons(pythonModules[2].id, [
    {
      title: "Matplotlib Basics",
      description: "Line charts, bar charts.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1300,
      order: 0,
    },
    {
      title: "NumPy Intro",
      description: "Arrays and vector operations.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1100,
      order: 1,
    },
  ]);

  await upsertLessons(reactModules[0].id, [
    {
      title: "JSX & Components",
      description: "Building blocks of React.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1000,
      order: 0,
    },
    {
      title: "Props & State",
      description: "Data flow in React.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1200,
      order: 1,
    },
  ]);
  await upsertLessons(reactModules[1].id, [
    {
      title: "useState & useEffect",
      description: "Core hooks.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1100,
      order: 0,
    },
    {
      title: "Custom Hooks",
      description: "Reusable logic.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 900,
      order: 1,
    },
  ]);
  await upsertLessons(reactModules[2].id, [
    {
      title: "Server Components",
      description: "RSC and data fetching.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1200,
      order: 0,
    },
  ]);

  await upsertLessons(awsModules[0].id, [
    {
      title: "AWS Regions & AZs",
      description: "Global infrastructure.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 800,
      order: 0,
    },
    {
      title: "IAM Policies",
      description: "Users, groups, roles.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1000,
      order: 1,
    },
  ]);
  await upsertLessons(awsModules[1].id, [
    {
      title: "EC2 Instances",
      description: "Virtual servers.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1200,
      order: 0,
    },
    {
      title: "S3 Storage",
      description: "Object storage.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 900,
      order: 1,
    },
  ]);
  await upsertLessons(awsModules[2].id, [
    {
      title: "VPC & Subnets",
      description: "Network isolation.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1100,
      order: 0,
    },
    {
      title: "Security Best Practices",
      description: "Securing your cloud.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1000,
      order: 1,
    },
  ]);

  await upsertLessons(jsModules[0].id, [
    {
      title: "Variables & Scope",
      description: "var, let, const, hoisting.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 900,
      order: 0,
    },
    {
      title: "Functions & Closures",
      description: "First-class functions.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1100,
      order: 1,
    },
  ]);
  await upsertLessons(jsModules[1].id, [
    {
      title: "DOM Manipulation",
      description: "Selecting and updating DOM.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1000,
      order: 0,
    },
    {
      title: "Promises & Async/Await",
      description: "Async programming.",
      videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      durationSeconds: 1200,
      order: 1,
    },
  ]);

  console.log("✅ Lessons created");

  // ─── Batches ──────────────────────────────────────────────────────────────
  const pythonBatch = await upsertBatch({
    courseId: pythonCourse.id,
    instructorId: ravi.id,
    name: "Batch Jan 2025",
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-03-30"),
    maxStudents: 30,
    status: "ACTIVE",
    description: "Python for Data Science cohort.",
  });

  const reactBatch = await upsertBatch({
    courseId: reactCourse.id,
    instructorId: priya.id,
    name: "Batch Feb 2025",
    startDate: new Date("2025-02-01"),
    endDate: new Date("2025-04-15"),
    maxStudents: 25,
    status: "ACTIVE",
    description: "React Full Stack cohort.",
  });

  const awsBatch = await upsertBatch({
    courseId: awsCourse.id,
    instructorId: suresh.id,
    name: "Batch Mar 2025",
    startDate: new Date("2025-03-01"),
    endDate: new Date("2025-05-30"),
    maxStudents: 30,
    status: "ACTIVE",
    description: "AWS Cloud Architecture cohort.",
  });

  const jsBatch = await upsertBatch({
    courseId: jsCourse.id,
    instructorId: anita.id,
    name: "Batch Aug 2024",
    startDate: new Date("2024-08-01"),
    endDate: new Date("2024-09-30"),
    maxStudents: 25,
    status: "COMPLETED",
    description: "JavaScript Foundations completed cohort.",
  });

  console.log("✅ Batches created");

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
  ];

  for (const [student, batchId] of enrollmentPairs) {
    const exists = await prisma.enrollmentRequest.findFirst({
      where: { userId: student.id, batchId },
    });
    if (!exists) {
      await prisma.enrollmentRequest.create({
        data: {
          userId: student.id,
          courseId: (await prisma.batch.findUnique({ where: { id: batchId } }))!
            .courseId,
          batchId,
          status: "APPROVED",
          reviewedAt: new Date(),
        },
      });
    }
  }

  console.log("✅ Enrollments created");

  // ─── Notification Preferences ──────────────────────────────────────────
  const allUsers = [
    admin,
    demoInstructor,
    ravi,
    priya,
    suresh,
    vikram,
    anita,
    demoStudent,
    ...moreStudents,
  ];
  const notifTypes = [
    "SESSION_SCHEDULED",
    "SESSION_CANCELLED",
    "RECORDING_AVAILABLE",
    "ENROLLMENT_APPROVED",
    "ENROLLMENT_REJECTED",
    "ASSIGNMENT_GRADED",
    "MENTORSHIP_CREATED",
    "MENTORSHIP_ASSIGNED",
    "MENTORSHIP_SCHEDULED",
    "MENTORSHIP_COMPLETED",
    "MENTORSHIP_CANCELLED",
    "SUPPORT_TICKET_CREATED",
    "SUPPORT_TICKET_RESPONDED",
    "SUPPORT_TICKET_STATUS_CHANGED",
    "CUSTOM_NOTIFICATION",
  ];

  for (const user of allUsers) {
    for (const type of notifTypes) {
      await prisma.notificationPreference.upsert({
        where: { userId_type: { userId: user.id, type } },
        update: {},
        create: { userId: user.id, type, enabled: true, email: true },
      });
    }
  }

  console.log("✅ Notification preferences seeded");

  console.log("\n🎉 Seed complete!");
  console.log("   Super Admin (1): superadmin@lms.local / superadmin123");
  console.log("   Admin (1):       admin@lms.local / admin123");
  console.log(
    "   Instructors (6): instructor@lms.local / instructor123 (Ravi, Priya, Suresh, Vikram, Anita)",
  );
  console.log(
    "   Students (7):    student@lms.local / student123 (Amit, Neha, Rohit, Priya D, Arjun, Sneha)",
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(
  email: string,
  name: string,
  password: string,
  role: "SUPER_ADMIN" | "ADMIN" | "INSTRUCTOR" | "STUDENT",
) {
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
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
}

async function upsertModules(
  courseId: string,
  modules: { title: string; description: string; order: number }[],
) {
  const existing = await prisma.module.count({ where: { courseId } });
  if (existing > 0) {
    return prisma.module.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });
  }

  await prisma.module.createMany({
    data: modules.map((m) => ({
      courseId,
      title: m.title,
      description: m.description,
      order: m.order,
      isFreePreview: m.order === 0,
    })),
  });

  return prisma.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
  });
}

async function upsertLessons(
  moduleId: string,
  lessons: {
    title: string;
    description: string;
    videoUrl: string;
    durationSeconds: number;
    order: number;
  }[],
) {
  const existing = await prisma.lesson.count({ where: { moduleId } });
  if (existing > 0) return;

  await prisma.lesson.createMany({
    data: lessons.map((l) => ({
      moduleId,
      title: l.title,
      description: l.description,
      order: l.order,
      videoType: "youtube",
      videoUrl: l.videoUrl,
      videoEmbedId: "dQw4w9WgXcQ",
      durationSeconds: l.durationSeconds,
      isFreePreview: l.order === 0,
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
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
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
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
