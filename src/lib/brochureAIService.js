import { generateContentWithAI, getAIConfig } from './aiService';

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

    // Section 1: Executive Overview & Introduction
    overview: {
      heading: 'Program Overview & Executive Summary',
      paragraphs: [
        `The ${title} offered by Marvel Slice Institute for Software Learning and Competitive Exams is an elite, industry-oriented training initiative designed to bridge the widening gap between traditional academic curricula and modern high-scale software engineering standards. Engineered in collaboration with seasoned software architects and technical hiring leads, this program prepares ambitious learners to master cutting-edge technologies, build robust applications, and excel in competitive global engineering roles.`,
        `Throughout this intensive journey, participants move progressively from foundational computational logic and object-oriented paradigms to advanced cloud architectures, microservices design, and automated DevOps workflows. We emphasize deep conceptual clarity coupled with relentless practical application, ensuring you write production-grade, maintainable, and secure code from day one.`,
        `With over 70% of the program dedicated to hands-on live labs, architectural coding sprints, and portfolio-ready capstone systems, you will cultivate the exact problem-solving mindset and technical dexterity demanded by top tech enterprises, innovative startups, and global consultancies.`
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

    // Section 6: Real-World Capstone Projects
    capstones: {
      heading: 'Production Capstone Projects & Portfolio Building',
      paragraphs: [
        'Theory alone is insufficient to stand out in today’s competitive tech market. At Marvel Slice Academy, you build four substantial, production-grade applications that serve as undeniable proof of your engineering capabilities during technical interviews.'
      ],
      projects: [
        {
          title: 'Capstone 1: Enterprise Multi-Vendor Marketplace & E-Commerce Platform',
          subheading: 'Scalable E-Commerce Ecosystem with Real-Time Inventory & Stripe Payments',
          paragraphs: [
            'A comprehensive e-commerce platform supporting multiple seller storefronts, customer carts, and automated order fulfillment. Engineered with a decoupled frontend and scalable microservices backend.',
            'Key features include real-time stock reservation via Redis, automated invoice generation, customer review moderation, and full Stripe webhook payment lifecycle management.'
          ],
          techStack: 'React, Node.js, Express, PostgreSQL, Redis, Stripe API, Docker',
          portfolioImpact: 'Proves your capability to handle complex business logic, ACID transactions, and third-party financial integrations.'
        },
        {
          title: 'Capstone 2: Real-Time Collaborative Workspace & Communications Hub',
          subheading: 'High-Concurrency Collaborative Document Editor & Live Chat System',
          paragraphs: [
            'A high-performance team collaboration platform featuring real-time simultaneous document editing, operational transformation, multimedia uploads, and low-latency group audio/chat channels.',
            'Utilizes WebSockets for sub-100ms message delivery, Redis pub/sub for cross-server event scaling, and AWS S3 for secure asset storage.'
          ],
          techStack: 'TypeScript, Next.js, WebSockets, Socket.io, MongoDB, AWS S3, Tailwind CSS',
          portfolioImpact: 'Demonstrates deep command of distributed event broadcasting, real-time synchronization, and modern full-stack TypeScript.'
        },
        {
          title: 'Capstone 3: Cloud-Native Microservices SaaS with Automated DevOps CI/CD',
          subheading: 'Decoupled Microservices Architecture on AWS with Automated Releases',
          paragraphs: [
            'A subscription-based SaaS application broken down into independent microservices: User Authentication, Subscription Billing, Email Dispatcher, and Analytics Ingestion.',
            'Features an asynchronous RabbitMQ message queue, centralized API Gateway, Dockerized service deployment, and a full GitHub Actions automated test/deploy pipeline.'
          ],
          techStack: 'Node.js, Python, RabbitMQ, Docker, AWS EC2/RDS, GitHub Actions, Nginx',
          portfolioImpact: 'Validates enterprise-level cloud readiness, container orchestration, and automated DevOps capabilities.'
        },
        {
          title: 'Capstone 4: AI-Enhanced Business Intelligence & Analytics Dashboard',
          subheading: 'Interactive Data Visualizer with Automated AI Report Synthesis',
          paragraphs: [
            'An executive business dashboard that ingests raw operational metrics, renders interactive charts, and leverages LLM AI APIs to automatically generate executive analytical summaries.',
            'Includes custom data filtering, exportable PDF/Excel reporting, and role-based access management for enterprise department heads.'
          ],
          techStack: 'React, FastAPI, Gemini / OpenRouter AI API, PostgreSQL, Recharts, Tailwind CSS',
          portfolioImpact: 'Demonstrates your ability to integrate cutting-edge AI services into commercial web applications for tangible business value.'
        }
      ]
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
          desc: 'We transform your resume into an ATS-compliant document emphasizing your real capstone projects and optimize your LinkedIn & GitHub profiles to attract inbound recruiter inquiries.'
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
          a: 'Placement preparation starts during the final capstone phase. Resume reviews, mock technical interviews, and corporate referrals continue until you successfully secure your placement.'
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

    const prompt = `You are the Lead Curriculum Architect at Marvel Slice Institute for Software Learning and Competitive Exams.
Please review the course "${course.title || 'Software Course'}" (${course.subtitle || ''}).
Generate rich, descriptive educational paragraphs and bullet points for an extensive 10+ page official course brochure.
Return a valid JSON object with:
{
  "executiveSummary": "A rich 3-paragraph executive overview of this course and its industry significance",
  "learningOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3", "Outcome 4", "Outcome 5", "Outcome 6", "Outcome 7", "Outcome 8"],
  "capstoneHighlights": [
    { "title": "Project 1 Title", "description": "Project overview paragraph", "tech": "Tech stack", "impact": "Portfolio impact paragraph" },
    { "title": "Project 2 Title", "description": "Project overview paragraph", "tech": "Tech stack", "impact": "Portfolio impact paragraph" },
    { "title": "Project 3 Title", "description": "Project overview paragraph", "tech": "Tech stack", "impact": "Portfolio impact paragraph" },
    { "title": "Project 4 Title", "description": "Project overview paragraph", "tech": "Tech stack", "impact": "Portfolio impact paragraph" }
  ]
}
Return ONLY raw JSON, without markdown formatting.`;

    const aiRes = await generateContentWithAI(prompt, { maxTokens: 2500, temperature: 0.7 });
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
        if (Array.isArray(parsed.capstoneHighlights) && parsed.capstoneHighlights.length >= 3) {
          data.capstones.projects = parsed.capstoneHighlights.map((p, idx) => ({
            title: p.title || `Capstone ${idx + 1}`,
            subheading: p.tech || 'Enterprise Project Architecture',
            paragraphs: [p.description || 'Enterprise production system.'],
            techStack: p.tech || 'Modern Full Stack Technologies',
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
