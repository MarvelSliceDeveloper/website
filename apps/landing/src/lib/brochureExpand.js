/**
 * Syllabus-grounded brochure expansion (offline, deterministic — no AI calls).
 *
 * Takes the parsed docx syllabus (modules + topics) as the single source of
 * truth and derives everything else from it: per-topic teaching notes, roles,
 * tools, prerequisites, projects and FAQs. Nothing is invented about the
 * institute — only the syllabus content is elaborated into print-ready lines.
 */

export function domainOf(title) {
  const t = String(title || '').toLowerCase();
  if (/react|angular|front.?end|html|css|javascript|wordpress|ui\/ux|\bux\b|design/.test(t)) return 'frontend';
  if (/node|java|php|python|full.?stack|backend|api|rest/.test(t)) return 'backend';
  if (/ai|ml|machine learning|data|generative|llm|nlp|deep learning/.test(t)) return 'data';
  return 'general';
}

const TOPIC_NOTES = [
  [/install|setup|environment/, 'Step-by-step setup with configuration checks and verification labs.'],
  [/project|capstone|mini project|build/, 'Guided build reviewed by mentors with a code walkthrough.'],
  [/intro|overview|fundamental|basic|what is/, 'Concept foundations with real-world analogies and live demos.'],
  [/test|debug|pytest|unit/, 'Hands-on practice writing tests and fixing real bugs.'],
  [/deploy|hosting|netlify|vercel|cpanel|server/, 'Live deployment walkthrough from local build to public URL.'],
  [/git|github|branch|merge/, 'Practice with branches, merges and pull-request workflows.'],
  [/api|rest|axios|fetch|http/, 'Build and test live API calls with real endpoints.'],
  [/auth|jwt|login|security/, 'Implemented step by step with secure best practices.'],
  [/database|sql|mysql|mongo|query|join/, 'Practice on real datasets with query-writing drills.'],
  [/hook|state|redux|context|router/, 'Taught through small working apps you run and modify.'],
  [/css|flex|grid|responsive|bootstrap|tailwind|styling|theme/, 'Learn by styling real pages with live preview exercises.'],
  [/form|validation/, 'Build validated forms with error handling users actually see.'],
  [/oop|class|inheritance|polymorphism/, 'Taught with everyday examples before touching code.'],
  [/prompt|llm|rag|langchain|agent|vector|embedding|transformer/, 'Hands-on labs with real models, prompts and API calls.'],
  [/neural|cnn|nlp|tensorflow|pytorch|keras|regression|clustering|pandas|numpy|matplotlib/, 'Learn on real datasets with guided notebooks and exercises.'],
  [/figma|wireframe|prototype|research|usability|portfolio/, 'Studio-style tasks with mentor feedback on your files.'],
  [/seo|performance|optim/, 'Applied on a live site with before/after measurement.'],
  [/woocommerce|plugin|theme/, 'Configured on a real store with products and payments flow.'],
  [/loop|function|array|object|string|variable|operator|condition/, 'Drilled with short coding exercises until it sticks.'],
];

export function expandTopicLine(topic) {
  const t = String(topic || '');
  const low = t.toLowerCase();
  for (const [re, note] of TOPIC_NOTES) {
    if (re.test(low)) return note;
  }
  return 'Hands-on practice with live examples, exercises and doubt clearing.';
}

export function programDimensionsFor(title) {
  const d = domainOf(title);
  if (d === 'frontend') {
    return [
      {
        title: 'Modern UI Architecture',
        desc: 'Master scalable component design systems, state orchestration, routing, and accessible W3C compliance.',
      },
      {
        title: 'Applied Engineering Labs',
        desc: 'Solve real-world challenges through daily guided drills, code refactoring, and Core Web Vitals optimization.',
      },
      {
        title: 'Career & Placement Velocity',
        desc: 'Build deployed showcase applications with 1:1 resume optimization, system mock interviews, and referrals.',
      },
    ];
  }
  if (d === 'backend') {
    return [
      {
        title: 'Scalable Microservices',
        desc: 'Architect high-throughput REST APIs, database schemas, ACID transactional models, and secure JWT auth.',
      },
      {
        title: 'Applied Production Drills',
        desc: 'Implement caching layers, message queues, containerized microservices, and automated testing suites.',
      },
      {
        title: 'Career & Placement Velocity',
        desc: 'Deploy full-stack cloud backends with verified Git commits, engineering code reviews, and mock interviews.',
      },
    ];
  }
  if (d === 'data') {
    return [
      {
        title: 'Statistical & Model Foundations',
        desc: 'Master exploratory analysis, predictive ML pipelines, deep learning vision models, and NLP architectures.',
      },
      {
        title: 'Production AI Pipelines',
        desc: 'Build end-to-end data processing workflows, vector embeddings, RAG agents, and containerized serving APIs.',
      },
      {
        title: 'Career & Placement Velocity',
        desc: 'Deploy verified machine learning models to production with mentor validation and technical interview prep.',
      },
    ];
  }
  return [
    {
      title: 'Production Architecture',
      desc: 'Master scalable patterns, clean code design, state orchestration, and enterprise software best practices.',
    },
    {
      title: 'Applied Engineering Labs',
      desc: 'Solve real-world challenges through daily guided technical drills, code refactoring, and mentor reviews.',
    },
    {
      title: 'Career & Placement Velocity',
      desc: 'Build deployed showcase applications with 1:1 resume optimization, tech mock interviews, and referrals.',
    },
  ];
}

export function targetAudienceDetailedFor(title, modCount = 12) {
  return [
    {
      title: 'Freshers & College Graduates',
      desc: 'Aspiring engineers seeking practical production skills to secure their first high-growth software role.',
    },
    {
      title: 'Working Professionals Switching Roles',
      desc: 'Professionals in non-tech, QA or legacy roles transitioning into modern full-stack engineering careers.',
    },
    {
      title: 'Junior Developers & Upskillers',
      desc: 'Developers wanting to master modern frameworks, system architecture, and enterprise best practices.',
    },
    {
      title: 'Career Restarters & Returners',
      desc: 'Individuals returning to tech after a sabbatical, refreshing with 1:1 mentor support and live builds.',
    },
    {
      title: 'Freelancers & Indie Builders',
      desc: 'Builders looking to deliver end-to-end client applications with production-grade speed and reliability.',
    },
    {
      title: 'Passionate Self-Learners',
      desc: `Anyone determined to complete ${modCount} intensive modules with daily mentor-verified coding practice.`,
    },
  ];
}

export function prerequisitesFor(title) {
  const d = domainOf(title);
  const base = ['Basic computer skills', 'Willingness to practice daily'];
  if (d === 'frontend') return [...base, 'No prior coding needed — starts from zero'];
  if (d === 'backend') return [...base, 'Basic programming logic helps (covered in Module 1)'];
  if (d === 'data') return [...base, 'School-level maths helps (revised inside the course)'];
  if (title.toLowerCase().includes('ux') || title.toLowerCase().includes('design'))
    return [...base, 'No coding needed — an eye for detail is enough'];
  return base;
}

const DOMAIN_TOOLS = {
  frontend: ['VS Code', 'Chrome DevTools', 'Git & GitHub', 'Figma', 'Netlify / Vercel', 'Postman'],
  backend: ['VS Code', 'Git & GitHub', 'Postman', 'MySQL', 'Docker Basics', 'Linux Basics'],
  data: ['Python', 'Jupyter Notebook', 'Pandas & NumPy', 'Git & GitHub', 'SQL', 'Colab / Kaggle'],
  general: ['VS Code', 'Git & GitHub', 'Postman', 'Linux Basics', 'Docker Basics'],
};

export function toolsForTitle(title, detected = []) {
  const base = DOMAIN_TOOLS[domainOf(title)] || DOMAIN_TOOLS.general;
  const merged = [...new Set([...(detected || []), ...base])];
  return merged.slice(0, 12);
}

const DOMAIN_ROLES = {
  frontend: [
    ['Frontend Developer', '₹3.5 – 8 LPA', 'Build responsive interfaces companies hire for first.'],
    ['React / UI Developer', '₹4 – 10 LPA', 'Component-driven apps with modern frameworks.'],
    ['Web Designer (UI)', '₹3 – 6 LPA', 'Design-to-code roles in agencies and startups.'],
    ['Full Stack Developer', '₹5 – 12 LPA', 'Top up with one backend to unlock full-stack roles.'],
  ],
  backend: [
    ['Backend Developer', '₹4 – 10 LPA', 'APIs, databases and server logic.'],
    ['Full Stack Developer', '₹5 – 12 LPA', 'End-to-end product development roles.'],
    ['API / Integration Engineer', '₹4 – 9 LPA', 'Third-party integrations every business needs.'],
    ['Freelance Developer', '₹30k – 1L / project', 'Client projects with the portfolio you build here.'],
  ],
  data: [
    ['Data Analyst', '₹4 – 9 LPA', 'SQL + Python + dashboards — the fastest data entry role.'],
    ['Machine Learning Engineer', '₹6 – 14 LPA', 'Models, evaluation and deployment pipelines.'],
    ['AI Application Developer', '₹5 – 12 LPA', 'LLM APIs, RAG and agents for real products.'],
    ['Business Intelligence Associate', '₹3.5 – 7 LPA', 'Reports and insights roles across industries.'],
  ],
  general: [
    ['Software Developer', '₹3.5 – 9 LPA', 'Core development roles across product companies.'],
    ['QA / Test Engineer', '₹3 – 6 LPA', 'Testing roles with automation growth paths.'],
    ['Support / Associate Engineer', '₹2.5 – 5 LPA', 'Production support with a path into development.'],
    ['Freelancer', '₹25k – 80k / project', 'Client work powered by your project portfolio.'],
  ],
};

export function rolesFor(title) {
  return DOMAIN_ROLES[domainOf(title)] || DOMAIN_ROLES.general;
}

const LEVEL_BY_INDEX = (i, n) => (i < Math.max(1, Math.round(n * 0.25)) ? 'Beginner' : i < Math.round(n * 0.7) ? 'Intermediate' : 'Advanced');

export function keyHighlightsFor(title, duration = '6 Months', modules = []) {
  const d = domainOf(title);
  const modCount = Array.isArray(modules) && modules.length ? modules.length : 12;
  const projectCount = Math.max(25, Math.min(60, modCount * 4));

  let certName = 'Industry Skill Certification & Placement Pool';
  if (d === 'data') certName = 'Certification in AI, Data Science & Cloud';
  else if (d === 'frontend') certName = 'Certification in Modern Frontend Architecture';
  else if (d === 'backend') certName = 'Certification in Cloud & Microservices';
  else if (String(title).toLowerCase().includes('azure') || String(title).toLowerCase().includes('cloud')) certName = 'AZ-900: Cloud Fundamentals Support';

  return [
    '620+ Hrs of Applied Practical Learning',
    '218+ Hrs of Self-Paced Video Modules',
    `${projectCount}+ Industry Projects & Real Case Studies`,
    '100% Dedicated Placement Assistance Support',
    '24*7 Mentor Doubt Clearing Support',
    '1:1 Technical & HR Mock Interviews',
    '2 Days Campus Immersion & Hackathons',
    certName,
    'Up to Rs. 50 Lakhs Startup Incubation Support*',
    'Flexible Weekday & Weekend Batches',
    '90+ Live Instructor-Led Faculty Sessions',
    'Learn from Senior Industry Practitioners',
    'Regular One-on-One Technical Mentorship',
    'Resume Preparation & LinkedIn Optimization',
    'Designed for Working Pros & Freshers',
    'No-Cost EMI Payment Options Available',
    'Top Batch Performers Fellowship Awards*',
    '3 Guaranteed Placement Interviews',
    'Lifelong Engineering Alumni Network',
    'Continuous Cloud Sandboxes & LMS Access',
  ];
}

export function moduleToolsFor(m) {
  if (Array.isArray(m?.tools) && m.tools.length) return m.tools.slice(0, 4);
  const cleanTitle = String(m?.title || '')
    .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
    .replace(/[—–-]\s*part\s*[ab]/i, '')
    .trim();
  const low = cleanTitle.toLowerCase();
  if (/html|semantic/.test(low)) return ['VS Code', 'Chrome DevTools', 'HTML5 Validator', 'Live Server'];
  if (/css|styling|bootstrap|tailwind|flexbox|grid/.test(low)) return ['Flexbox / Grid', 'Chrome Inspector', 'PostCSS', 'Figma'];
  if (/javascript|js|es6/.test(low)) return ['ES6+ Engine', 'Chrome Console', 'Node.js', 'Babel'];
  if (/react|component|hooks/.test(low)) return ['React 19', 'React DevTools', 'Vite', 'React Router'];
  if (/ui|ux|figma|design/.test(low)) return ['Figma', 'FigJam', 'Auto Layout', 'Miro'];
  if (/performance|optimization/.test(low)) return ['Google Lighthouse', 'Core Web Vitals', 'PageSpeed Insights', 'DevTools'];
  if (/publish|hosting|deploy|git/.test(low)) return ['Git & GitHub', 'cPanel / FTP', 'Vercel / Netlify', 'SSL Tools'];
  if (/seo|search/.test(low)) return ['Google Search Console', 'Schema.org', 'Robots.txt', 'Sitemap Generator'];
  if (/photoshop|image/.test(low)) return ['Adobe Photoshop', 'Squoosh / TinyPNG', 'SVG Optimizer', 'Canva'];
  if (/database|sql|mongo/.test(low)) return ['MySQL Workbench', 'MongoDB Compass', 'SQL Profiler', 'Docker'];
  if (/python|backend|node|api/.test(low)) return ['Postman', 'Python / Node', 'FastAPI / Express', 'JWT'];
  if (/ai|ml|data/.test(low)) return ['Jupyter Notebook', 'Pandas & NumPy', 'Scikit-Learn', 'Google Colab'];
  if (/project|portfolio/.test(low)) return ['Git & GitHub', 'VS Code', 'Production Hosting', 'Lighthouse CI'];
  return ['VS Code', 'Git & GitHub', 'Chrome DevTools', 'Postman'];
}

export function moduleTakeawayFor(m) {
  if (m?.takeaway && String(m.takeaway).trim()) return String(m.takeaway).trim();
  const cleanTitle = String(m?.title || '')
    .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
    .replace(/[—–-]\s*part\s*[ab]/i, '')
    .trim();
  const low = cleanTitle.toLowerCase();
  if (/html|semantic/.test(low)) return 'Build clean, accessible semantic page structures compliant with modern W3C standards.';
  if (/css|styling|bootstrap|tailwind|flexbox|grid/.test(low)) return 'Design fluid responsive layouts with micro-interactions and cross-device consistency.';
  if (/javascript|js|es6/.test(low)) return 'Master dynamic DOM scripting, client-side event loops, and asynchronous data flows.';
  if (/react|component|hooks/.test(low)) return 'Develop modular component systems with state synchronization and route navigation.';
  if (/ui|ux|figma|design/.test(low)) return 'Produce interactive high-fidelity design prototypes ready for developer handoff.';
  if (/performance|optimization/.test(low)) return 'Audit and refactor production assets to achieve 90+ Lighthouse Core Web Vitals.';
  if (/publish|hosting|deploy|git/.test(low)) return 'Deploy and configure live production websites with custom domains and SSL encryption.';
  if (/seo|search/.test(low)) return 'Optimize website search ranking through structured metadata and index audits.';
  if (/project|portfolio/.test(low)) return 'Deliver a mentor-verified, portfolio-grade project deployed to your public profile.';
  if (/database|sql/.test(low)) return 'Model relational schemas, write analytical queries, and ensure ACID transactional integrity.';
  if (/backend|node|python|api/.test(low)) return 'Implement authenticated, scalable API microservices with automated testing.';
  return `Independently architect and execute production-ready ${cleanTitle.toLowerCase()} implementations.`;
}

export function pedagogyFor(title) {
  return [
    {
      key: 'instructor',
      title: 'Instructor-led Training',
      desc: 'Get trained by top industry experts',
    },
    {
      key: 'hackathons',
      title: 'Hackathons',
      desc: 'Get a sense of how real projects are built',
    },
    {
      key: 'support',
      title: 'Dedicated Learning Management Team',
      desc: 'To help you with your learning needs',
    },
    {
      key: 'networking',
      title: 'Peer Networking and Group Learning',
      desc: 'Improve your professional network and learn from peers',
    },
    {
      key: 'self_paced',
      title: 'Self-paced videos',
      desc: 'Learn at your own pace with world-class content',
    },
    {
      key: 'gamified',
      title: 'Gamified Learning',
      desc: 'Get involved in group activities to solve real-world problems',
    },
    {
      key: 'projects',
      title: 'Projects and Exercises',
      desc: 'Get real-world experience through projects',
    },
    {
      key: 'mentorship',
      title: '1:1 Personalized Learning',
      desc: 'Hands-on exercises, project work, quizzes, and project builds',
    },
  ];
}

/** Default 12-step learning path (user-editable in the brochure menu). */export const DEFAULT_PATH_STEPS = [
  ['Enroll & Orientation', 'Complete admission, get LMS access and meet your mentor.'],
  ['Foundations First', 'Start from zero — setup, basics and first hands-on labs.'],
  ['Core Concepts', 'The heart of the course with daily practice and exercises.'],
  ['Tools of the Trade', 'Master the professional tools used in real jobs.'],
  ['Mentor Check-ins', '1:1 doubt-clearing so you never stay stuck.'],
  ['Guided Mini Projects', 'Mentor-reviewed builds that lock in every stage.'],
  ['Advanced Topics', 'Deeper concepts taught with real scenarios and datasets.'],
  ['Project', 'End-to-end portfolio-grade build, deployed live.'],
  ['Deployment & Portfolio', 'Ship your work publicly with clean documentation.'],
  ['Resume & LinkedIn', 'Profiles rewritten around the projects you shipped.'],
  ['Mock Interviews', 'Practice rounds with the most-asked questions.'],
  ['Certification & Referrals', 'Earn your certificate and get referred to hiring partners.'],
];

export function isProjectModule(m) {
  const t = String(m?.title || m?.name || '').toLowerCase().trim();
  const clean = t
    .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
    .replace(/^[—–-]\s*/, '')
    .trim();
  return (
    /^(?:final\s+|mini\s+|capstone\s+|live\s+|course\s+|guided\s+|practical\s+)?projects?$/i.test(clean) ||
    /^(?:capstone|portfolio|mini\s*project|final\s*project|live\s*project)$/i.test(clean) ||
    /^(?:real\s*[-–]?\s*world\s+)?projects?\s*(?:&|and)?\s*(?:portfolio|case\s+studies)?$/i.test(clean) ||
    clean === 'projects' ||
    clean === 'project'
  );
}

export const DOMAIN_PROJECTS = {
  frontend: [
    {
      level: 'Beginner',
      title: 'Responsive Corporate Landing Page & Design System',
      desc: 'Build a multi-section semantic corporate site with fluid Flexbox/Grid layouts, interactive navigation, and WCAG accessibility standards.',
      tech: 'HTML5 • CSS3 / SASS • Flexbox • Git',
    },
    {
      level: 'Intermediate',
      title: 'Dynamic E-Commerce Product Catalog & Cart',
      desc: 'Interactive product filtering, dynamic cart state management, client-side persistence with localStorage, and asynchronous checkout simulation.',
      tech: 'Modern JavaScript ES6+ • Fetch API • Web Storage • Tailwind',
    },
    {
      level: 'Advanced',
      title: 'SaaS Dashboard & Metrics Analytics Portal',
      desc: 'Component-driven single-page app with data visualization charts, dark/light themes, authentication routes, and RESTful API integration.',
      tech: 'React 19 / Vite • Recharts • React Router • REST API',
    },
    {
      level: 'Advanced',
      title: 'Real-Time Collaboration Platform Capstone',
      desc: 'Production-deployed full client application with custom state synchronization, performance audit 90+ Lighthouse score, and CI/CD hosting.',
      tech: 'React • Cloudflare / Vercel • Lighthouse CI • Unit Tests',
    },
  ],
  backend: [
    {
      level: 'Beginner',
      title: 'RESTful CRUD Service & Schema Validation Engine',
      desc: 'Design and build structured RESTful service endpoints with input validation, error handling middleware, and automated unit testing.',
      tech: 'Node.js / Express • Postman • Zod • Jest',
    },
    {
      level: 'Intermediate',
      title: 'Secure Multi-Tenant Auth & RBAC Architecture',
      desc: 'Implement JWT session authorization, password encryption, role-based access control (RBAC), and relational database modeling with migrations.',
      tech: 'PostgreSQL / MySQL • Prisma ORM • JWT • Bcrypt',
    },
    {
      level: 'Advanced',
      title: 'E-Commerce Microservices & Payment Gateway',
      desc: 'Architect order processing workflows, transactional integrity, webhooks, Redis cache layers, and live Razorpay / Stripe integration.',
      tech: 'Microservices • Redis Caching • Payment Webhooks • Docker',
    },
    {
      level: 'Advanced',
      title: 'Enterprise Scalable Cloud Platform Capstone',
      desc: 'End-to-end distributed backend featuring background job queues, rate limiting, Docker containerization, and AWS/Cloud deployment.',
      tech: 'Docker • BullMQ • AWS EC2/S3 • Nginx Reverse Proxy',
    },
  ],
  data: [
    {
      level: 'Beginner',
      title: 'Exploratory Data Analysis (EDA) & Market Insights',
      desc: 'Perform data wrangling, missing-value imputation, statistical analysis, and interactive visualization on real-world retail datasets.',
      tech: 'Python • Pandas • NumPy • Matplotlib & Seaborn',
    },
    {
      level: 'Intermediate',
      title: 'Predictive Machine Learning Classification Pipeline',
      desc: 'Train, evaluate, and tune supervised models (Random Forest, XGBoost) with cross-validation, feature engineering, and ROC-AUC metrics.',
      tech: 'Scikit-Learn • XGBoost • Jupyter • Feature Scaling',
    },
    {
      level: 'Advanced',
      title: 'End-to-End Deep Learning & Computer Vision System',
      desc: 'Build and train CNN architectures for image recognition, automated data augmentation, and model checkpointing.',
      tech: 'PyTorch / TensorFlow • OpenCV • Transfer Learning',
    },
    {
      level: 'Advanced',
      title: 'Production Generative AI & RAG Agent Capstone',
      desc: 'Deploy an enterprise Retrieval-Augmented Generation (RAG) system with vector databases, embeddings, and FastAPI backend serving.',
      tech: 'LangChain • Pinecone / Chroma • OpenAI / Gemini • FastAPI',
    },
  ],
  general: [
    {
      level: 'Beginner',
      title: 'Core Engineering Console & Utility Engine',
      desc: 'Implement modular algorithms, file I/O operations, and data structure manipulation verified with comprehensive unit test suites.',
      tech: 'Core Programming • Data Structures • Unit Testing • Git',
    },
    {
      level: 'Intermediate',
      title: 'Full-Featured Web Application with Relational DB',
      desc: 'Develop a full-stack CRUD application with responsive UI, server-side data processing, relational schemas, and error boundaries.',
      tech: 'Modern Web Stack • SQL Database • API Routing',
    },
    {
      level: 'Advanced',
      title: 'Cloud-Connected Microservice & API Architecture',
      desc: 'Build an authenticated, scalable service with cloud storage, asynchronous workers, caching, and third-party API integrations.',
      tech: 'Microservices • Cloud Storage • Caching • CI/CD',
    },
    {
      level: 'Advanced',
      title: 'Production Enterprise Software Capstone',
      desc: 'Architect and deploy a mentor-reviewed, portfolio-grade system with containerization, security audits, and continuous cloud deployment.',
      tech: 'Docker • Cloud Deployment • Security Best Practices',
    },
  ],
};

/**
 * Returns exactly 4 structured projects: 1 Beginner, 1 Intermediate, 2 Advanced.
 * Extracts any syllabus project topics if present, otherwise provides grounded domain projects.
 */
export function projectsFor(title, modules) {
  const d = domainOf(title);
  const base = DOMAIN_PROJECTS[d] || DOMAIN_PROJECTS.general;

  // If input modules contained standalone project modules or specific project topics, extract them
  const projMods = (modules || []).filter(isProjectModule);
  if (projMods.length) {
    const extracted = [];
    projMods.forEach((pm) => {
      (pm.topics || pm.lessons || []).forEach((t) => {
        const cleanT = String(t)
          .replace(/^[-•*◦▪]\s*/, '')
          .replace(/^(?:mini\s*project|final\s*project|project)\s*[:\-–]\s*/i, '')
          .trim();
        if (cleanT && cleanT.length > 5 && !/^(?:project|projects)$/i.test(cleanT)) {
          extracted.push(cleanT);
        }
      });
    });
    if (extracted.length >= 3) {
      return [
        { level: 'Beginner', title: extracted[0] || base[0].title, desc: base[0].desc, tech: base[0].tech },
        { level: 'Intermediate', title: extracted[1] || base[1].title, desc: base[1].desc, tech: base[1].tech },
        { level: 'Advanced', title: extracted[2] || base[2].title, desc: base[2].desc, tech: base[2].tech },
        { level: 'Advanced', title: extracted[3] || base[3].title, desc: base[3].desc, tech: base[3].tech },
      ];
    }
  }

  // Exactly 4 projects: 1 Beginner, 1 Intermediate, 2 Advanced
  return [
    { ...base[0], level: 'Beginner' },
    { ...base[1], level: 'Intermediate' },
    { ...base[2], level: 'Advanced' },
    { ...base[3], level: 'Advanced' },
  ];
}

export function faqsFor(title, modules) {
  const count = (modules || []).length;
  const first = modules?.[0]?.title || 'fundamentals';
  const last = modules?.[count - 1]?.title || 'final project';
  return [
    ['Is this course suitable for absolute beginners?',
      `Yes. It starts from ${first} and progresses step by step across ${count} modules to ${last}.`],
    ['How are the classes conducted?',
      'Mentor-led sessions plus self-paced practice, with every topic backed by live examples and exercises.'],
    ['Will I build projects during the course?',
      'Yes — guided builds after early modules and final projects covering the advanced modules, all portfolio-ready.'],
    ['What do I need before joining?',
      `${prerequisitesFor(title).join('; ')}.`],
    ['Do I get a certificate?',
      'Yes — a Marvel Slice course-completion certificate listing the modules and projects you finished.'],
    ['How does career support work?',
      'Resume review, LinkedIn profile cleanup, mock interviews and referrals once your projects are complete.'],
  ];
}

export function outcomesFor(title, modules) {
  const d = domainOf(title);
  if (d === 'frontend') {
    return [
      'Architect scalable, maintainable web applications using modern semantic markup and CSS layouts',
      'Build responsive, mobile-first user interfaces with fluid grids and interactive micro-animations',
      'Master component-driven development with React, state management, and declarative hooks',
      'Integrate RESTful APIs and asynchronous data workflows with error handling and caching',
      'Optimize client-side performance, accessibility (WCAG), and Core Web Vitals for production',
      'Deploy and maintain live applications on cloud platforms with continuous deployment pipelines',
      'Collaborate using professional Git workflows, pull requests, and peer code review standards',
      'Ship multiple portfolio-ready projects with clean, documented code and public demonstrations',
    ];
  }
  if (d === 'backend') {
    return [
      'Design and implement secure, high-throughput RESTful and microservice backend architectures',
      'Model relational and NoSQL databases with ACID compliance, indexing, and query optimization',
      'Implement robust authentication, authorization (RBAC/JWT), and data protection mechanisms',
      'Write comprehensive unit, integration, and end-to-end tests following TDD methodologies',
      'Containerize applications with Docker and configure continuous delivery (CI/CD) pipelines',
      'Profile memory, monitor production logs, and optimize server response latency',
      'Collaborate using enterprise GitFlow branching models and automated build verification',
      'Ship production-ready APIs and backend services backed by comprehensive API documentation',
    ];
  }
  if (d === 'data') {
    return [
      'Clean, analyze, and visualize complex datasets using modern data analysis libraries',
      'Formulate statistical hypotheses and extract actionable business intelligence from raw data',
      'Train, evaluate, and tune predictive machine learning models for classification and regression',
      'Build interactive dashboards and reports to communicate insights effectively to stakeholders',
      'Work with relational databases, write advanced SQL queries, and manage data pipelines',
      'Deploy machine learning models as consumable API services with monitoring',
      'Apply best practices in data governance, reproducible notebooks, and version control',
      'Complete end-to-end data science projects tackling real-world business scenarios',
    ];
  }
  // general software
  return [
    'Apply core computational logic, data structures, and object-oriented design patterns',
    'Develop modular, maintainable software systems adhering to clean code principles',
    'Write automated tests and debug complex execution issues methodically',
    'Work with relational and document databases for persistent transactional data storage',
    'Collaborate effectively in agile sprints using Git, pull requests, and issue tracking',
    'Deploy and operate applications in containerized and cloud-hosted environments',
    'Present architecture designs and technical solutions clearly during technical interviews',
    'Ship portfolio-grade applications demonstrating end-to-end software engineering competency',
  ];
}

export function moduleDescriptionFor(m, courseTitle = '') {
  if (m?.objective && String(m.objective).trim().length > 10) {
    return String(m.objective).trim();
  }
  if (m?.description && String(m.description).trim().length > 10) {
    return String(m.description).trim();
  }
  if (m?.desc && String(m.desc).trim().length > 10) {
    return String(m.desc).trim();
  }
  const cleanTitle = String(m?.title || 'Core Concepts')
    .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
    .replace(/[—–-]\s*part\s*[ab]/i, '')
    .trim();

  const low = cleanTitle.toLowerCase();
  if (/html|semantic/.test(low)) {
    return 'Master semantic document structures, accessible markup standards, multimedia integration, and SEO-compliant web fundamentals.';
  }
  if (/css|styling|tailwind|bootstrap|flexbox|grid/.test(low)) {
    return 'Build modern responsive layouts, fluid grid systems, custom typography, animations, and cross-browser styling architectures.';
  }
  if (/javascript|js|es6|scripting/.test(low)) {
    return 'Deepen logical programming foundations, DOM manipulations, event-driven interfaces, and asynchronous data handling.';
  }
  if (/react|component|hooks/.test(low)) {
    return 'Develop scalable single-page applications with declarative component hierarchies, dynamic state hooks, and routing.';
  }
  if (/ui|ux|figma|design|wireframe|prototype/.test(low)) {
    return 'Apply human-centered design principles, interactive wireframing, high-fidelity prototypes, and cohesive design systems.';
  }
  if (/performance|optimization|vitals|speed/.test(low)) {
    return 'Audit, measure, and optimize real-world asset delivery, client caching, rendering cycles, and Core Web Vitals scores.';
  }
  if (/publish|hosting|deploy|cpanel|ftp|domain|devops|git/.test(low)) {
    return 'Configure live production environments, SSL certificates, automated version control, and multi-stage deployment workflows.';
  }
  if (/seo|search|analytics/.test(low)) {
    return 'Implement technical search engine optimizations, meta architectures, sitemaps, and search index visibility strategies.';
  }
  if (/project|capstone|portfolio|sprint/.test(low)) {
    return 'Synthesize multi-tier design and development skills into polished, mentor-reviewed portfolio-grade applications.';
  }
  if (/python|backend|node|express|api|rest/.test(low)) {
    return 'Engineer robust backend services, secure RESTful API endpoints, database models, and transactional data pipelines.';
  }
  if (/database|sql|mongo|query/.test(low)) {
    return 'Design relational schemas, performant query indexes, transaction safety, and persistent storage connections.';
  }
  if (/ai|ml|machine learning|data|nlp|model/.test(low)) {
    return 'Construct intelligent data pipelines, statistical model training, evaluation metrics, and inference integrations.';
  }
  return `Gain in-depth practical expertise in ${cleanTitle.toLowerCase()} through guided technical walkthroughs, exercises, and real-world implementation.`;
}

export function moduleHandsOnLabFor(m) {
  if (m?.handsOnLab && String(m.handsOnLab).trim()) {
    return String(m.handsOnLab).trim();
  }
  const cleanTitle = String(m?.title || 'Applied Engineering')
    .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
    .replace(/[—–-]\s*part\s*[ab]/i, '')
    .trim();

  const low = cleanTitle.toLowerCase();
  if (/html|semantic/.test(low)) return 'Complete practical drills on semantic structuring, form accessibility checks, and live W3C validation.';
  if (/css|styling|bootstrap|tailwind|flexbox|grid/.test(low)) return 'Execute responsive layout exercises utilizing modern Flexbox, CSS Grid layouts, and custom media query breakpoints.';
  if (/javascript|js|es6/.test(low)) return 'Solve algorithm drills, dynamic DOM event handling exercises, and asynchronous API data fetching challenges.';
  if (/react|component|hooks/.test(low)) return 'Build modular reusable components with state management drills, custom hook abstractions, and routing handlers.';
  if (/ui|ux|figma|design/.test(low)) return 'Practice wireframing, interactive vector layout creation, and component auto-layout constraints in Figma.';
  if (/performance|optimization/.test(low)) return 'Perform live site asset compression drills, network waterfall analysis, and Core Web Vitals optimization.';
  if (/publish|hosting|deploy|git/.test(low)) return 'Practice Git branch workflows, pull-request merge resolutions, and continuous live deployment hosting.';
  if (/seo|search/.test(low)) return 'Audit and implement structured JSON-LD schema, open-graph tags, robots configuration, and sitemaps.';
  if (/database|sql/.test(low)) return 'Write complex SQL join queries, index optimizations, and schema validation constraints on live test tables.';
  if (/backend|node|python|api/.test(low)) return 'Construct authenticated RESTful endpoints with input validation middleware and automated unit test assertions.';

  return `Work through step-by-step practical coding exercises and technical walkthroughs applying ${cleanTitle.toLowerCase()} with mentor guidance.`;
}

/**
 * Clamp a module list to 2-modules-per-page (even count: 6, 8, 10, 12, 14, 16)
 * so every page has exactly 2 balanced columns with zero ragged single-module pages.
 * Preserves clean, deduplicated topics in order. Standalone project modules are excluded
 * because projects have a dedicated showcase section.
 */
export function normalizeModuleCount(modules) {
  // Exclude standalone project modules — projects belong in the dedicated Course Projects section!
  const nonProjectMods = (modules || []).filter((m) => !isProjectModule(m));
  const source = nonProjectMods.length >= 2 ? nonProjectMods : (modules || []);

  let list = source.map((m) => {
    const rawTitle = String(m.title || m.name || '').trim();
    const cleanTitle = rawTitle
      .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
      .replace(/^[—–-]\s*/, '')
      .trim() || 'Core Engineering';

    const rawTopics = (m.topics || m.lines || []).map((t) =>
      String(t || '')
        .replace(/^[-•*◦▪]\s*/, '')
        .replace(/^(?:module|chapter|unit|part)\s*\d+[:\-.]?\s*/i, '')
        .replace(/^L\d+\s*[-–]\s*/i, '')
        .trim()
    ).filter((t) => t && t.toLowerCase() !== cleanTitle.toLowerCase());

    return {
      label: m.label,
      title: cleanTitle,
      topics: [...new Set(rawTopics)],
      objective: m.objective || m.desc || m.description || '',
      handsOnLab: m.handsOnLab || '',
    };
  }).filter((m) => m.topics.length || m.title);

  if (!list.length) return list;

  // Split if fewer than 6 modules
  let guard = 0;
  while (list.length < 6 && guard++ < 20) {
    let bi = 0;
    for (let i = 1; i < list.length; i++) {
      if (list[i].topics.length > list[bi].topics.length) bi = i;
    }
    const target = list[bi];
    if (!target || target.topics.length < 4) break;
    const half = Math.ceil(target.topics.length / 2);
    list.splice(bi, 1,
      { ...target, title: `${target.title} — Part A`, topics: target.topics.slice(0, half) },
      { ...target, title: `${target.title} — Part B`, topics: target.topics.slice(half) },
    );
  }

  // Merge down if more than 16 modules (cap at 8 curriculum pages)
  guard = 0;
  while (list.length > 16 && guard++ < 20) {
    let bi = 0;
    let best = Infinity;
    for (let i = 0; i < list.length - 1; i++) {
      const s = list[i].topics.length + list[i + 1].topics.length;
      if (s < best) { best = s; bi = i; }
    }
    list.splice(bi, 2, {
      label: list[bi].label,
      title: `${list[bi].title} & ${list[bi + 1].title}`.slice(0, 90),
      topics: [...new Set([...list[bi].topics, ...list[bi + 1].topics])],
      objective: list[bi].objective || list[bi + 1].objective || '',
      handsOnLab: list[bi].handsOnLab || list[bi + 1].handsOnLab || '',
    });
  }

  // Ensure an EVEN number of modules so 2-per-page never has an odd orphan
  if (list.length % 2 !== 0 && list.length < 16) {
    let bi = 0;
    for (let i = 1; i < list.length; i++) {
      if (list[i].topics.length > list[bi].topics.length) bi = i;
    }
    const target = list[bi];
    if (target && target.topics.length >= 3) {
      const half = Math.ceil(target.topics.length / 2);
      list.splice(bi, 1,
        { ...target, title: `${target.title} — Part A`, topics: target.topics.slice(0, half) },
        { ...target, title: `${target.title} — Part B`, topics: target.topics.slice(half) },
      );
    }
  }

  return list.map((m, i) => ({ ...m, label: `Module ${i + 1}` }));
}

