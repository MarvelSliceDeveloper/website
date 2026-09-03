import { generateContentWithAI, getAIConfig } from './aiService';

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Deep Fallback Course Synthesizer
 * Generates an exhaustive, production-grade course structure matching website requirements.
 */
export function synthesizeFallbackCourse({ courseName, keyPoints = '', duration = '3 to 6 months', mode = 'Online', category = 'Software Learning' }) {
  const title = courseName || 'Professional Software Engineering Program';
  const slug = slugify(title);

  return {
    title,
    slug,
    subtitle: `Master ${title} with In-Depth Phased Curriculum, Production Capstones, and 100% Placement Support`,
    description: `An intensive, career-oriented training program engineered in collaboration with senior software architects. Master modern software engineering paradigms, scalable cloud microservices, and automated testing from zero to enterprise scale.`,
    duration: duration || '3 to 6 months',
    mode: mode || 'Online',
    status: 'Active',
    is_published: true,
    cta_left: 'Talk to Advisor/Pay Now',
    cta_right: 'Download Brochure',
    cta_left_action: 'choice_popup',
    cta_heading: `Accelerate Your Tech Career with ${title}`,
    cta_description: `Join ambitious developers and professionals mastering high-demand engineering skills with Marvel Slice Academy.`,
    cta_text: 'Apply Now',
    cta_link: '',
    pay_now_url: '',
    hero_image_url: '',
    video_url: '',
    cta_background_image: '',
    checklist_items: [
      `End-to-End ${title} Core & Advanced Architecture`,
      'Hands-On Live Coding Labs & Daily Problem Solving',
      'Production-Grade Microservices & Cloud CI/CD Deployment',
      '1-on-1 Senior Architect Mentorship & Interview Coaching'
    ],
    highlights: [
      { icon: 'code', label: 'Practical Live Labs' },
      { icon: 'shield', label: 'Beginner Friendly' },
      { icon: 'trending', label: 'Industry Relevant' },
      { icon: 'star', label: '4.9/5 Rating' },
      { icon: 'users', label: '700+ Enrolled' },
      { icon: 'award', label: 'Verified Certificate' },
      { icon: 'clock', label: 'Flexible Schedule' },
      { icon: 'video', label: 'HD Recorded Sessions' },
      { icon: 'zap', label: '100% Placement Support' }
    ],
    projects: [
      {
        title: 'Multi-Vendor Enterprise E-Commerce & Payment Engine',
        description: 'Architect a scalable multi-tier web platform with decoupled microservices, real-time inventory locking with Redis, Stripe payment webhooks, and automated order fulfillment.'
      },
      {
        title: 'Real-Time Collaborative Workspace & Communications Hub',
        description: 'Build a low-latency collaborative document editor with WebSockets bidirectional synchronization, user presence indicators, rich text formatting, and AWS S3 asset uploads.'
      },
      {
        title: 'Cloud-Native Microservices SaaS with Automated CI/CD',
        description: 'Design decoupled services with RabbitMQ event messaging, centralized API Gateway, Docker multi-stage containerization, and automated GitHub Actions deployment to AWS.'
      }
    ],
    overview_faqs: [
      {
        question: 'What practical technical competencies and tools will I master in this program?',
        answer: `You will gain end-to-end practical mastery in ${title}, covering computational logic, modern frameworks, database schema design, REST/GraphQL APIs, Docker containerization, and automated testing.`
      },
      {
        question: 'How are the live interactive lectures, labs, and doubt resolution structured?',
        answer: 'Sessions are instructor-led with hands-on coding. Learners receive 1-on-1 mentor guidance, weekly open office hours, line-by-line project code reviews, and lifetime access to HD class recordings.'
      }
    ],
    faqs: [
      {
        question: 'Are there any prerequisites required to enroll in this course?',
        answer: 'No prior advanced programming experience is mandatory. The program includes comprehensive foundational preparatory modules covering programming logic from scratch.'
      },
      {
        question: 'Will I receive a verified industry certificate upon completion?',
        answer: 'Yes. Upon completing coursework and capstone project defenses, you will receive the Marvel Slice Certified Professional credential with a permanent digital verification link.'
      },
      {
        question: 'How does Marvel Slice support career placement and technical interviews?',
        answer: 'We provide dedicated resume restructuring, GitHub portfolio optimization, algorithmic coding preparation, 1-on-1 mock technical interviews, and direct referrals to 500+ corporate hiring partners.'
      },
      {
        question: 'What happens if I miss a live session or need revision?',
        answer: 'Every live session is recorded in HD and uploaded to your personal LMS student portal within hours, accompanied by full source code repositories and class notes.'
      }
    ],
    tabs: [
      {
        label: 'Overview',
        title: 'Overview',
        content_type: 'overview',
        content: {
          heading: `Master ${title} from Foundations to Enterprise Scale`,
          paragraph: `The ${title} is an intensive, career-oriented training program engineered in collaboration with senior software architects. It bridges the gap between academic theory and enterprise engineering standards through intensive hands-on implementation.`,
          subheading: 'Core Competencies & Learning Methodology',
          subparagraph: 'Over 70% of program time is dedicated to live coding, architectural design, and production capstone deliverables.',
          headingAlign: 'left',
          paragraphAlign: 'left',
          subheadingAlign: 'left',
          subparagraphAlign: 'left',
          qa: [
            {
              question: 'What industry tools and technologies are covered in this program?',
              answers: [
                'Core language syntax, data structures, and object-oriented design patterns',
                'Modern component architecture, responsive styling, and state management',
                'Scalable REST/GraphQL API design, database modeling, and caching',
                'Cloud infrastructure, Docker containers, and CI/CD automated pipelines'
              ]
            },
            {
              question: 'Who will benefit most from this certification program?',
              answers: [
                'College students and freshers seeking high-paying software engineering placements',
                'Working IT professionals looking to upskill into Full Stack or Backend specialist roles',
                'Non-IT professionals seeking a structured, mentored career transition into tech'
              ]
            },
            {
              question: 'How is student progress and code quality evaluated?',
              answers: [
                'Weekly hands-on coding assignments with automated test evaluation',
                '1-on-1 mentor code reviews focusing on clean architecture and best practices',
                'Capstone project defense and live technical demonstration'
              ]
            }
          ]
        }
      },
      {
        label: 'Curriculum',
        title: 'Curriculum',
        content_type: 'overview',
        content: {
          heading: 'Comprehensive Phased Curriculum & Syllabus Breakdown',
          paragraph: 'Our curriculum is structured in sequential phases to systematically guide learners from foundational logic to complex production architectures and cloud deployments.',
          subheading: 'Phase-by-Phase Technical Deep Dive',
          subparagraph: 'Every module combines deep conceptual clarity with practical hands-on lab exercises and real-world coding tasks.',
          headingAlign: 'left',
          paragraphAlign: 'left',
          subheadingAlign: 'left',
          subparagraphAlign: 'left',
          qa: [
            {
              question: 'Phase 1: Programming Foundations, OOP & Algorithmic Logic',
              answers: [
                'Core syntax, primitive and reference data types, type coercion, and memory lifecycle',
                'Control structures, iterative loops, functions, closures, and modular programming',
                'Object-Oriented Programming (OOP): Inheritance, Polymorphism, Encapsulation, Abstraction',
                'Essential Data Structures: Arrays, Linked Lists, Stacks, Queues, Hash Tables',
                'Hands-On Lab: Implementing modular CLI tools and algorithmic problem solvers'
              ]
            },
            {
              question: 'Phase 2: Modern Frontend Engineering & Component Architecture',
              answers: [
                'Component-driven UI development, virtual DOM, and component lifecycles',
                'Complex client-side state management, Context API, and global stores',
                'Responsive design with Tailwind CSS, Flexbox, Grid, and CSS Modules',
                'Form handling, asynchronous schema validation, and API integration',
                'Hands-On Lab: Developing an interactive SaaS analytics dashboard with real-time charts'
              ]
            },
            {
              question: 'Phase 3: Backend Architecture, REST/GraphQL APIs & Databases',
              answers: [
                'Asynchronous server runtimes, event loops, and non-blocking I/O operations',
                'RESTful API architecture: Resource URI design, status codes, and error handling',
                'GraphQL API development: Schemas, queries, mutations, and resolvers',
                'Relational database design (PostgreSQL/MySQL), SQL queries, indexing, and migrations',
                'NoSQL document modeling with MongoDB and in-memory caching with Redis',
                'Hands-On Lab: Engineering a multi-tenant RESTful backend with Redis caching'
              ]
            },
            {
              question: 'Phase 4: Enterprise Security, Authentication & Microservices',
              answers: [
                'Stateless JWT authentication, refresh token rotation, and OAuth 2.0 social logins',
                'Role-Based Access Control (RBAC) and permissions management',
                'Preventing OWASP Top 10 security vulnerabilities: SQLi, XSS, CSRF, and CORS policies',
                'Microservices decomposition, API Gateways, and event messaging queues',
                'Hands-On Lab: Building an enterprise authentication microservice with 2FA'
              ]
            },
            {
              question: 'Phase 5: Cloud Infrastructure, Docker & Automated CI/CD DevOps',
              answers: [
                'Docker containerization, multi-stage Dockerfiles, and Docker Compose',
                'Cloud infrastructure services: AWS / Cloud computing, S3 storage, and RDS databases',
                'Continuous Integration (CI) and Deployment (CD) with GitHub Actions',
                'Nginx reverse proxies, SSL certificate termination, and load balancing',
                'Hands-On Lab: Containerizing and deploying full-stack applications to cloud'
              ]
            },
            {
              question: 'Phase 6: Automated Testing, QA & Production Observability',
              answers: [
                'Test-Driven Development (TDD) with modern unit and integration test runners',
                'End-to-End (E2E) browser automation using Playwright and Cypress',
                'Application Performance Monitoring (APM), structured logging, and metrics',
                'Hands-On Lab: Writing an automated test suite achieving 90%+ code coverage'
              ]
            }
          ]
        }
      },
      {
        label: 'Projects',
        title: 'Projects',
        content_type: 'overview',
        content: {
          heading: 'Production-Grade Industry Capstone Projects',
          paragraph: 'Theory alone is insufficient to stand out in today’s tech market. Build 3 substantial production applications to showcase during technical interviews.',
          subheading: 'Portfolio-Ready Application Blueprints',
          subparagraph: 'Every project is published to public GitHub repositories with clean commit histories, automated tests, and cloud deployments.',
          headingAlign: 'left',
          paragraphAlign: 'left',
          subheadingAlign: 'left',
          subparagraphAlign: 'left',
          qa: [
            {
              question: 'Capstone Project 1: Multi-Vendor E-Commerce Platform',
              answers: [
                'Architecture: React frontend, Node/Python API backend, PostgreSQL database, Redis cache',
                'Features: Real-time stock reservation, Stripe payment gateway, admin metrics dashboard',
                'Portfolio Impact: Demonstrates ACID transactional integrity and third-party financial integrations'
              ]
            },
            {
              question: 'Capstone Project 2: Real-Time Collaborative Workspace',
              answers: [
                'Architecture: Next.js, WebSockets, Socket.io, MongoDB, Redis pub/sub, Tailwind CSS',
                'Features: Simultaneous document editing, operational transforms, audio/chat channels',
                'Portfolio Impact: Validates deep command of low-latency real-time data streaming'
              ]
            },
            {
              question: 'Capstone Project 3: Cloud-Native Microservices SaaS with CI/CD',
              answers: [
                'Architecture: Decoupled microservices, RabbitMQ message broker, Docker, AWS EC2/RDS',
                'Features: Centralized API Gateway, automated billing queues, GitHub Actions CI/CD pipeline',
                'Portfolio Impact: Proves enterprise cloud readiness and DevOps containerization mastery'
              ]
            }
          ]
        }
      },
      {
        label: 'Certification',
        title: 'Certification',
        content_type: 'overview',
        content: {
          heading: 'Verified Industry Credential & Placement Assistance',
          paragraph: 'Earn a globally verifiable professional certificate from Marvel Slice Institute upon completing coursework, code reviews, and capstone defenses.',
          subheading: 'Career Acceleration & Placement Framework',
          subparagraph: 'We provide dedicated placement support from your first day until you successfully secure your new role.',
          headingAlign: 'left',
          paragraphAlign: 'left',
          subheadingAlign: 'left',
          subparagraphAlign: 'left',
          qa: [
            {
              question: 'How is the Marvel Slice certificate verified by employers?',
              answers: [
                'Each certificate features a unique cryptographic verification link and digital badge',
                'Directly embeddable on LinkedIn licenses & certifications section',
                'Recognized across top technology startups and corporate hiring partners'
              ]
            },
            {
              question: 'What career coaching and interview preparation is included?',
              answers: [
                'ATS-compliant technical resume restructuring and LinkedIn optimization',
                'Algorithmic problem-solving drills and system design whiteboard sessions',
                '1-on-1 mock technical interviews with senior engineering mentors',
                'Exclusive profile shortlisting and direct referrals to 500+ corporate hiring partners'
              ]
            }
          ]
        }
      }
    ],
    certifications: [
      {
        description: `Upon successful project review and assessment completion, candidates receive the Marvel Slice Certified ${title} Professional credential recognized across top technology enterprises.`,
        certificate_image_url: '',
        recognized_companies: ['Top Product Firms', 'Global Consultancies', 'Tech Startups']
      }
    ]
  };
}

/**
 * AI Course Creator
 * Takes Course Name + Key Points, calls AI engine, and returns a fully populated Course Object.
 */
export async function generateFullCourseWithAI({ courseName, keyPoints = '', duration = '3 to 6 months', mode = 'Online', category = 'Software Learning' }) {
  const fallback = synthesizeFallbackCourse({ courseName, keyPoints, duration, mode, category });

  try {
    const config = await getAIConfig();
    if (config.active_provider === 'disabled') {
      return fallback;
    }

    const prompt = `You are the Lead Curriculum Architect for "Marvel Slice Institute for Software Learning and Competitive Exams".
Create a deep, comprehensive, production-ready course specification for the website based on the following input:

Course Name: "${courseName}"
Key Points / Requirements: "${keyPoints || 'Comprehensive modern curriculum, practical hands-on labs, real-world industry capstone projects, placement preparation.'}"
Duration: "${duration}"
Mode: "${mode}"
Category: "${category}"

Generate a complete JSON object matching the exact database schema below. Do NOT include image URLs or fake image links (leave image fields empty strings).
Ensure all 4 tabs (Overview, Curriculum, Projects, Certification) are populated with in-depth paragraphs and rich accordion Q&As.

{
  "title": "${courseName}",
  "slug": "${slugify(courseName)}",
  "subtitle": "Engaging professional subtitle (1-2 sentences)",
  "description": "Comprehensive course description (2-4 sentences explaining what students will learn, career outcomes, and hands-on methodology)",
  "duration": "${duration}",
  "mode": "${mode}",
  "cta_left": "Talk to Advisor/Pay Now",
  "cta_right": "Download Brochure",
  "cta_heading": "High-impact CTA banner headline",
  "cta_description": "Compelling 1-2 sentence description for the enrollment banner",
  "cta_text": "Apply Now",
  "checklist_items": [
    "Key curriculum highlight 1",
    "Key curriculum highlight 2",
    "Key curriculum highlight 3",
    "Key curriculum highlight 4"
  ],
  "highlights": [
    { "icon": "code", "label": "Practical Live Labs" },
    { "icon": "shield", "label": "Beginner Friendly" },
    { "icon": "trending", "label": "Industry Relevant" },
    { "icon": "star", "label": "4.9/5 Rating" },
    { "icon": "users", "label": "700+ Enrolled" },
    { "icon": "award", "label": "Verified Certificate" },
    { "icon": "clock", "label": "Flexible Schedule" },
    { "icon": "video", "label": "HD Recorded Sessions" },
    { "icon": "zap", "label": "100% Placement Support" }
  ],
  "projects": [
    {
      "title": "Capstone Project 1 Title",
      "description": "Detailed explanation of what learners build, architecture, and portfolio value."
    },
    {
      "title": "Capstone Project 2 Title",
      "description": "Detailed explanation of what learners build, architecture, and portfolio value."
    },
    {
      "title": "Capstone Project 3 Title",
      "description": "Detailed explanation of what learners build, architecture, and portfolio value."
    }
  ],
  "overview_faqs": [
    {
      "question": "What key practical skills and competencies will I master in this program?",
      "answer": "Detailed 2-3 sentence answer covering technical skills, frameworks, and architecture patterns."
    },
    {
      "question": "How are the live classes, hands-on labs, and doubt support structured?",
      "answer": "Detailed 2-3 sentence answer explaining mentor guidance, live sessions, and 1-on-1 code reviews."
    }
  ],
  "faqs": [
    {
      "question": "Are there any prerequisites required to enroll in this course?",
      "answer": "Clear explanation of eligibility, foundational prep modules, and beginner suitability."
    },
    {
      "question": "Will I receive a verified industry certificate upon completion?",
      "answer": "Explanation of the Marvel Slice verified certificate with permanent online credential validation."
    },
    {
      "question": "How does Marvel Slice provide placement and interview assistance?",
      "answer": "Details on resume optimization, mock technical interviews, and corporate hiring partner referrals."
    },
    {
      "question": "What happens if I miss a live session?",
      "answer": "Explanation of HD lecture recordings, GitHub repositories, and LMS access."
    }
  ],
  "tabs": [
    {
      "label": "Overview",
      "title": "Overview",
      "content_type": "overview",
      "content": {
        "heading": "Course Overview & Learning Objectives",
        "paragraph": "Comprehensive overview paragraph explaining the foundational pillars and practical methodology of this course.",
        "subheading": "Key Competencies & Learning Methodology",
        "subparagraph": "Over 70% of program time is dedicated to live coding, architectural design, and production capstone deliverables.",
        "headingAlign": "left",
        "paragraphAlign": "left",
        "subheadingAlign": "left",
        "subparagraphAlign": "left",
        "qa": [
          {
            "question": "What industry tools and technologies are covered?",
            "answers": [
              "Detailed tool 1 with practical use-case",
              "Detailed tool 2 with practical use-case",
              "Detailed tool 3 with practical use-case"
            ]
          },
          {
            "question": "Who will benefit most from this certification?",
            "answers": [
              "College graduates seeking top software engineering roles",
              "Working professionals upskilling for promotions and career transitions"
            ]
          }
        ]
      }
    },
    {
      "label": "Curriculum",
      "title": "Curriculum",
      "content_type": "overview",
      "content": {
        "heading": "Structured In-Depth Curriculum & Syllabus Breakdown",
        "paragraph": "A phased, comprehensive curriculum taking learners from core fundamentals to scalable cloud deployment.",
        "subheading": "Phase-by-Phase Technical Deep Dive",
        "subparagraph": "Every module combines deep conceptual clarity with practical hands-on lab exercises and real-world coding tasks.",
        "headingAlign": "left",
        "paragraphAlign": "left",
        "subheadingAlign": "left",
        "subparagraphAlign": "left",
        "qa": [
          {
            "question": "Phase 1: Core Fundamentals & Programming Logic",
            "answers": [
              "Core syntax, data types, control structures, and modular functions",
              "Object-Oriented Programming (OOP) and clean architecture principles",
              "Hands-on Lab: Implementing CLI utility tools and algorithmic problem solvers"
            ]
          },
          {
            "question": "Phase 2: Modern Development & API Architecture",
            "answers": [
              "Component architecture, responsive styling, and state management",
              "Backend API engineering, database schema normalization, and caching",
              "Hands-on Lab: Engineering a scalable multi-tenant RESTful backend"
            ]
          },
          {
            "question": "Phase 3: Cloud, DevOps & Production Ready",
            "answers": [
              "Docker containerization, automated testing (TDD), and CI/CD releases",
              "Cloud deployment, APM monitoring, and system optimization",
              "Hands-on Lab: Containerizing and deploying full-stack applications to cloud"
            ]
          }
        ]
      }
    },
    {
      "label": "Projects",
      "title": "Projects",
      "content_type": "overview",
      "content": {
        "heading": "Industry Capstone Projects",
        "paragraph": "Build a distinguished GitHub portfolio of production applications to showcase to hiring managers.",
        "subheading": "Portfolio-Ready Production Applications",
        "subparagraph": "Every project is published to public GitHub repositories with clean commit histories and cloud deployments.",
        "headingAlign": "left",
        "paragraphAlign": "left",
        "subheadingAlign": "left",
        "subparagraphAlign": "left",
        "qa": [
          {
            "question": "Capstone Project 1: Multi-Vendor Platform",
            "answers": [
              "Full stack architecture with secure authentication and database persistence",
              "Live cloud deployment and automated CI/CD pipeline"
            ]
          }
        ]
      }
    },
    {
      "label": "Certification",
      "title": "Certification",
      "content_type": "overview",
      "content": {
        "heading": "Verified Industry Credential",
        "paragraph": "Earn a globally verifiable professional certificate from Marvel Slice upon completing coursework and project defenses.",
        "subheading": "Career Acceleration & Placement Framework",
        "subparagraph": "We provide dedicated placement support from your first day until you successfully secure your new role.",
        "headingAlign": "left",
        "paragraphAlign": "left",
        "subheadingAlign": "left",
        "subparagraphAlign": "left",
        "qa": [
          {
            "question": "Credential Validation & Career Support",
            "answers": [
              "Shareable digital verification code for LinkedIn and resume profiles",
              "Direct profile referrals to Marvel Slice 500+ corporate hiring partner network"
            ]
          }
        ]
      }
    }
  ],
  "certifications": [
    {
      "description": "Upon successful project review and assessment completion, candidates receive the Marvel Slice Certified Professional credential recognized across top technology firms.",
      "certificate_image_url": "",
      "recognized_companies": ["Top Product Firms", "Global Consultancies", "Tech Startups"]
    }
  ]
}

Return ONLY raw valid JSON, no markdown codeblocks, no commentary.`;

    const aiRes = await generateContentWithAI(prompt, { maxTokens: 4000, temperature: 0.7 });
    if (aiRes?.text) {
      let cleaned = aiRes.text.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');

      const parsed = JSON.parse(cleaned);

      return {
        ...fallback,
        title: parsed.title || fallback.title,
        slug: parsed.slug || slugify(parsed.title || fallback.title),
        subtitle: parsed.subtitle || fallback.subtitle,
        description: parsed.description || fallback.description,
        duration: parsed.duration || fallback.duration,
        mode: parsed.mode || fallback.mode,
        cta_heading: parsed.cta_heading || fallback.cta_heading,
        cta_description: parsed.cta_description || fallback.cta_description,
        cta_text: parsed.cta_text || fallback.cta_text,
        checklist_items: Array.isArray(parsed.checklist_items) && parsed.checklist_items.length > 0 ? parsed.checklist_items.slice(0, 4) : fallback.checklist_items,
        highlights: Array.isArray(parsed.highlights) && parsed.highlights.length >= 9 ? parsed.highlights.slice(0, 9) : fallback.highlights,
        projects: Array.isArray(parsed.projects) && parsed.projects.length >= 3 ? parsed.projects.slice(0, 3) : fallback.projects,
        overview_faqs: Array.isArray(parsed.overview_faqs) && parsed.overview_faqs.length > 0 ? parsed.overview_faqs : fallback.overview_faqs,
        faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0 ? parsed.faqs : fallback.faqs,
        tabs: Array.isArray(parsed.tabs) && parsed.tabs.length > 0 ? formatCourseTabs(parsed.tabs) : fallback.tabs,
        certifications: Array.isArray(parsed.certifications) && parsed.certifications.length > 0 ? parsed.certifications : fallback.certifications,
      };
    }
  } catch (err) {
    console.warn('AI course creation failed or skipped, using rich synthesizer fallback:', err.message);
  }

  return fallback;
}

function formatCourseTabs(tabs) {
  return tabs.map((t, idx) => {
    const titleStr = typeof t === 'string' ? t : (t.label || t.title || `Tab ${idx + 1}`);
    const headingStr = typeof t === 'object' && t.content?.heading ? t.content.heading : (t.heading || titleStr);
    const paragraphStr = typeof t === 'object' ? (typeof t.content === 'string' ? t.content : (t.content?.paragraph || t.paragraph || t.description || '')) : '';

    let rawQa = [];
    if (typeof t === 'object') {
      rawQa = t.qa || t.content?.qa || t.items || t.features || t.questions || [];
    }
    if (!Array.isArray(rawQa)) rawQa = [];

    const formattedQa = rawQa.map(qItem => {
      if (typeof qItem === 'string') {
        return { question: qItem, answers: [qItem] };
      }
      const question = qItem.question || qItem.title || qItem.q || '';
      let answers = qItem.answers || qItem.answer || qItem.bullets || qItem.items || [];
      if (typeof answers === 'string') {
        answers = answers.split('\n').map(s => s.trim()).filter(Boolean);
      } else if (!Array.isArray(answers)) {
        answers = [];
      }
      return { question, answers };
    }).filter(q => q.question.trim());

    return {
      label: titleStr,
      title: titleStr,
      content_type: 'overview',
      content: {
        heading: headingStr,
        paragraph: paragraphStr,
        subheading: typeof t === 'object' && t.content?.subheading ? t.content.subheading : (t.subheading || ''),
        subparagraph: typeof t === 'object' && t.content?.subparagraph ? t.content.subparagraph : (t.subparagraph || ''),
        headingAlign: 'left',
        paragraphAlign: 'left',
        subheadingAlign: 'left',
        subparagraphAlign: 'left',
        qa: formattedQa
      }
    };
  });
}
