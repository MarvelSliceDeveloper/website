import { generateContentWithAI, getAIConfig } from './aiService';
import {
  keyHighlightsFor,
  pedagogyFor,
  extractToolsFromSyllabus,
  extractDurationFromDoc,
  extractProjectsFromDoc,
  durationForCourse,
  projectsFor
} from './brochureExpand';

/**
 * Intelligent Fallback: Generates in-depth, comprehensive course content
 * structured into Headings, Subheadings, Paragraphs, and Bullets across 10+ pages.
 */
export function synthesizeFlowingCourseBrochure(course, siteSettings = {}) {
  const title = course.title || 'Professional Software Engineering & Full Stack Program';
  const subtitle = course.subtitle || 'Comprehensive Industry-Aligned Curriculum with Hands-On Labs and 100% Placement Support';
  const description = course.description || 'An intensive, end-to-end career transformation program designed to train students and professionals in modern software engineering, scalable architectures, and production best practices.';
  const duration = course.duration || '6 Months (Comprehensive)';
  const mode = course.mode || 'Online / Classroom Hybrid';
  const category = course.category || 'Software Development';
  const subCategory = course.sub_category || 'Full Stack Engineering';

  // Extract database items
  const checklist = Array.isArray(course.checklist_items)
    ? course.checklist_items.map(c => (typeof c === 'string' ? c : c?.text || c?.label)).filter(Boolean)
    : [];

  const highlights = Array.isArray(course.highlights)
    ? course.highlights.map(h => (typeof h === 'string' ? h : h?.label || h?.title)).filter(Boolean)
    : [];

  const dbFaqs = Array.isArray(course.overview_faqs)
    ? course.overview_faqs.map(f => ({ q: f.question || f.q, a: f.answer || f.a })).filter(f => f.q && f.a)
    : [];

  const dbModules = Array.isArray(course.modules) ? course.modules : [];
  const detailedHighlights = keyHighlightsFor(title, duration, dbModules);
  const pedagogyItems = pedagogyFor(title);

  return {
    meta: {
      title,
      subtitle,
      description,
      duration,
      mode,
      category,
      subCategory,
      institutionName: 'Marvel Slice Institute for Software Learning and Competitive Exams',
      brandHeading: 'Marvel Slice',
      brandSubheading: 'INSTITUTE FOR SOFTWARE LEARNING AND COMPETITIVE EXAMS',
      contact: {
        website: siteSettings?.social_links?.website || 'www.marvelslice.com',
        email: siteSettings?.contact_email || 'sales@marvelslice.com',
        phone: siteSettings?.contact_phone || '+91 63809 57390 / +91 80882 18609',
        address: siteSettings?.address || '123 Tech Innovation Park, Chennai, Tamil Nadu, India',
        weekdayHours: siteSettings?.working_hours?.weekday || '09:00 AM - 07:00 PM',
        saturdayHours: siteSettings?.working_hours?.saturday || '10:00 AM - 04:00 PM',
      },
    },

    // High-impact metric-driven Key Highlights (2-column layout)
    keyHighlights: detailedHighlights,

    // 8-pillar Program Pedagogy
    pedagogy: pedagogyItems,

    // Section 1: Executive Overview & Introduction
    overview: {
      heading: 'Program Overview & Executive Summary',
      paragraphs: [
        `The ${title} offered by Marvel Slice Institute for Software Learning and Competitive Exams is an elite, industry-oriented training initiative designed to bridge the widening gap between traditional academic curricula and modern high-scale software engineering standards. Engineered in collaboration with seasoned software architects and technical hiring leads, this program prepares ambitious learners to master cutting-edge technologies, build robust applications, and excel in competitive global engineering roles.`,
        `Throughout this intensive journey, participants move progressively from foundational computational logic and object-oriented paradigms to advanced cloud architectures, microservices design, and automated DevOps workflows. We emphasize deep conceptual clarity coupled with relentless practical application, ensuring you write production-grade, maintainable, and secure code from day one.`,
        `With over 70% of the program dedicated to hands-on live labs, architectural coding sprints, and portfolio-ready project systems, you will cultivate the exact problem-solving mindset and technical dexterity demanded by top tech enterprises, innovative startups, and global consultancies.`
      ],
      keyHighlights: highlights.length > 0 ? highlights : [
        'Over 120+ Hours of Live Instructor-Led Interactive Training',
        'Direct 1-on-1 Mentorship from Senior Software Architects',
        'Industry-Standard Microservices & Cloud-Native Architecture',
        'Comprehensive Code Reviews & Clean Architecture Practices',
        'Dedicated Career Coaching, Resume Optimization & Mock Interviews',
        'Guaranteed Access to Marvel Slice 500+ Corporate Hiring Partner Network'
      ]
    },

    // Section 2: Audience & Prerequisites
    audience: {
      heading: 'Target Audience Profile & Prerequisites',
      subheading: 'Who Will Benefit Most from this Program?',
      paragraphs: [
        'This program is structured with a modular zero-to-advanced learning trajectory, making it accessible to committed individuals regardless of their prior background while offering sufficient depth to challenge experienced engineers.'
      ],
      targetProfiles: [
        {
          title: 'Aspiring Software Developers & Recent Graduates',
          desc: 'Computer science and engineering graduates seeking structured, job-ready skills to stand out in campus placements and off-campus recruitment drives.'
        },
        {
          title: 'Working IT Professionals Seeking Upskilling',
          desc: 'Junior developers, QA engineers, and system support analysts looking to transition into high-paying Full Stack, Backend, or Cloud DevOps engineering positions.'
        },
        {
          title: 'Non-IT Professionals & Career Switchers',
          desc: 'Motivated professionals from non-technical backgrounds seeking a clear, mentored roadmap to successfully launch a rewarding software engineering career.'
        },
        {
          title: 'Freelancers & Tech Entrepreneurs',
          desc: 'Builders wanting to design, develop, and deploy scalable digital products from scratch with modern frameworks and cloud infrastructure.'
        }
      ],
      prerequisitesText: 'A basic understanding of computer operations and strong logical problem-solving interest. Prior programming experience is beneficial but not mandatory; our comprehensive pre-course preparatory modules provide all necessary foundational background.'
    },

    // Section 3: Learning Outcomes
    outcomes: {
      heading: 'Program Learning Outcomes & Core Competencies',
      subheading: 'Mastery You Will Demonstrate Upon Graduation',
      paragraphs: [
        'By the conclusion of this training program, graduates will possess end-to-end technical competence across the modern software engineering lifecycle. You will be equipped to architect, develop, test, containerize, and deploy sophisticated multi-tier web applications that handle real-world scale and enterprise traffic.'
      ],
      bulletPoints: [
        'Architect scalable, maintainable, and modular full-stack web applications utilizing modern component libraries and backend microservices.',
        'Design efficient relational and NoSQL database schemas with ACID compliance, optimized indexing, and transactional integrity.',
        'Implement robust RESTful and GraphQL APIs with centralized middleware, schema validation, and secure error handling.',
        'Enforce industry-grade security protocols including OAuth 2.0, JWT authentication, Role-Based Access Control (RBAC), and data encryption.',
        'Containerize applications using Docker and automate deployment workflows via continuous integration and continuous delivery (CI/CD) pipelines.',
        'Apply Test-Driven Development (TDD) methodologies utilizing automated unit, integration, and end-to-end testing frameworks.',
        'Profile and optimize production applications for maximum throughput, low latency, and efficient memory utilization.',
        'Collaborate effectively in agile engineering sprints using modern Git workflows, pull request reviews, and issue tracking tools.'
      ]
    },

    // Section 4: Deep Syllabus & Curriculum (8 Extensive Modules)
    modules: dbModules.length >= 4 ? dbModules : [
      {
        moduleNumber: '01',
        title: 'Core Programming Fundamentals, Data Structures & Algorithms',
        objective: 'Establish an unshakeable foundation in computational logic, object-oriented design, memory management, and algorithmic complexity.',
        topics: [
          'Modern syntax, variables, data types, and type coercion rules',
          'Control flow structures, iterative loops, and functional programming concepts',
          'Object-Oriented Programming (OOP): Encapsulation, Inheritance, Polymorphism, Abstraction',
          'Memory lifecycle: Stack vs. Heap allocation, pointers/references, and garbage collection',
          'Linear Data Structures: Arrays, Dynamic Arrays, Linked Lists, Stacks, and Queues',
          'Non-Linear Data Structures: Binary Trees, Binary Search Trees, and Hash Tables',
          'Searching and Sorting Algorithms: Binary Search, Merge Sort, Quick Sort',
          'Asymptotic Big-O time and space complexity analysis and code profiling'
        ],
        handsOnLab: 'Building a high-throughput CLI in-memory search engine and algorithmic data processor.'
      },
      {
        moduleNumber: '02',
        title: 'Modern Version Control, GitFlow & Collaborative Engineering',
        objective: 'Master professional source code management, branch strategies, and team collaboration workflows used in enterprise tech teams.',
        topics: [
          'Git internals: Commits, Trees, Blobs, HEAD pointer, and detached states',
          'Branching models: GitFlow, Trunk-Based Development, and Feature Branching',
          'Advanced Git commands: Interactive Rebase, Cherry-pick, Stash, and Bisect',
          'Resolving complex merge conflicts and maintaining clean commit histories',
          'Pull requests, peer code review protocols, and automated linting hooks',
          'Semantic versioning (SemVer), changelog automation, and release tagging'
        ],
        handsOnLab: 'Simulating a multi-developer team sprint with automated PR reviews and conflict resolution.'
      },
      {
        moduleNumber: '03',
        title: 'Advanced Frontend Architecture, Component Design & State Management',
        objective: 'Engineer responsive, accessible, and blazing-fast user interfaces utilizing modern frontend frameworks and state machines.',
        topics: [
          'Component-driven architecture, modularity, and reusable design systems',
          'Virtual DOM reconciliation, fiber architecture, and lifecycle hooks',
          'Complex state management: Context API, Redux Toolkit, and atomic state libraries',
          'Client-side routing, protected navigation guards, and dynamic lazy loading',
          'Modern responsive design with Tailwind CSS, Flexbox, Grid, and CSS Modules',
          'Form handling, schema validation with Zod/Yup, and asynchronous submission states',
          'Web accessibility (a11y), semantic HTML5, and WCAG compliance standards',
          'Frontend performance optimization: Memoization, code splitting, and bundle analysis'
        ],
        handsOnLab: 'Building an enterprise SaaS dashboard with real-time data visualization and theme customization.'
      },
      {
        moduleNumber: '04',
        title: 'Backend Engineering, Scalable REST/GraphQL APIs & Microservices',
        objective: 'Construct high-concurrency backend services, asynchronous queues, and clean decoupled API interfaces.',
        topics: [
          'HTTP/HTTPS protocol deep dive: Headers, status codes, cookies, and caching policies',
          'RESTful API architecture: Resource URI design, idempotency, and versioning strategies',
          'GraphQL server development: Schemas, queries, mutations, subscriptions, and resolvers',
          'Asynchronous runtime architectures, event loops, and non-blocking I/O operations',
          'Middleware pipelines: Centralized logging, request validation, and rate limiting',
          'Background job scheduling, worker threads, and message queues (Redis / BullMQ)',
          'WebSockets for real-time bidirectional communication and event broadcasting',
          'Microservices decomposition, API Gateways, and inter-service communication'
        ],
        handsOnLab: 'Architecting a distributed multi-tenant API gateway with rate limiting and automated schema documentation.'
      },
      {
        moduleNumber: '05',
        title: 'Database Architecture, Data Modeling & High-Performance Caching',
        objective: 'Design resilient data layers across relational SQL and document-based NoSQL storage engines with high-speed in-memory caching.',
        topics: [
          'Relational Database Management Systems (RDBMS): PostgreSQL and MySQL',
          'Database normalization (1NF, 2NF, 3NF), foreign keys, and referential integrity',
          'Advanced SQL: Window functions, Common Table Expressions (CTEs), and complex JOINs',
          'Database indexing strategies: B-Trees, GIN, composite indexes, and EXPLAIN ANALYZE',
          'NoSQL Document Databases: MongoDB schema modeling, aggregations, and replica sets',
          'Object-Relational Mapping (ORM): Prisma, TypeORM, and Mongoose best practices',
          'Redis in-memory caching: Cache-aside patterns, TTL eviction policies, and pub/sub',
          'Database migrations, schema version control, and automated backup strategies'
        ],
        handsOnLab: 'Designing a high-traffic e-commerce database with read replicas and Redis caching.'
      },
      {
        moduleNumber: '06',
        title: 'Enterprise Security, Identity Management & Compliance',
        objective: 'Implement defense-in-depth security mechanisms to protect sensitive data, prevent cyber vulnerabilities, and enforce compliance.',
        topics: [
          'Authentication mechanisms: Session-based vs. Stateless JSON Web Tokens (JWT)',
          'OAuth 2.0 authorization framework and OpenID Connect (OIDC) social logins',
          'Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC)',
          'Cryptographic hashing: Argon2, bcrypt, salting, and secure password storage',
          'Preventing OWASP Top 10 vulnerabilities: SQLi, XSS, CSRF, SSRF, and IDOR',
          'Cross-Origin Resource Sharing (CORS) configuration and Content Security Policy (CSP)',
          'Data encryption at rest and in transit (TLS/SSL encryption)',
          'API security best practices, input sanitization, and automated secret scanning'
        ],
        handsOnLab: 'Implementing an enterprise authentication service with multi-factor auth (MFA) and granular RBAC.'
      },
      {
        moduleNumber: '07',
        title: 'Cloud Infrastructure, Docker Containerization & CI/CD DevOps',
        objective: 'Master cloud deployments, container orchestration, and continuous integration pipelines for zero-downtime releases.',
        topics: [
          'Containerization fundamentals: Docker images, multi-stage builds, and Docker Compose',
          'Cloud infrastructure services: AWS / GCP / Cloud computing, storage, and networking',
          'Serverless computing: AWS Lambda, Cloud Functions, and API Gateway integration',
          'Continuous Integration (CI) with GitHub Actions: Automated linting, testing, and building',
          'Continuous Deployment (CD): Automated artifact publishing and rolling cloud updates',
          'Reverse proxies and load balancers: Nginx configuration, SSL termination, and caching',
          'Infrastructure monitoring: Uptime checks, automated health alerts, and disaster recovery'
        ],
        handsOnLab: 'Dockerizing a full-stack microservices app and setting up a multi-stage automated CI/CD pipeline.'
      },
      {
        moduleNumber: '08',
        title: 'Automated Testing, Quality Assurance & Production Observability',
        objective: 'Implement rigorous automated test suites and production monitoring to ensure software reliability and lightning-fast incident resolution.',
        topics: [
          'The Testing Pyramid: Unit, Integration, and End-to-End (E2E) testing philosophies',
          'Unit testing with Jest, Vitest, and PyTest: Assertions, spies, stubs, and mocks',
          'Integration testing for API endpoints, database interactions, and authentication',
          'E2E browser automation with Playwright and Cypress for critical user workflows',
          'Code coverage analysis, mutation testing, and static analysis with SonarQube',
          'Production Observability: Structured logging, distributed tracing, and metrics',
          'Application Performance Monitoring (APM) tools: Prometheus, Grafana, and Datadog',
          'Load testing and stress testing using k6 to identify architectural bottlenecks'
        ],
        handsOnLab: 'Building an automated test suite achieving 90%+ code coverage and running automated k6 load tests.'
      }
    ],

    // Section 5: Technology Matrix
    techMatrix: {
      heading: 'Comprehensive Technology & Tooling Matrix',
      paragraphs: [
        'Our curriculum covers the industry’s most revered, battle-tested technologies and developer tooling. Students develop deep muscle memory through hands-on usage across all tiers of modern application engineering.'
      ],
      categories: [
        {
          title: 'Frontend & UI Frameworks',
          items: ['React.js 19', 'Next.js App Router', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'HTML5 / CSS3 / ESNext']
        },
        {
          title: 'Backend Runtimes & APIs',
          items: ['Node.js & Express', 'Python & FastAPI', 'Java & Spring Boot', 'RESTful API Standards', 'GraphQL', 'WebSockets']
        },
        {
          title: 'Databases & In-Memory Stores',
          items: ['PostgreSQL', 'MongoDB', 'Redis In-Memory', 'MySQL', 'Prisma ORM', 'Mongoose ODM']
        },
        {
          title: 'DevOps, Cloud & Infrastructure',
          items: ['Docker & Compose', 'AWS Cloud Ecosystem', 'GitHub Actions CI/CD', 'Nginx Web Server', 'Linux & Bash Scripting']
        },
        {
          title: 'Testing & Code Quality',
          items: ['Jest & Vitest', 'Playwright E2E', 'Postman API Testing', 'ESLint & Prettier', 'Git & GitHub']
        },
        {
          title: 'Architecture & Engineering Practices',
          items: ['Microservices', 'Event-Driven Systems', 'Clean Architecture', 'OAuth2 / JWT Security', 'Agile / Scrum Sprints']
        }
      ]
    },

    // Section 6: Real-World Projects
    capstones: {
      heading: 'Production Projects & Portfolio Building',
      paragraphs: [
        'Theory alone is insufficient to stand out in today’s competitive tech market. At Marvel Slice Academy, you build four substantial, production-grade applications that serve as undeniable proof of your engineering capabilities during technical interviews.'
      ],
      projects: projectsFor(title, dbModules).map((cp, idx) => ({
        title: `Project ${idx + 1}: ${cp.title}`,
        subheading: `${cp.level} Portfolio Project`,
        paragraphs: [cp.desc],
        techStack: cp.tech,
        portfolioImpact: `Proves your practical competency in ${cp.tech} through mentor-reviewed code.`
      }))
    },

    // Section 7: Career Pathways & Placement Support
    career: {
      heading: 'Career Pathways, Industry Demand & Placement Assistance',
      subheading: 'Accelerate Your Transition into High-Paying Tech Roles',
      paragraphs: [
        'The global demand for skilled software engineers who understand modern web architectures, cloud deployment, and clean code remains extraordinarily strong. Marvel Slice Academy provides structured, end-to-end career transition support from your first day until you accept your dream offer.'
      ],
      jobRoles: [
        {
          role: 'Full Stack Software Engineer',
          exp: 'Freshers & Experienced (0 - 4 Years)',
          salary: '₹6.5 - ₹18.0 LPA',
          desc: 'Responsible for end-to-end feature delivery, frontend user interfaces, backend APIs, and database persistence.'
        },
        {
          role: 'Frontend Specialist (React / Next.js)',
          exp: '0 - 3 Years Experience',
          salary: '₹5.5 - ₹14.0 LPA',
          desc: 'Focused on high-performance web applications, responsive user experiences, and frontend state architectures.'
        },
        {
          role: 'Backend & API Engineer',
          exp: '0 - 4 Years Experience',
          salary: '₹6.0 - ₹16.0 LPA',
          desc: 'Specialized in microservices design, database performance tuning, distributed caching, and API security.'
        },
        {
          role: 'Cloud DevOps Associate',
          exp: '0 - 4 Years Experience',
          salary: '₹7.0 - ₹18.0 LPA',
          desc: 'Focuses on CI/CD pipeline automation, Docker containerization, infrastructure monitoring, and cloud hosting.'
        }
      ],
      placementBlueprint: [
        {
          step: 'Step 1: Technical Resume & Online Profile Overhaul',
          desc: 'We transform your resume into an ATS-compliant document emphasizing your real projects and optimize your LinkedIn & GitHub profiles to attract inbound recruiter inquiries.'
        },
        {
          step: 'Step 2: Algorithmic Coding & Problem-Solving Drills',
          desc: 'Daily practice on live coding problems, data structure implementations, and time-constrained technical assessments.'
        },
        {
          step: 'Step 3: 1-on-1 Senior Architect Mock Interviews',
          desc: 'Realistic technical interviews and system design whiteboard sessions with senior engineers, complete with actionable scorecards and feedback.'
        },
        {
          step: 'Step 4: Exclusive Corporate Hiring Partner Referrals',
          desc: 'Direct profile shortlisting and interview scheduling with our verified network of 500+ corporate hiring partners.'
        },
        {
          step: 'Step 5: Salary Negotiation & Career Onboarding Guidance',
          desc: 'Expert mentorship on evaluating job offers, negotiating compensation, and smoothly transitioning into your new engineering role.'
        }
      ]
    },

    // Section 8: Certification & Mentorship Model
    certification: {
      heading: 'Verified Industry Certification & Mentorship Ecosystem',
      subheading: 'Earn a Globally Verifiable Professional Credential',
      paragraphs: [
        'Graduates of Marvel Slice Academy receive the prestigious Certificate of Professional Software Mastery. Every certificate is embedded with a unique cryptographic verification link, allowing recruiters and hiring managers worldwide to instantly validate your credentials, completed project portfolio, and assessment scores online.',
        'Our learning experience is built around personalized, high-touch mentorship. You are never left to struggle alone with complex errors or architectural blockers.'
      ],
      mentorshipPillars: [
        {
          title: 'Live 1-on-1 Code Reviews',
          desc: 'Senior mentors review your project pull requests line-by-line, providing constructive feedback on code readability, performance, and best practices.'
        },
        {
          title: 'Weekly Open Office Hours',
          desc: 'Dedicated weekly Q&A sessions where you can ask challenging questions, debug edge-case blockers, and discuss industry trends.'
        },
        {
          title: 'Lifelong Alumni Network Access',
          desc: 'Join our private alumni community of professional software engineers across top global tech firms for ongoing networking, knowledge sharing, and referrals.'
        }
      ]
    },

    // Section 9: Admissions Guide & FAQs
    admissions: {
      heading: 'Admissions Process, FAQs & Contact Information',
      subheading: 'Simple 4-Step Enrollment Roadmap',
      steps: [
        {
          step: '1. Online Application',
          desc: 'Submit your enrollment request via our official website or visit our admissions office in person.'
        },
        {
          step: '2. Academic Counseling',
          desc: 'Connect with an experienced career counselor to review your aspirations, curriculum details, and cohort timings.'
        },
        {
          step: '3. Registration & LMS Access',
          desc: 'Complete enrollment formalities and receive immediate access to pre-course preparatory materials and community forums.'
        },
        {
          step: '4. Batch Orientation & Kickoff',
          desc: 'Attend live orientation with your mentor, receive your project roadmap, and commence your learning journey.'
        }
      ],
      faqs: dbFaqs.length > 0 ? dbFaqs : [
        {
          q: 'Is this program suitable for absolute beginners?',
          a: 'Yes, absolutely. The curriculum begins with zero-assumption foundational programming and algorithmic logic before systematically advancing into enterprise architecture.'
        },
        {
          q: 'What happens if I miss a live lecture?',
          a: 'Every live session is recorded in high definition and uploaded to your personal LMS student portal within hours, accompanied by full source code repositories and class notes.'
        },
        {
          q: 'When does the placement assistance process start?',
          a: 'Placement preparation starts during the final project phase. Resume reviews, mock technical interviews, and corporate referrals continue until you successfully secure your placement.'
        },
        {
          q: 'Can I balance this program with a full-time job or college degree?',
          a: 'Yes. We offer flexible weekend batches and evening weekday cohorts specifically designed to accommodate working professionals and university students.'
        },
        {
          q: 'Are payment installment options or EMI facilities available?',
          a: 'Yes, we offer flexible zero-cost EMI plans and installment options to make world-class software education affordable and accessible.'
        }
      ]
    }
  };
}

/**
 * AI-Enhanced Flowing Brochure Generator
 * Calls configured AI to enrich headings, subheadings, paragraphs, and bullet points.
 */
export async function generateAIBrochureData(course, siteSettings = {}) {
  const data = synthesizeFlowingCourseBrochure(course, siteSettings);

  try {
    const config = await getAIConfig();
    if (config.active_provider === 'disabled') {
      return data;
    }

    const duration = course?.duration || data.meta?.duration || durationForCourse(course?.title || '');
    const syllabusModules = Array.isArray(course?.modules) && course.modules.length ? course.modules : data.modules;
    const verifiedTools = extractToolsFromSyllabus(syllabusModules);
    const toolsStr = verifiedTools.length ? verifiedTools.join(', ') : 'Technologies strictly from course syllabus';

    const moduleBreakdown = (syllabusModules || []).slice(0, 16).map((m, idx) => {
      const title = m.title || m.name || `Module ${idx + 1}`;
      const topics = (m.topics || m.lines || m.lessons || []).slice(0, 8).join(', ');
      return `- Module ${idx + 1}: ${title} (Topics: ${topics})`;
    }).join('\n');

    const prompt = `You are the Lead Curriculum Architect at Marvel Slice Institute for Software Learning and Competitive Exams.
We are actively conducting this official course for enrolled students.
Course: "${course.title || 'Professional Course'}" (${course.subtitle || ''}).
Official Duration: "${duration}"
Verified Tools & Technologies: "${toolsStr}"

SYLLABUS MODULES CONDUCTED:
${moduleBreakdown}

CRITICAL REAL-WORLD COMMITMENT (ZERO HALLUCINATIONS):
1. STRICT CURRICULUM GROUNDING: What is published in this brochure is an official commitment to enrolled students. Base all summaries, learning outcomes, key highlights, and projects STRICTLY on the provided syllabus modules and tools above.
2. ZERO UNMENTIONED TOOLS: You MUST NOT invent, hallucinate, or mention ANY tools, libraries, frameworks, or languages outside of: "${toolsStr}". If a tool is not in the syllabus, DO NOT mention it!
3. STRICT DURATION: The duration is strictly "${duration}". All pacing, learning hours, and schedules must strictly reflect this duration.
4. PORTFOLIO PROJECTS: Generate exactly 4 portfolio projects (1 Beginner, 1 Intermediate, 2 Advanced). In each project's "tech" field, use ONLY the tools and technologies taught in this course (${toolsStr}).
5. EXPAND NOT NEW: You may expand and elaborate on existing syllabus topics into professional, engaging brochure descriptions, but NEVER introduce new curriculum subjects or unmentioned technologies.
6. NEVER use the word "capstone" - always say "project" (e.g. "Project 1", never "Capstone 1").
7. BULLETS: Short one-line bullets everywhere (max 12 words each).
8. HIGHLIGHTS: Generate 18-20 metric-driven bullet points for "keyHighlights" matching "${duration}".
9. PEDAGOGY: Generate 8 structured pedagogy items for "pedagogy" representing the 8 pillars: Instructor-led Training, Hackathons, Dedicated Learning Management Team, Peer Networking and Group Learning, Self-paced videos, Gamified Learning, Projects and Exercises, 1:1 Personalized Learning.

Return a valid JSON object with:
{
  "executiveSummary": "A rich 3-paragraph executive overview grounded strictly in this course and its syllabus",
  "learningOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3", "Outcome 4", "Outcome 5", "Outcome 6", "Outcome 7", "Outcome 8"],
  "keyHighlights": [
    "620+ Hrs of Applied Learning",
    "218+ Hrs of Self-Paced Learning",
    "50+ Industry Projects & Case Studies",
    "Placement Assistance",
    "24*7 Support",
    "1:1 Mock Interview",
    "2 Days campus immersion & hackathon sprints",
    "Industry Certification Support",
    "Up to Rs. 50 Lakhs startup Incubation Support*",
    "Weekday/Weekend Batches",
    "90+ Live Sessions Across the program",
    "Learn from Senior Faculty & Industry Practitioners",
    "One-on-One with Industry Mentors",
    "Resume Preparation and LinkedIn Profile Review",
    "Designed for Working Professionals & Freshers",
    "No Cost EMI Option",
    "Top 2 performers per batch will receive fellowship awards*",
    "3 Guaranteed Job Interviews upon movement to Placement Pool"
  ],
  "pedagogy": [
    { "title": "Instructor-led Training", "desc": "Get trained by top industry experts" },
    { "title": "Hackathons", "desc": "Get a sense of how real projects are built" },
    { "title": "Dedicated Learning Management Team", "desc": "To help you with your learning needs" },
    { "title": "Peer Networking and Group Learning", "desc": "Improve your professional network and learn from peers" },
    { "title": "Self-paced videos", "desc": "Learn at your own pace with world-class content" },
    { "title": "Gamified Learning", "desc": "Get involved in group activities to solve real-world problems" },
    { "title": "Projects and Exercises", "desc": "Get real-world experience through projects" },
    { "title": "1:1 Personalized Learning", "desc": "Hands-on exercises, project work, quizzes, and project builds" }
  ],
  "capstoneHighlights": [
    { "title": "Project 1 Title", "description": "Project overview paragraph", "tech": "Tech stack from course tools", "impact": "Portfolio impact paragraph" },
    { "title": "Project 2 Title", "description": "Project overview paragraph", "tech": "Tech stack from course tools", "impact": "Portfolio impact paragraph" },
    { "title": "Project 3 Title", "description": "Project overview paragraph", "tech": "Tech stack from course tools", "impact": "Portfolio impact paragraph" },
    { "title": "Project 4 Title", "description": "Project overview paragraph", "tech": "Tech stack from course tools", "impact": "Portfolio impact paragraph" }
  ]
}
Return ONLY raw JSON, without markdown formatting.`;

    const aiRes = await generateContentWithAI(prompt, { maxTokens: 2500, temperature: 0.25 });
    if (aiRes?.text) {
      let cleaned = aiRes.text.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');

      try {
        const parsed = JSON.parse(cleaned);
        if (parsed.executiveSummary) {
          data.overview.paragraphs[0] = parsed.executiveSummary;
        }
        if (Array.isArray(parsed.learningOutcomes) && parsed.learningOutcomes.length >= 4) {
          data.outcomes.bulletPoints = parsed.learningOutcomes;
        }
        if (Array.isArray(parsed.keyHighlights) && parsed.keyHighlights.length >= 8) {
          data.keyHighlights = parsed.keyHighlights.map((s) => String(s).trim()).filter(Boolean);
        }
        if (Array.isArray(parsed.pedagogy) && parsed.pedagogy.length >= 4) {
          data.pedagogy = parsed.pedagogy.map((p, idx) => ({
            key: p.key || `pedagogy_${idx}`,
            title: p.title || 'Learning Pillar',
            desc: p.desc || p.description || '',
          }));
        }
        if (Array.isArray(parsed.capstoneHighlights) && parsed.capstoneHighlights.length >= 3) {
          data.capstones.projects = parsed.capstoneHighlights.map((p, idx) => ({
            title: p.title || `Project ${idx + 1}`,
            subheading: p.tech || 'Enterprise Project Architecture',
            paragraphs: [p.description || 'Enterprise production system.'],
            techStack: p.tech || toolsStr,
            portfolioImpact: p.impact || 'Demonstrates enterprise software design and code quality.'
          }));
        }
      } catch (err) {
        console.warn('AI JSON parsing skipped, using synthesized curriculum structure:', err);
      }
    }
  } catch (err) {
    console.warn('AI brochure synthesis skipped/offline:', err.message);
  }

  return data;
}

/**
 * Extract raw text from an uploaded doc file (.txt / .docx / .pdf).
 * Returns plain text (may be long - caller condenses via AI).
 */
export async function extractDocFileText(file) {
  const name = (file?.name || '').toLowerCase();
  if (name.endsWith('.txt')) {
    return await file.text();
  }
  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const buf = await file.arrayBuffer();
    const res = await mammoth.extractRawText({ arrayBuffer: buf });
    return res?.value || '';
  }
  if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    // Same-origin static worker (public/pdf.worker.min.mjs) - blob: and CDN
    // workers are blocked by the site Content Security Policy.
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    const buf = await file.arrayBuffer();
    const pdfDoc = await pdfjs.getDocument({ data: buf }).promise;
    let out = '';
    for (let p = 1; p <= pdfDoc.numPages; p++) {
      const page = await pdfDoc.getPage(p);
      const tc = await page.getTextContent();
      out += `\n${tc.items.map((it) => it.str).join(' ')}`;
    }
    return out;
  }
  throw new Error('Unsupported file type. Upload .docx, .pdf or .txt');
}

/** Hard cap: brochure holds max 25-30 pages total, so doc pages are capped. */
export const MAX_DOC_PAGES = 25;
const MAX_LINES_PER_PAGE = 14;

/**
 * Normalize sections -> max MAX_DOC_PAGES pages.
 * - drops empties, caps lines per page
 * - merges tiny (<2 line) sections into the previous page
 * - if still over cap, evenly groups consecutive sections into MAX_DOC_PAGES
 */
export function normalizeDocSections(sections, maxPages = MAX_DOC_PAGES) {
  const cleaned = (sections || [])
    .map((s) => ({
      title: String(s?.title || '').trim().slice(0, 80),
      lines: [...new Set((s?.lines || []).map((l) => String(l).trim()).filter(Boolean))].slice(0, MAX_LINES_PER_PAGE),
    }))
    .filter((s) => s.title && s.lines.length);
  if (!cleaned.length) return [];

  // merge tiny sections into previous page
  const merged = [];
  cleaned.forEach((s) => {
    const prev = merged[merged.length - 1];
    if (prev && s.lines.length < 2 && prev.lines.length + s.lines.length <= MAX_LINES_PER_PAGE) {
      prev.lines = [...new Set([...prev.lines, ...s.lines])].slice(0, MAX_LINES_PER_PAGE);
    } else {
      merged.push({ ...s, lines: [...s.lines] });
    }
  });

  if (merged.length <= maxPages) return merged;

  // group consecutive sections evenly into maxPages buckets
  const grouped = [];
  const perBucket = merged.length / maxPages;
  for (let i = 0; i < maxPages; i++) {
    const slice = merged.slice(Math.floor(i * perBucket), Math.floor((i + 1) * perBucket));
    if (!slice.length) continue;
    const title = slice.map((s) => s.title).filter(Boolean).slice(0, 2).join(' & ');
    const lines = [...new Set(slice.flatMap((s) => s.lines))].slice(0, MAX_LINES_PER_PAGE);
    grouped.push({ title: title || `Module ${i + 1}`, lines });
  }
  return grouped;
}

/** Local fallback: accurately parses syllabus documents into real modules and topics. */
export function splitDocToSectionsFallback(rawText, maxLinesPerSection = MAX_LINES_PER_PAGE) {
  const lines = String(rawText || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const isLevelBanner = (l) => /^L\d+\s*[-–]/i.test(l) || /^Level\s*\d+/i.test(l);
  const isHeading = (l) => {
    if (isLevelBanner(l)) return false;
    return /^(?:Module|Chapter|Unit|Part|Section)\s*\d+[:\-.]?\s*/i.test(l)
      || /^\d+[\.\)]\s+[A-Z]/i.test(l)
      || /^#+\s+/i.test(l);
  };

  const sections = [];
  let currentSection = null;

  for (const line of lines) {
    if (isLevelBanner(line)) continue;
    if (isHeading(line)) {
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      const rawTitle = line
        .replace(/^#+\s*/, '')
        .replace(/^(?:Module|Chapter|Unit|Part|Section)\s*\d+[:\-.]?\s*/i, '')
        .replace(/^\d+[\.\)]\s+/, '')
        .replace(/^[—–-]\s*/, '')
        .trim();
      currentSection = {
        title: rawTitle || line,
        lines: [],
      };
    } else if (currentSection) {
      const topic = line
        .replace(/^[-•*◦▪]\s*/, '')
        .replace(/^(?:Module|Chapter|Unit|Part)\s*\d+[:\-.]?\s*/i, '')
        .trim();
      if (topic && topic.length >= 2 && !isLevelBanner(topic)) {
        if (!currentSection.lines.includes(topic) && topic.toLowerCase() !== currentSection.title.toLowerCase()) {
          currentSection.lines.push(topic);
        }
      }
    }
  }
  if (currentSection && currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  // Fallback if no headings matched at all
  if (!sections.length) {
    const chunks = String(rawText || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    chunks.forEach((chunk, idx) => {
      const firstLine = chunk.split('\n')[0].slice(0, 80);
      const isShortTitle = firstLine.length < 60 && chunk.includes('\n');
      const title = isShortTitle
        ? firstLine.replace(/^(?:Module|Chapter|Unit|Part|Section)\s*\d+[:\-.]?\s*/i, '').replace(/^[—–-]\s*/, '').trim()
        : `Section ${idx + 1}`;
      const bodyLines = chunk.split('\n').slice(isShortTitle ? 1 : 0)
        .map((l) => l.replace(/^[-•*◦▪]\s*/, '').replace(/^(?:Module|Chapter|Unit|Part)\s*\d+[:\-.]?\s*/i, '').trim())
        .filter((l) => l.length >= 2 && !isLevelBanner(l) && l.toLowerCase() !== title.toLowerCase());
      if (bodyLines.length) {
        sections.push({ title: title || `Module ${idx + 1}`, lines: bodyLines.slice(0, maxLinesPerSection) });
      }
    });
  }

  return normalizeDocSections(sections);
}

/**
 * AI condense: verbose doc content -> max 16 sections,
 * strictly grounded in the uploaded document with zero hallucinations.
 * Also extracts and verifies duration and tools explicitly from the document.
 */
export async function condenseDocToOneLiners(rawText, courseTitle = '', fileName = '') {
  const clean = String(rawText || '').trim();
  if (!clean) return [];

  // Extract baseline duration, tools, and projects deterministically from document text/file
  const detectedDuration = extractDurationFromDoc(clean, fileName, courseTitle);
  const detectedTools = extractToolsFromSyllabus([], clean);
  const detectedProjects = extractProjectsFromDoc(clean, detectedTools);

  const clipped = clean.slice(0, 16000); // keep prompt bounded
  try {
    const config = await getAIConfig();
    if (config.active_provider === 'disabled') {
      const fallback = splitDocToSectionsFallback(clean);
      fallback.duration = detectedDuration;
      fallback.tools = detectedTools;
      fallback.projects = detectedProjects;
      fallback.verified = true;
      return fallback;
    }

    const prompt = `You are the Lead Curriculum Verifier and Editor for Marvel Slice Institute.
Course: "${courseTitle}".
We are actively conducting this official course for enrolled students based on the provided document.
What is published in this brochure is an official commitment to enrolled students.

CRITICAL INSTRUCTIONS (ZERO HALLUCINATIONS):
1. ZERO EXTRA CONTENT: Generate curriculum sections ONLY from the provided document. You may expand and format existing topics into professional, clear bullet points, but NEVER add new concepts, frameworks, or subjects that do not exist in the document.
2. STRICT TOOLS & TECHS: Extract ONLY the tools, software, IDEs, libraries, and technologies explicitly mentioned in the document. Do not invent any tool.
3. STRICT DURATION: Identify the course duration stated in the document or file title (e.g. "6 Months", "3 Months", "8 Weeks"). Expected timeline: "${detectedDuration || 'Not explicitly stated'}".
4. TITLE RULE: Use the clean subject heading directly from the document (e.g. "HTML5", "CSS3", "React Basics", "SEO Optimization"). NEVER output phantom titles like "Module 135" or "Module 184". Strip "Module X:" prefix from titles so only the subject remains.
5. BULLET RULE: Never include module heading prefixes like "Module 11:" or "Module 12:" inside bullet points. Every bullet must be an actual topic or tool from the doc.
6. DEDUPLICATION: Never repeat bullet points, and never duplicate the module title inside its own bullet points.
7. Each section: 6 to 12 concise bullet lines.
8. EVERY bullet: short single line, max 12 words (never long paragraphs).
9. NEVER use the word "capstone" anywhere - always say "project".
10. Return ONLY raw JSON:
{
  "duration": "${detectedDuration || '3 Months'}",
  "tools": ["Tool1", "Tool2"],
  "sections": [
    { "title": "Module Title", "lines": ["Topic 1", "Topic 2"] }
  ]
}

DOCUMENT:
${clipped}`;

    const aiRes = await generateContentWithAI(prompt, { maxTokens: 2500, temperature: 0.2 });
    let txt = (aiRes?.text || '').trim();
    if (txt.startsWith('```json')) txt = txt.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (txt.startsWith('```')) txt = txt.replace(/^```\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(txt);

    let parsedDuration = detectedDuration;
    if (parsed.duration && typeof parsed.duration === 'string' && parsed.duration.trim()) {
      const durStr = parsed.duration.trim();
      if (/\b\d+\s*(?:months?|weeks?|days?)\b/i.test(durStr)) {
        parsedDuration = durStr;
      }
    }

    let parsedTools = detectedTools;
    if (Array.isArray(parsed.tools) && parsed.tools.length > 0) {
      const aiTools = parsed.tools.map((t) => String(t).trim()).filter(Boolean);
      parsedTools = [...new Set([...detectedTools, ...aiTools])];
    }

    const sections = (parsed.sections || [])
      .map((s) => {
        const title = String(s.title || '')
          .replace(/^(?:Module|Chapter|Unit|Part|Section)\s*\d+[:\-.]?\s*/i, '')
          .replace(/^[—–-]\s*/, '')
          .trim()
          .slice(0, 80);
        const lines = (s.lines || [])
          .map((l) => String(l)
            .replace(/^[-•*◦▪]\s*/, '')
            .replace(/^(?:Module|Chapter|Unit|Part)\s*\d+[:\-.]?\s*/i, '')
            .trim()
          )
          .filter((l) => l && l.toLowerCase() !== title.toLowerCase())
          .slice(0, MAX_LINES_PER_PAGE);
        return { title, lines: [...new Set(lines)] };
      })
      .filter((s) => s.title && s.lines.length);

    if (sections.length) {
      const normalized = normalizeDocSections(sections);
      normalized.duration = parsedDuration;
      normalized.tools = parsedTools;
      normalized.projects = detectedProjects;
      normalized.verified = true;
      return normalized;
    }

    const fallback = splitDocToSectionsFallback(clean);
    fallback.duration = parsedDuration;
    fallback.tools = parsedTools;
    fallback.projects = detectedProjects;
    fallback.verified = true;
    return fallback;
  } catch (err) {
    console.warn('AI condense failed, using local split:', err?.message || err);
    const fallback = splitDocToSectionsFallback(clean);
    fallback.duration = detectedDuration;
    fallback.tools = detectedTools;
    fallback.projects = detectedProjects;
    fallback.verified = true;
    return fallback;
  }
}
