import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Users (1 per role) ─────────────────────────────────────────────────────
  const superAdmin = await upsertUser(
    "superadmin@lms.local",
    "Super Admin",
    "superadmin123",
    "SUPER_ADMIN",
  );
  console.log("✅ Super Admin:", superAdmin.email);

  const admin = await upsertUser(
    "admin@lms.local",
    "Admin User",
    "admin123",
    "ADMIN",
  );
  console.log("✅ Admin:", admin.email);

  const instructor = await upsertUser(
    "instructor@lms.local",
    "Demo Instructor",
    "instructor123",
    "INSTRUCTOR",
    { instructorOnboardingComplete: true },
  );
  console.log("✅ Instructor:", instructor.email);

  // ─── Instructor Profile ─────────────────────────────────────────────────────
  await prisma.instructorProfile.upsert({
    where: { userId: instructor.id },
    update: {},
    create: {
      userId: instructor.id,
      bio: "Experienced data scientist and educator with over 8 years in the field. Passionate about teaching Python, machine learning, and data analysis to aspiring professionals.",
      designation: "Senior Data Scientist",
      qualification: "M.Tech in Computer Science",
      experienceYears: 8,
      skills: [
        "Python",
        "Machine Learning",
        "Data Analysis",
        "SQL",
        "Deep Learning",
      ],
      currentlyEmployed: true,
      companyName: "TechCorp Solutions",
      availableTime: "20 hrs/week",
      phone: "+91-9876543210",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      languages: ["English", "Hindi", "Kannada"],
      socialLinks: {
        linkedin: "https://linkedin.com/in/demo-instructor",
        github: "https://github.com/demo-instructor",
      },
      bankName: "State Bank of India",
      bankAccountNumber: "XXXX-XXXX-1234",
      bankIfscCode: "SBIN0001234",
      bankAccountHolderName: "Demo Instructor",
      upiId: "instructor@upi",
      status: "APPROVED",
      verifiedById: superAdmin.id,
      verifiedAt: new Date(),
      rating: 4.8,
      totalStudents: 156,
      completedSessions: 48,
    },
  });
  console.log("✅ Instructor profile created");

  const student = await upsertUser(
    "student@lms.local",
    "Demo Student",
    "student123",
    "STUDENT",
  );
  console.log("✅ Student:", student.email);

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

  // ─── Courses ────────────────────────────────────────────────────────────────
  // Course 1: Python for Data Science (full content)
  const pythonCourse = await upsertCourse({
    slug: "python-for-data-science",
    title: "Python for Data Science",
    description:
      "Master Python for data analysis, visualization, and machine learning. Covers Python fundamentals, NumPy, Pandas, Matplotlib, Seaborn, and Scikit-learn.",
    category: "Data Science",
    createdBy: instructor.id,
    tags: [
      "python",
      "data-science",
      "pandas",
      "numpy",
      "matplotlib",
      "scikit-learn",
    ],
    learningObjectives: [
      "Write Python scripts with confidence",
      "Manipulate data with NumPy and Pandas",
      "Create insightful visualizations with Matplotlib and Seaborn",
      "Build and evaluate machine learning models with Scikit-learn",
    ],
  });

  // Course 2: SQL for Data Analysis (placeholder)
  const sqlCourse = await upsertCourse({
    slug: "sql-for-data-analysis",
    title: "SQL for Data Analysis",
    description:
      "Learn SQL from basics to advanced queries for data analysis and reporting.",
    category: "Data Science",
    createdBy: instructor.id,
    tags: ["sql", "data-analysis", "databases"],
    learningObjectives: [
      "Write complex SQL queries",
      "Use JOINs, subqueries, and window functions",
      "Optimize query performance",
    ],
  });

  // Course 3: Machine Learning Basics (placeholder)
  const mlCourse = await upsertCourse({
    slug: "machine-learning-basics",
    title: "Machine Learning Basics",
    description:
      "Introduction to machine learning concepts, algorithms, and practical implementations.",
    category: "Data Science",
    createdBy: instructor.id,
    tags: ["machine-learning", "ai", "data-science"],
    learningObjectives: [
      "Understand supervised and unsupervised learning",
      "Build classification and regression models",
      "Evaluate model performance",
    ],
  });

  console.log("✅ Courses created");

  // ─── Categories ─────────────────────────────────────────────────────────────
  const categoryDefinitions = [
    {
      name: "Data Science",
      slug: "data-science",
      description:
        "Courses on data analysis, visualization, and machine learning",
    },
    {
      name: "Programming",
      slug: "programming",
      description:
        "Foundational and advanced programming languages and paradigms",
    },
    {
      name: "Web Development",
      slug: "web-development",
      description: "Frontend, backend, and full-stack web development",
    },
    {
      name: "Mobile Development",
      slug: "mobile-development",
      description: "Building apps for iOS, Android, and cross-platform",
    },
    {
      name: "Machine Learning & AI",
      slug: "machine-learning-ai",
      description:
        "Machine learning, deep learning, and artificial intelligence",
    },
    {
      name: "DevOps & Cloud",
      slug: "devops-cloud",
      description: "CI/CD, containers, orchestration, and cloud platforms",
    },
    {
      name: "Cybersecurity",
      slug: "cybersecurity",
      description: "Security fundamentals, ethical hacking, and defense",
    },
    {
      name: "Networking",
      slug: "networking",
      description: "Computer networking, protocols, and infrastructure",
    },
    {
      name: "Database Design",
      slug: "database-design",
      description: "SQL, NoSQL, and data modeling",
    },
    {
      name: "Software Testing",
      slug: "software-testing",
      description: "Automated and manual software testing practices",
    },
    {
      name: "Game Development",
      slug: "game-development",
      description: "Game engines, design, and game programming",
    },
    {
      name: "Blockchain & Web3",
      slug: "blockchain-web3",
      description: "Blockchain, smart contracts, and decentralized apps",
    },
    {
      name: "Design & UI/UX",
      slug: "design-ui-ux",
      description: "UI/UX, graphic design, and product design",
    },
    {
      name: "Business & Finance",
      slug: "business-finance",
      description: "Entrepreneurship, finance, and accounting",
    },
    {
      name: "Marketing",
      slug: "marketing",
      description: "Digital marketing, SEO, and social media",
    },
    {
      name: "Personal Development",
      slug: "personal-development",
      description: "Productivity, leadership, and communication",
    },
    {
      name: "Photography & Video",
      slug: "photography-video",
      description: "Photography, videography, and editing",
    },
    {
      name: "Music & Audio",
      slug: "music-audio",
      description: "Music theory, production, and audio engineering",
    },
    {
      name: "Language Learning",
      slug: "language-learning",
      description: "Foreign language courses",
    },
    {
      name: "Health & Fitness",
      slug: "health-fitness",
      description: "Wellness, exercise, and nutrition",
    },
  ];

  const categories = [];
  for (let i = 0; i < categoryDefinitions.length; i++) {
    const def = categoryDefinitions[i];
    const category = await prisma.category.upsert({
      where: { slug: def.slug },
      update: { name: def.name, description: def.description, order: i },
      create: { ...def, order: i },
    });
    categories.push(category);
  }
  console.log(`✅ ${categories.length} categories seeded`);

  // Wire courses to category
  const dataScienceCategory = categories.find((c) => c.slug === "data-science");
  if (dataScienceCategory) {
    await prisma.course.updateMany({
      where: {
        slug: {
          in: [
            "python-for-data-science",
            "sql-for-data-analysis",
            "machine-learning-basics",
          ],
        },
      },
      data: { categoryId: dataScienceCategory.id },
    });
  }
  console.log("✅ Courses wired to category");

  // ─── Tags ────────────────────────────────────────────────────────────────────
  const tagDefinitions = [
    { name: "Python", slug: "python" },
    { name: "SQL", slug: "sql" },
    { name: "Machine Learning", slug: "machine-learning" },
    { name: "Data Analysis", slug: "data-analysis" },
    { name: "Pandas", slug: "pandas" },
    { name: "NumPy", slug: "numpy" },
    { name: "Scikit-learn", slug: "scikit-learn" },
    { name: "AI", slug: "ai" },
    { name: "JavaScript", slug: "javascript" },
    { name: "TypeScript", slug: "typescript" },
    { name: "React", slug: "react" },
    { name: "Next.js", slug: "next-js" },
    { name: "Node.js", slug: "node-js" },
    { name: "Java", slug: "java" },
    { name: "C++", slug: "c-plus-plus" },
    { name: "C#", slug: "c-sharp" },
    { name: "PHP", slug: "php" },
    { name: "Ruby", slug: "ruby" },
    { name: "Go", slug: "go" },
    { name: "Rust", slug: "rust" },
    { name: "Swift", slug: "swift" },
    { name: "Kotlin", slug: "kotlin" },
    { name: "Django", slug: "django" },
    { name: "Flask", slug: "flask" },
    { name: "Express", slug: "express" },
    { name: "HTML", slug: "html" },
    { name: "CSS", slug: "css" },
    { name: "Tailwind CSS", slug: "tailwind-css" },
    { name: "PostgreSQL", slug: "postgresql" },
    { name: "MongoDB", slug: "mongodb" },
    { name: "MySQL", slug: "mysql" },
    { name: "Redis", slug: "redis" },
    { name: "Deep Learning", slug: "deep-learning" },
    { name: "Data Science", slug: "data-science" },
    { name: "Big Data", slug: "big-data" },
    { name: "Computer Vision", slug: "computer-vision" },
    { name: "NLP", slug: "nlp" },
    { name: "Docker", slug: "docker" },
    { name: "Kubernetes", slug: "kubernetes" },
    { name: "AWS", slug: "aws" },
    { name: "Azure", slug: "azure" },
    { name: "GCP", slug: "gcp" },
    { name: "Cloud Computing", slug: "cloud-computing" },
    { name: "DevOps", slug: "devops" },
    { name: "Git", slug: "git" },
    { name: "GitHub", slug: "github" },
    { name: "CI/CD", slug: "ci-cd" },
    { name: "Cybersecurity", slug: "cybersecurity" },
    { name: "Networking", slug: "networking" },
    { name: "Blockchain", slug: "blockchain" },
    { name: "Web3", slug: "web3" },
    { name: "API", slug: "api" },
    { name: "REST", slug: "rest" },
    { name: "GraphQL", slug: "graphql" },
    { name: "Microservices", slug: "microservices" },
    { name: "Android", slug: "android" },
    { name: "iOS", slug: "ios" },
    { name: "Flutter", slug: "flutter" },
    { name: "React Native", slug: "react-native" },
    { name: "UI/UX", slug: "ui-ux" },
    { name: "Figma", slug: "figma" },
    { name: "Graphic Design", slug: "graphic-design" },
    { name: "Game Development", slug: "game-development" },
    { name: "Unity", slug: "unity" },
    { name: "Digital Marketing", slug: "digital-marketing" },
    { name: "SEO", slug: "seo" },
    { name: "Social Media", slug: "social-media" },
    { name: "Finance", slug: "finance" },
    { name: "Accounting", slug: "accounting" },
    { name: "Excel", slug: "excel" },
    { name: "Project Management", slug: "project-management" },
    { name: "Leadership", slug: "leadership" },
    { name: "Communication", slug: "communication" },
    { name: "Interview Prep", slug: "interview-prep" },
  ];

  const tags = [];
  for (const t of tagDefinitions) {
    const tag = await prisma.tag.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
    tags.push(tag);
  }
  console.log(`✅ ${tags.length} tags seeded`);

  // Wire tags to courses
  const tagMap: Record<string, string[]> = {
    "python-for-data-science": [
      "python",
      "data-analysis",
      "pandas",
      "numpy",
      "scikit-learn",
    ],
    "sql-for-data-analysis": ["sql", "data-analysis"],
    "machine-learning-basics": ["machine-learning", "ai", "data-analysis"],
  };

  for (const [courseSlug, tagSlugs] of Object.entries(tagMap)) {
    const course = await prisma.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true },
    });
    if (!course) continue;
    const courseTags = tags.filter((t) => tagSlugs.includes(t.slug));
    for (const tag of courseTags) {
      await prisma.courseTag.upsert({
        where: { courseId_tagId: { courseId: course.id, tagId: tag.id } },
        update: {},
        create: { courseId: course.id, tagId: tag.id },
      });
    }
  }
  console.log("✅ Courses wired to tags");

  // ─── Course Titles ─────────────────────────────────────────────────────────
  const courseTitleDefinitions = [
    "Web Development Bootcamp",
    "Full Stack Development",
    "MERN Stack Development",
    "MEAN Stack Development",
    "Frontend Development",
    "Backend Development",
    "JavaScript Mastery",
    "TypeScript Essentials",
    "React & Next.js Advanced",
    "Node.js Backend Development",
    "Python for Beginners",
    "Advanced Python Programming",
    "HTML & CSS Fundamentals",
    "Tailwind CSS Essentials",
    "SQL & Databases for Beginners",
    "Excel for Data Analysis",
    "WordPress Essentials",
    "Shopify Store Setup",
    "Data Science Fundamentals",
    "Data Analysis with Pandas",
    "Machine Learning with Python",
    "Deep Learning & Neural Networks",
    "Artificial Intelligence Foundations",
    "Natural Language Processing",
    "Computer Vision with OpenCV",
    "DevOps Essentials",
    "Docker & Kubernetes Mastery",
    "AWS Cloud Practitioner",
    "Azure Cloud Fundamentals",
    "Google Cloud Platform Basics",
    "Linux for Beginners",
    "Cybersecurity Fundamentals",
    "Ethical Hacking & Penetration Testing",
    "Networking Fundamentals",
    "Database Design & SQL",
    "PostgreSQL Mastery",
    "MongoDB for Developers",
    "GraphQL API Development",
    "REST API Design",
    "Microservices Architecture",
    "System Design Fundamentals",
    "UI/UX Design Fundamentals",
    "Figma Masterclass",
    "Graphic Design Basics",
    "Adobe Photoshop Essentials",
    "Mobile App Development with Flutter",
    "Android Development with Kotlin",
    "iOS Development with Swift",
    "React Native App Development",
    "Game Development with Unity",
    "Blockchain Development",
    "Web3 & Smart Contracts",
    "Digital Marketing Masterclass",
    "SEO Fundamentals",
    "Social Media Marketing",
    "Google Ads Essentials",
    "Content Writing & Copywriting",
    "Business Analytics",
    "Financial Modeling & Analysis",
    "Project Management Professional",
    "Agile & Scrum Fundamentals",
    "Leadership & Communication Skills",
    "Interview Preparation Masterclass",
  ];

  for (const name of courseTitleDefinitions) {
    await prisma.courseTitle.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✅ ${courseTitleDefinitions.length} course titles seeded`);

  // ─── Package Names ─────────────────────────────────────────────────────────
  const packageNameDefinitions = [
    "Full Stack Development Package",
    "MERN Stack Developer Track",
    "Frontend Developer Package",
    "Backend Developer Package",
    "JavaScript Developer Track",
    "Python Developer Package",
    "Data Science Career Track",
    "Machine Learning Engineer Track",
    "Web Development Starter Pack",
    "Frontend Development Bundle",
    "Backend Development Bundle",
    "Mobile Development Mastery",
    "Android Developer Package",
    "iOS Developer Package",
    "DevOps Engineer Track",
    "Cloud Computing Career Track",
    "AI & Machine Learning Package",
    "Cybersecurity Professional Package",
    "Digital Marketing Bundle",
    "Blockchain & Web3 Bundle",
    "UI/UX Design Package",
    "Data Engineering Track",
    "Software Testing & QA Package",
    "Game Development Bundle",
    "Business Analytics Package",
    "Project Management Bundle",
  ];

  for (const name of packageNameDefinitions) {
    await prisma.packageName.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✅ ${packageNameDefinitions.length} package names seeded`);

  // ─── Branding (SystemSetting) ────────────────────────────────────────────────
  const brandingValue = JSON.stringify({
    primaryColor: "#4F46E5",
    logoUrl: "/images/logo.png",
    faviconUrl: "/images/favicon.ico",
    companyName: "Marvel Slice LMS",
  });

  await prisma.systemSetting.upsert({
    where: { key: "branding" },
    update: { value: brandingValue },
    create: {
      key: "branding",
      value: brandingValue,
      type: "json",
      description: "Platform branding configuration",
    },
  });
  console.log("✅ Branding config seeded");

  // ─── Static Pages ────────────────────────────────────────────────────────────
  await prisma.staticPage.upsert({
    where: { slug: "about" },
    update: {},
    create: {
      title: "About Us",
      slug: "about",
      content: `
<h1>About Marvel Slice LMS</h1>
<p>We are an innovative learning platform dedicated to empowering students with cutting-edge data science and technology skills.</p>

<h2>Our Mission</h2>
<p>To make high-quality technical education accessible and engaging for everyone. We believe in hands-on learning through live sessions, real-world projects, and expert mentorship.</p>

<h2>What We Offer</h2>
<ul>
<li><strong>Live Interactive Classes</strong> — Learn directly from industry experts via Microsoft Teams</li>
<li><strong>Structured Courses</strong> — Comprehensive modules covering Python, SQL, Machine Learning, Data Analysis, and more</li>
<li><strong>Hands-on Assignments</strong> — Practice with real datasets and coding challenges</li>
<li><strong>Mentorship</strong> — 1-on-1 guidance sessions with your instructors</li>
<li><strong>Certificates</strong> — Earn verified certificates upon course completion</li>
</ul>

<h2>Our Team</h2>
<p>Our instructors are industry professionals with years of experience in data science, machine learning, and software engineering. They are passionate about teaching and committed to your success.</p>

<h2>Get Started</h2>
<p>Browse our <a href="/catalogue">course packages</a> to find the right program for you, or reach out to our support team if you have any questions.</p>`,
      isPublished: true,
      createdBy: admin.id,
    },
  });

  await prisma.staticPage.upsert({
    where: { slug: "terms" },
    update: {},
    create: {
      title: "Terms & Conditions",
      slug: "terms",
      content: `
<h1>Terms &amp; Conditions</h1>
<p><em>Last updated: July 2026</em></p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing or using the Marvel Slice Learning Platform ("Platform"), you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use the Platform.</p>

<h2>2. Account Registration</h2>
<p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</p>

<h2>3. Use of the Platform</h2>
<p>The Platform is intended for educational purposes. You may use it to access courses, attend live sessions, complete assignments, and earn certificates. Any misuse — including sharing accounts, redistributing content, or disrupting sessions — may result in suspension.</p>

<h2>4. Course Content</h2>
<p>All course materials, videos, quizzes, and resources are the intellectual property of the respective instructors and Marvel Slice. You are granted a limited, non-transferable license to access content for personal learning only.</p>

<h2>5. Payments &amp; Refunds</h2>
<p>Course package fees are non-refundable once access has been granted, unless otherwise stated. Pricing and availability are subject to change without notice.</p>

<h2>6. Certificates</h2>
<p>Certificates are issued upon successful completion of a course, including meeting attendance and assignment requirements. Certificates are digital and can be shared via unique verification URLs.</p>

<h2>7. Live Sessions</h2>
<p>Live sessions are conducted via Microsoft Teams. Recording and attendance policies are set by individual instructors. Sessions may be recorded for quality and review purposes.</p>

<h2>8. Limitation of Liability</h2>
<p>Marvel Slice shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform. We strive for uptime but do not guarantee uninterrupted access.</p>

<h2>9. Modifications</h2>
<p>We reserve the right to update these Terms at any material time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.</p>

<h2>10. Contact</h2>
<p>For questions about these Terms, contact us through the support portal or email support@marvelslice.com.</p>`,
      isPublished: true,
      createdBy: admin.id,
    },
  });

  await prisma.staticPage.upsert({
    where: { slug: "privacy" },
    update: {},
    create: {
      title: "Privacy Policy",
      slug: "privacy",
      content: `
<h1>Privacy Policy</h1>
<p><em>Last updated: July 2026</em></p>

<h2>1. Information We Collect</h2>
<p>We collect information you provide directly, including your name, email address, and payment details when you register or purchase a course package. We also collect usage data such as session attendance, video progress, and quiz scores.</p>

<h2>2. How We Use Your Information</h2>
<ul>
<li>To provide and improve the Platform and its educational services</li>
<li>To track your learning progress and issue certificates</li>
<li>To communicate with you about courses, sessions, and account updates</li>
<li>To process payments and manage enrollments</li>
<li>To ensure platform security and prevent fraud</li>
</ul>

<h2>3. Microsoft Teams Integration</h2>
<p>Live sessions are conducted through Microsoft Teams. When you join a session, Microsoft may collect usage data per their own privacy policy. We do not control Microsoft's data practices.</p>

<h2>4. Data Sharing</h2>
<p>We do not sell your personal data. We may share information with:</p>
<ul>
<li>Instructors — limited to your name, email, and course progress for the courses you are enrolled in</li>
<li>Payment processors — to handle transactions securely</li>
<li>Legal authorities — when required by law</li>
</ul>

<h2>5. Data Security</h2>
<p>We implement industry-standard security measures including encrypted passwords, HTTPS, and role-based access controls. However, no method of transmission is 100% secure.</p>

<h2>6. Your Rights</h2>
<p>You may request access to, correction of, or deletion of your personal data by contacting our support team. Account deletion will remove your personal information but may retain anonymized learning analytics.</p>

<h2>7. Cookies</h2>
<p>We use essential cookies for authentication and session management. Analytics cookies may be used to improve the Platform. You can manage cookie preferences through your browser settings.</p>

<h2>8. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or Platform notification.</p>

<h2>9. Contact</h2>
<p>For privacy-related inquiries, contact us through the support portal or email privacy@marvelslice.com.</p>`,
      isPublished: true,
      createdBy: admin.id,
    },
  });
  console.log("✅ Static pages seeded (about, terms, privacy)");

  // ─── Email Templates ──────────────────────────────────────────────────────
  const emailTemplates = [
    {
      name: "welcome",
      subject: "Welcome to Marvel Slice LMS!",
      isActive: true,
      variables: JSON.stringify(["userName", "email", "password"]),
      body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#4F46E5;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Welcome to Marvel Slice LMS!</h1>
        </td></tr>
        <tr><td style="padding:32px 24px;">
          <p style="font-size:15px;color:#333;">Hi {{userName}},</p>
          <p style="font-size:14px;color:#555;line-height:1.6;">
            We&apos;re excited to have you on board! Your account has been created and you&apos;re ready to start your learning journey.
          </p>
          <p style="font-size:14px;color:#555;line-height:1.6;">
            <strong>Your login credentials:</strong><br/>
            Email: {{email}}<br/>
            Password: {{password}}
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="{{loginUrl}}" style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;">
              Log In to Your Account
            </a>
          </div>
          <p style="font-size:13px;color:#888;line-height:1.5;">
            For security reasons, please change your password after your first login.
          </p>
        </td></tr>
        <tr><td style="background:#f8f8f8;padding:16px 24px;text-align:center;font-size:11px;color:#aaa;">
          &copy; 2026 Marvel Slice LMS. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    },
    {
      name: "notification-default",
      subject: "{{notificationTitle}}",
      isActive: true,
      variables: JSON.stringify(["notificationTitle", "notificationMessage"]),
      body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#4F46E5;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">{{notificationTitle}}</h1>
        </td></tr>
        <tr><td style="padding:32px 24px;">
          <p style="font-size:15px;color:#333;line-height:1.7;">{{notificationMessage}}</p>
        </td></tr>
        <tr><td style="background:#f8f8f8;padding:16px 24px;text-align:center;font-size:11px;color:#aaa;">
          &copy; 2026 Marvel Slice LMS. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    },
    {
      name: "reset-password",
      subject: "Reset Your Password - Marvel Slice LMS",
      isActive: true,
      variables: JSON.stringify(["userName", "resetLink"]),
      body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#4F46E5;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Reset Your Password</h1>
        </td></tr>
        <tr><td style="padding:32px 24px;">
          <p style="font-size:15px;color:#333;">Hi {{userName}},</p>
          <p style="font-size:14px;color:#555;line-height:1.6;">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="{{resetLink}}" style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;">
              Reset Password
            </a>
          </div>
          <p style="font-size:13px;color:#888;line-height:1.5;">
            This link will expire in 15 minutes. If you did not request a password reset, please ignore this email.
          </p>
        </td></tr>
        <tr><td style="background:#f8f8f8;padding:16px 24px;text-align:center;font-size:11px;color:#aaa;">
          &copy; 2026 Marvel Slice LMS. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    },
  ];

  for (const tpl of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: tpl.name },
      update: {
        subject: tpl.subject,
        body: tpl.body,
        variables: tpl.variables,
        isActive: tpl.isActive,
      },
      create: tpl,
    });
  }
  console.log(
    "✅ Email templates seeded (welcome, reset-password, notification-default)",
  );

  // ─── Package (needed before batch) ───────────────────────────────────────────
  const dataSciencePkg = await prisma.coursePackage.upsert({
    where: { id: "pkg-datascience" },
    update: {},
    create: {
      id: "pkg-datascience",
      name: "Data Science Program",
      slug: "data-science-program",
      description:
        "Complete data science track: Python, SQL, and Machine Learning.",
      price: 4990000,
      status: "ACTIVE",
      courses: {
        create: [
          { courseId: pythonCourse.id, order: 0 },
          { courseId: sqlCourse.id, order: 1 },
          { courseId: mlCourse.id, order: 2 },
        ],
      },
    },
  });
  console.log("✅ Package created");

  // ─── Batch (needed before assignments — batchId is required) ─────────────────
  const pkgBatch = await prisma.batch.upsert({
    where: { id: "batch-datascience" },
    update: {},
    create: {
      id: "batch-datascience",
      courseId: null,
      packageId: dataSciencePkg.id,
      instructorId: instructor.id,
      name: "Data Science Batch — Jul 2025",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2026-01-31"),
      maxStudents: 50,
      status: "ACTIVE",
      description: "Package-level batch for the Data Science Program.",
      defaultDaysToComplete: 30,
    },
  });
  console.log("✅ Batch created");

  // ─── Per-Course Instructors (BatchCourseMentor) ─────────────────────────────
  // Python → instructor (primary), SQL → instructor, ML → no specific mentor
  const pythonCourseMentor = await prisma.batchCourseMentor.upsert({
    where: {
      batchId_courseId: { batchId: pkgBatch.id, courseId: pythonCourse.id },
    },
    update: {},
    create: {
      batchId: pkgBatch.id,
      courseId: pythonCourse.id,
      mentorId: instructor.id,
    },
  });
  console.log("✅ Python course mentor set:", pythonCourseMentor.id);

  const sqlCourseMentor = await prisma.batchCourseMentor.upsert({
    where: {
      batchId_courseId: { batchId: pkgBatch.id, courseId: sqlCourse.id },
    },
    update: {},
    create: {
      batchId: pkgBatch.id,
      courseId: sqlCourse.id,
      mentorId: instructor.id,
    },
  });
  console.log("✅ SQL course mentor set:", sqlCourseMentor.id);

  // ─── Python: Modules, Lessons, Quizzes, Assignments, Study Materials ────────
  const pythonModule1 = await upsertModule(pythonCourse.id, {
    title: "Python Fundamentals",
    description:
      "Core Python concepts — variables, control flow, functions, and modules.",
    order: 0,
    isFreePreview: true,
  });
  const pythonModule2 = await upsertModule(pythonCourse.id, {
    title: "NumPy & Pandas",
    description:
      "Numerical computing with NumPy and data manipulation with Pandas.",
    order: 1,
    isFreePreview: false,
  });
  const pythonModule3 = await upsertModule(pythonCourse.id, {
    title: "Data Visualization",
    description:
      "Create stunning charts and visualizations with Matplotlib and Seaborn.",
    order: 2,
    isFreePreview: false,
  });
  const pythonModule4 = await upsertModule(pythonCourse.id, {
    title: "Intro to Machine Learning",
    description: "Build predictive models with Scikit-learn.",
    order: 3,
    isFreePreview: false,
  });

  // ─── Module 1: Python Fundamentals ────────────────────────────────────────────
  await upsertLessons(pythonModule1.id, [
    {
      title: "Variables & Data Types",
      description: "Strings, numbers, booleans, and type conversion in Python.",
      videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
      videoEmbedId: "_uQrJ0TkZlc",
      durationSeconds: 960,
      order: 0,
      isFreePreview: true,
      resources: [
        { name: "Python Official Docs", url: "https://docs.python.org/3/" },
      ],
    },
    {
      title: "Control Flow & Loops",
      description: "if/else, for loops, while loops, and list comprehensions.",
      videoUrl: "https://www.youtube.com/watch?v=khKv-8q7YmY",
      videoEmbedId: "khKv-8q7YmY",
      durationSeconds: 1080,
      order: 1,
      resources: [
        { name: "W3Schools Python", url: "https://www.w3schools.com/python/" },
      ],
    },
    {
      title: "Functions & Modules",
      description:
        "Defining functions, arguments, return values, and importing modules.",
      videoUrl: "https://www.youtube.com/watch?v=9Os0o3wzS_I",
      videoEmbedId: "9Os0o3wzS_I",
      durationSeconds: 1140,
      order: 2,
      resources: [
        {
          name: "Real Python Functions",
          url: "https://realpython.com/defining-your-own-python-function/",
        },
      ],
    },
  ]);

  await createQuiz(
    pythonModule1.id,
    "Python Fundamentals Quiz",
    0,
    [
      {
        text: "Which of the following is a mutable data type in Python?",
        options: [
          { label: "Tuple", isCorrect: false },
          { label: "String", isCorrect: false },
          { label: "List", isCorrect: true },
          { label: "Integer", isCorrect: false },
        ],
      },
      {
        text: "What does the `len()` function return?",
        options: [
          { label: "Type of object", isCorrect: false },
          { label: "Length of object", isCorrect: true },
          { label: "Memory size", isCorrect: false },
          { label: "Hash value", isCorrect: false },
        ],
      },
      {
        text: "Which keyword is used to define a function in Python?",
        options: [
          { label: "function", isCorrect: false },
          { label: "def", isCorrect: true },
          { label: "define", isCorrect: false },
          { label: "func", isCorrect: false },
        ],
      },
      {
        text: "What is the output of `print(2 ** 3)`?",
        options: [
          { label: "6", isCorrect: false },
          { label: "8", isCorrect: true },
          { label: "9", isCorrect: false },
          { label: "5", isCorrect: false },
        ],
      },
      {
        text: "Which of the following creates a list in Python?",
        options: [
          { label: "{}", isCorrect: false },
          { label: "[]", isCorrect: true },
          { label: "()", isCorrect: false },
          { label: "<>", isCorrect: false },
        ],
      },
    ],
    { daysFromEnrollment: 14 },
  );

  await createAssignment(
    pythonModule1.id,
    pythonCourse.id,
    pkgBatch.id,
    "Python Basics Assignment",
    0,
    { daysFromEnrollment: 14 },
  );

  // ─── Module 2: NumPy & Pandas ───────────────────────────────────────────────
  await upsertLessons(pythonModule2.id, [
    {
      title: "NumPy Arrays",
      description:
        "Creating and manipulating multi-dimensional arrays with NumPy.",
      videoUrl: "https://www.youtube.com/watch?v=KlBPCzcQNU8",
      videoEmbedId: "KlBPCzcQNU8",
      durationSeconds: 1200,
      order: 0,
      resources: [
        {
          name: "NumPy Quickstart",
          url: "https://numpy.org/doc/stable/user/quickstart.html",
        },
      ],
    },
    {
      title: "Pandas Series & DataFrames",
      description:
        "Working with labeled data structures — Series and DataFrame.",
      videoUrl: "https://www.youtube.com/watch?v=QUT1VZ6Vx1o",
      videoEmbedId: "QUT1VZ6Vx1o",
      durationSeconds: 1320,
      order: 1,
      resources: [
        {
          name: "Pandas Getting Started",
          url: "https://pandas.pydata.org/docs/getting_started/index.html",
        },
      ],
    },
    {
      title: "Data Cleaning with Pandas",
      description:
        "Handling missing values, duplicates, and data transformations.",
      videoUrl: "https://www.youtube.com/watch?v=H37f_x4wAC0",
      videoEmbedId: "H37f_x4wAC0",
      durationSeconds: 1260,
      order: 2,
      resources: [
        {
          name: "Pandas Data Cleaning",
          url: "https://pandas.pydata.org/docs/user_guide/missing_data.html",
        },
      ],
    },
  ]);

  await createQuiz(pythonModule2.id, "NumPy & Pandas Quiz", 0, [
    {
      text: "Which NumPy function creates an array of zeros?",
      options: [
        { label: "np.zeros()", isCorrect: true },
        { label: "np.empty()", isCorrect: false },
        { label: "np.null()", isCorrect: false },
        { label: "np.blank()", isCorrect: false },
      ],
    },
    {
      text: "How do you read a CSV file into a Pandas DataFrame?",
      options: [
        { label: "pd.load_csv()", isCorrect: false },
        { label: "pd.read_csv()", isCorrect: true },
        { label: "pd.open_csv()", isCorrect: false },
        { label: "pd.import_csv()", isCorrect: false },
      ],
    },
    {
      text: "Which method removes missing values in Pandas?",
      options: [
        { label: "df.dropna()", isCorrect: true },
        { label: "df.remove_na()", isCorrect: false },
        { label: "df.clean()", isCorrect: false },
        { label: "df.filter()", isCorrect: false },
      ],
    },
    {
      text: "What attribute gives the shape of a NumPy array?",
      options: [
        { label: ".size", isCorrect: false },
        { label: ".dim", isCorrect: false },
        { label: ".shape", isCorrect: true },
        { label: ".length", isCorrect: false },
      ],
    },
    {
      text: "Which Pandas function computes descriptive statistics?",
      options: [
        { label: "df.summarize()", isCorrect: false },
        { label: "df.describe()", isCorrect: true },
        { label: "df.stats()", isCorrect: false },
        { label: "df.info()", isCorrect: false },
      ],
    },
  ]);

  await createAssignment(
    pythonModule2.id,
    pythonCourse.id,
    pkgBatch.id,
    "Data Manipulation Task",
    1,
  );

  // ─── Module 3: Data Visualization ────────────────────────────────────────────
  await upsertLessons(pythonModule3.id, [
    {
      title: "Matplotlib Basics",
      description:
        "Creating line plots, bar charts, scatter plots, and histograms.",
      videoUrl: "https://www.youtube.com/watch?v=DAQNHzOcO5A",
      videoEmbedId: "DAQNHzOcO5A",
      durationSeconds: 1380,
      order: 0,
      resources: [
        {
          name: "Matplotlib Gallery",
          url: "https://matplotlib.org/stable/gallery/index.html",
        },
      ],
    },
    {
      title: "Seaborn for Statistical Plots",
      description:
        "Creating beautiful statistical visualizations with Seaborn.",
      videoUrl: "https://www.youtube.com/watch?v=wD2V4PzH7UY",
      videoEmbedId: "wD2V4PzH7UY",
      durationSeconds: 1140,
      order: 1,
      resources: [
        {
          name: "Seaborn Tutorial",
          url: "https://seaborn.pydata.org/tutorial.html",
        },
      ],
    },
  ]);

  await createQuiz(pythonModule3.id, "Data Visualization Quiz", 0, [
    {
      text: "Which import statement is correct for Matplotlib?",
      options: [
        { label: "import matplotlibplotlib as plt", isCorrect: false },
        { label: "import matplotlib.pyplot as plt", isCorrect: true },
        { label: "import matplot as plt", isCorrect: false },
        { label: "import plotly as plt", isCorrect: false },
      ],
    },
    {
      text: "Which function creates a bar chart in Matplotlib?",
      options: [
        { label: "plt.plot()", isCorrect: false },
        { label: "plt.bar()", isCorrect: true },
        { label: "plt.hist()", isCorrect: false },
        { label: "plt.scatter()", isCorrect: false },
      ],
    },
    {
      text: "Seaborn is built on top of which library?",
      options: [
        { label: "Plotly", isCorrect: false },
        { label: "Bokeh", isCorrect: false },
        { label: "Matplotlib", isCorrect: true },
        { label: "Pandas", isCorrect: false },
      ],
    },
    {
      text: "Which function displays the plot in Matplotlib?",
      options: [
        { label: "plt.show()", isCorrect: true },
        { label: "plt.display()", isCorrect: false },
        { label: "plt.render()", isCorrect: false },
        { label: "plt.output()", isCorrect: false },
      ],
    },
    {
      text: "What does a heatmap visualize?",
      options: [
        { label: "Line relationships", isCorrect: false },
        { label: "Correlation matrix values", isCorrect: true },
        { label: "Bar comparisons", isCorrect: false },
        { label: "Pie distributions", isCorrect: false },
      ],
    },
  ]);

  await createAssignment(
    pythonModule3.id,
    pythonCourse.id,
    pkgBatch.id,
    "Visualization Challenge",
    2,
  );

  // ─── Module 4: Intro to Machine Learning ──────────────────────────────────────
  await upsertLessons(pythonModule4.id, [
    {
      title: "Supervised Learning Concepts",
      description:
        "Understanding classification, regression, and train/test splits.",
      videoUrl: "https://www.youtube.com/watch?v=0Lt9w-BxXsQ",
      videoEmbedId: "0Lt9w-BxXsQ",
      durationSeconds: 1440,
      order: 0,
      resources: [
        { name: "Scikit-learn Docs", url: "https://scikit-learn.org/stable/" },
      ],
    },
    {
      title: "Building a Model Pipeline",
      description:
        "Data preprocessing, training, and evaluation with Scikit-learn.",
      videoUrl: "https://www.youtube.com/watch?v=0Lt9w-BxXsQ",
      videoEmbedId: "0Lt9w-BxXsQ",
      durationSeconds: 1560,
      order: 1,
      resources: [
        {
          name: "Scikit-learn Tutorial",
          url: "https://scikit-learn.org/stable/tutorial/index.html",
        },
      ],
    },
  ]);

  await createQuiz(pythonModule4.id, "ML Basics Quiz", 0, [
    {
      text: "Which of the following is a supervised learning algorithm?",
      options: [
        { label: "K-Means", isCorrect: false },
        { label: "Linear Regression", isCorrect: true },
        { label: "PCA", isCorrect: false },
        { label: "DBSCAN", isCorrect: false },
      ],
    },
    {
      text: "What does `train_test_split` do?",
      options: [
        {
          label: "Splits data into training and testing sets",
          isCorrect: true,
        },
        { label: "Splits features into categories", isCorrect: false },
        { label: "Splits the model into layers", isCorrect: false },
        { label: "Splits the dataset into equal parts", isCorrect: false },
      ],
    },
    {
      text: "Which metric is used for classification accuracy?",
      options: [
        { label: "Mean Squared Error", isCorrect: false },
        { label: "R-squared", isCorrect: false },
        { label: "F1 Score", isCorrect: true },
        { label: "Mean Absolute Error", isCorrect: false },
      ],
    },
    {
      text: "What is overfitting?",
      options: [
        {
          label: "Model performs well on train but poorly on test",
          isCorrect: true,
        },
        {
          label: "Model performs well on test but poorly on train",
          isCorrect: false,
        },
        { label: "Model trains too slowly", isCorrect: false },
        { label: "Model has too few parameters", isCorrect: false },
      ],
    },
    {
      text: "Which Scikit-learn class is used for decision trees?",
      options: [
        { label: "DecisionTree", isCorrect: false },
        { label: "DecisionTreeRegressor", isCorrect: false },
        { label: "DecisionTreeClassifier", isCorrect: true },
        { label: "TreeClassifier", isCorrect: false },
      ],
    },
  ]);

  await createAssignment(
    pythonModule4.id,
    pythonCourse.id,
    pkgBatch.id,
    "ML Model Building",
    3,
  );

  // ─── Module 5: Certification Exam ──────────────────────────────────────────
  const pythonCertModule = await upsertModule(pythonCourse.id, {
    title: "Certification Exam",
    description:
      "Final certification examination for the Python for Data Science course.",
    order: 4,
    isFreePreview: false,
  });

  const existingCertQuiz = await prisma.quiz.findFirst({
    where: {
      moduleId: pythonCertModule.id,
      title: "Python Data Science Certification",
    },
  });
  if (!existingCertQuiz) {
    await prisma.quiz.create({
      data: {
        moduleId: pythonCertModule.id,
        title: "Python Data Science Certification",
        order: 0,
        isSpecialExam: true,
        passingScore: 60,
        timeLimitMin: 30,
        hasMcq: true,
        hasAssignment: false,
        hasCoding: false,
        examType: "MCQ",
        questions: {
          create: [
            {
              text: "Which of the following is the correct way to create a NumPy array of zeros?",
              options: [
                { label: "np.zeros((3, 3))", isCorrect: true },
                { label: "np.zeroes(3, 3)", isCorrect: false },
                { label: "np.array.zeros(3)", isCorrect: false },
                { label: "np.zeros[3, 3]", isCorrect: false },
              ],
            },
            {
              text: "What does df.describe() return in Pandas?",
              options: [
                {
                  label: "Summary statistics of the DataFrame",
                  isCorrect: true,
                },
                { label: "The first 5 rows", isCorrect: false },
                { label: "Column data types", isCorrect: false },
                { label: "The DataFrame schema", isCorrect: false },
              ],
            },
            {
              text: "Which matplotlib function creates a scatter plot?",
              options: [
                { label: "plt.scatter()", isCorrect: true },
                { label: "plt.plot()", isCorrect: false },
                { label: "plt.scatterplot()", isCorrect: false },
                { label: "plt.scatter_chart()", isCorrect: false },
              ],
            },
            {
              text: "In Scikit-learn, what is the purpose of train_test_split?",
              options: [
                {
                  label: "Split data into training and testing sets",
                  isCorrect: true,
                },
                { label: "Split the model into layers", isCorrect: false },
                { label: "Split features into categories", isCorrect: false },
                {
                  label: "Split the dataset into equal parts",
                  isCorrect: false,
                },
              ],
            },
            {
              text: "Which Pandas method handles missing values by removing rows?",
              options: [
                { label: "df.dropna()", isCorrect: true },
                { label: "df.remove_na()", isCorrect: false },
                { label: "df.clean()", isCorrect: false },
                { label: "df.filter_na()", isCorrect: false },
              ],
            },
          ],
        },
      },
    });
  }

  // Mark the module as certification module
  await prisma.module.update({
    where: { id: pythonCertModule.id },
    data: { isCertificationModule: true },
  });
  console.log("✅ Python course certification exam module created");

  console.log(
    "✅ Python course content created (modules, lessons, quizzes, assignments, study materials)",
  );

  // ─── Set contentOrder on Python modules ──────────────────────────────────────
  for (const moduleId of [
    pythonModule1.id,
    pythonModule2.id,
    pythonModule3.id,
    pythonModule4.id,
  ]) {
    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    const quizzes = await prisma.quiz.findMany({
      where: { moduleId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    const assignments = await prisma.assignment.findMany({
      where: { moduleId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    const contentOrder = [
      ...lessons.map((l) => ({ type: "LESSON" as const, id: l.id })),
      ...quizzes.map((q) => ({ type: "QUIZ" as const, id: q.id })),
      ...assignments.map((a) => ({ type: "ASSIGNMENT" as const, id: a.id })),
    ];
    await prisma.module.update({
      where: { id: moduleId },
      data: { contentOrder },
    });
  }

  // ─── SQL Course: minimal placeholder ─────────────────────────────────────────
  const sqlModule1 = await upsertModule(sqlCourse.id, {
    title: "SQL Fundamentals",
    description: "Basic SQL queries.",
    order: 0,
    isFreePreview: true,
  });
  await upsertLessons(sqlModule1.id, [
    {
      title: "SELECT & WHERE Clauses",
      description: "Basic querying and filtering.",
      videoUrl: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
      videoEmbedId: "HXV3zeQKqGY",
      durationSeconds: 900,
      order: 0,
      isFreePreview: true,
    },
    {
      title: "JOINs & Aggregations",
      description: "Combining tables and grouping data.",
      videoUrl: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
      videoEmbedId: "HXV3zeQKqGY",
      durationSeconds: 1080,
      order: 1,
    },
  ]);
  console.log("✅ SQL course (placeholder) created");

  // ─── ML Course: minimal placeholder ──────────────────────────────────────────
  const mlModule1 = await upsertModule(mlCourse.id, {
    title: "ML Concepts",
    description: "Core ML concepts.",
    order: 0,
    isFreePreview: true,
  });
  await upsertLessons(mlModule1.id, [
    {
      title: "Types of Machine Learning",
      description: "Supervised, unsupervised, reinforcement.",
      videoUrl: "https://www.youtube.com/watch?v=0Lt9w-BxXsQ",
      videoEmbedId: "0Lt9w-BxXsQ",
      durationSeconds: 900,
      order: 0,
      isFreePreview: true,
    },
    {
      title: "Model Evaluation",
      description: "Accuracy, precision, recall, F1.",
      videoUrl: "https://www.youtube.com/watch?v=0Lt9w-BxXsQ",
      videoEmbedId: "0Lt9w-BxXsQ",
      durationSeconds: 1020,
      order: 1,
    },
  ]);
  console.log("✅ ML course (placeholder) created");

  // ─── BatchCourseVisibility: Python visible, others hidden ───────────────────
  await prisma.batchCourseVisibility.upsert({
    where: {
      batchId_courseId: { batchId: pkgBatch.id, courseId: pythonCourse.id },
    },
    update: { isVisible: true },
    create: {
      batchId: pkgBatch.id,
      courseId: pythonCourse.id,
      isVisible: true,
    },
  });
  await prisma.batchCourseVisibility.upsert({
    where: {
      batchId_courseId: { batchId: pkgBatch.id, courseId: sqlCourse.id },
    },
    update: {},
    create: {
      batchId: pkgBatch.id,
      courseId: sqlCourse.id,
      isVisible: false,
    },
  });
  await prisma.batchCourseVisibility.upsert({
    where: {
      batchId_courseId: { batchId: pkgBatch.id, courseId: mlCourse.id },
    },
    update: {},
    create: {
      batchId: pkgBatch.id,
      courseId: mlCourse.id,
      isVisible: false,
    },
  });
  console.log("✅ Batch course visibility set (Python visible, others hidden)");

  // ─── Enrollment ──────────────────────────────────────────────────────────────
  const existingEnrollment = await prisma.packageEnrollment.findFirst({
    where: { userId: student.id, packageId: dataSciencePkg.id },
  });
  if (!existingEnrollment) {
    const enrollment = await prisma.packageEnrollment.create({
      data: {
        userId: student.id,
        packageId: dataSciencePkg.id,
        status: "APPROVED",
      },
    });
    const pkgCourses = await prisma.packageCourse.findMany({
      where: { packageId: dataSciencePkg.id },
      select: { courseId: true },
    });
    for (const pc of pkgCourses) {
      await prisma.packageEnrollmentCourse.create({
        data: {
          enrollmentId: enrollment.id,
          courseId: pc.courseId,
          batchId: pkgBatch.id,
        },
      });
    }
  }
  console.log("✅ Enrollment created");

  // ─── Payment & Refund (sample) ────────────────────────────────────────────────
  const existingPayment = await prisma.payment.findFirst({
    where: { userId: student.id, packageId: dataSciencePkg.id },
  });
  if (!existingPayment) {
    const payment = await prisma.payment.create({
      data: {
        userId: student.id,
        packageId: dataSciencePkg.id,
        amount: 4990000,
        currency: "INR",
        status: "PAID",
        razorpayOrderId: "order_sample_dummy",
        razorpayPaymentId: "pay_sample_dummy",
        razorpaySignature: "sig_sample_dummy",
      },
    });

    await prisma.refund.create({
      data: {
        paymentId: payment.id,
        amount: 2495000,
        currency: "INR",
        status: "COMPLETED",
        reason: "Partial refund — student requested course change",
        initiatedById: admin.id,
        razorpayRefundId: "rfnd_sample_dummy",
      },
    });
    console.log("✅ Sample payment & refund created");
  } else {
    console.log("✅ Payment already exists");
  }

  // ─── Notification Preferences ────────────────────────────────────────────────
  const allUsers = [superAdmin, admin, instructor, student];
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
  console.log("   Super Admin: superadmin@lms.local / superadmin123");
  console.log("   Admin:       admin@lms.local / admin123");
  console.log("   Instructor:  instructor@lms.local / instructor123");
  console.log("   Student:     student@lms.local / student123");
  console.log(
    "   Courses: Python for Data Science (full), SQL (placeholder), ML (placeholder)",
  );
  console.log(
    "   Package: Data Science Program — Batch: Data Science Batch — Jul 2025",
  );
  console.log("   BatchCourseVisibility: Python course visible, others hidden");
  console.log("   Instructor Profile: Demo Instructor (approved)");
  console.log("   Payment + Refund: Sample data available");
  console.log(
    "   Email Templates: welcome, reset-password, notification-default",
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(
  email: string,
  name: string,
  password: string,
  role: "SUPER_ADMIN" | "ADMIN" | "INSTRUCTOR" | "STUDENT",
  extraData?: Partial<{ instructorOnboardingComplete: boolean }>,
) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash: hash, role, ...extraData },
  });
}

async function upsertCourse(data: {
  slug: string;
  title: string;
  description: string;
  category: string;
  createdBy: string;
  tags: string[];
  learningObjectives: string[];
  thumbnailUrl?: string;
  coverImageUrl?: string;
}) {
  return prisma.course.upsert({
    where: { slug: data.slug },
    update: {},
    create: {
      ...data,
      status: "PUBLISHED",
      publishedAt: new Date(),
      thumbnailUrl:
        data.thumbnailUrl ?? `https://picsum.photos/seed/${data.slug}/640/360`,
      coverImageUrl:
        data.coverImageUrl ??
        `https://picsum.photos/seed/${data.slug}/1280/720`,
    },
  });
}

async function upsertModule(
  courseId: string,
  data: {
    title: string;
    description: string;
    order: number;
    isFreePreview: boolean;
  },
) {
  const existing = await prisma.module.findFirst({
    where: { courseId, order: data.order },
  });
  if (existing) return existing;

  return prisma.module.create({
    data: { courseId, ...data },
  });
}

async function upsertLessons(
  moduleId: string,
  lessons: {
    title: string;
    description: string;
    videoUrl: string;
    videoEmbedId: string;
    durationSeconds: number;
    order: number;
    isFreePreview?: boolean;
    resources?: { name: string; url: string }[];
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
      videoEmbedId: l.videoEmbedId,
      durationSeconds: l.durationSeconds,
      isFreePreview: l.isFreePreview ?? false,
      resources: l.resources ?? [],
    })),
  });
}

async function createQuiz(
  moduleId: string,
  title: string,
  order: number,
  questions: {
    text: string;
    options: { label: string; isCorrect: boolean }[];
  }[],
  options?: {
    dueDate?: Date;
    daysFromEnrollment?: number;
  },
) {
  const existing = await prisma.quiz.findFirst({ where: { moduleId, title } });
  if (existing) return existing;

  return prisma.quiz.create({
    data: {
      moduleId,
      title,
      order,
      dueDate: options?.dueDate ?? null,
      daysFromEnrollment: options?.daysFromEnrollment ?? null,
      questions: {
        create: questions.map((q) => ({
          text: q.text,
          options: q.options,
        })),
      },
    },
  });
}

async function createAssignment(
  moduleId: string,
  courseId: string,
  batchId: string,
  title: string,
  order: number,
  options?: {
    dueDate?: Date;
    daysFromEnrollment?: number;
  },
) {
  const existing = await prisma.assignment.findFirst({
    where: { moduleId, title, courseId },
  });
  if (existing) return existing;

  return prisma.assignment.create({
    data: {
      courseId,
      batchId,
      moduleId,
      title,
      description: `Assignment: ${title}`,
      type: "ASSIGNMENT",
      order,
      dueDate: options?.dueDate ?? new Date("2025-12-31"),
      daysFromEnrollment: options?.daysFromEnrollment ?? null,
      maxPoints: 100,
    },
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
  defaultDaysToComplete?: number;
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
