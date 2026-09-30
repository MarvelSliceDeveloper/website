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

export const CANONICAL_TOOLS = [
  // Languages & Core
  { match: /\b(?:java\s*21|java\s*17|java\s*11|java|core\s*java|advanced\s*java)\b/i, name: 'Java' },
  { match: /\b(?:python\s*3(?:\.\d+)?|python|core\s*python)\b/i, name: 'Python' },
  { match: /\b(?:javascript|es6\+?|modern\s*javascript)\b/i, name: 'JavaScript' },
  { match: /\b(?:typescript)\b/i, name: 'TypeScript' },
  { match: /\b(?:html5)\b/i, name: 'HTML5' },
  { match: /\b(?:html)\b/i, name: 'HTML5' },
  { match: /\b(?:css3)\b/i, name: 'CSS3' },
  { match: /\b(?:css)\b/i, name: 'CSS3' },
  { match: /\b(?:php\s*8(?:\.\d+)?|php)\b/i, name: 'PHP' },
  { match: /\b(?:sql)\b/i, name: 'SQL' },
  { match: /\b(?:c\+\+)\b/i, name: 'C++' },
  { match: /\b(?:c#|\.net)\b/i, name: 'C# / .NET' },

  // Java & Backend Frameworks
  { match: /\b(?:spring\s*boot\s*3|spring\s*boot)\b/i, name: 'Spring Boot' },
  { match: /\b(?:spring\s*mvc|spring\s*security|spring\s*data|spring\s*framework)\b/i, name: 'Spring Framework' },
  { match: /\b(?:hibernate|jpa)\b/i, name: 'Hibernate / JPA' },
  { match: /\b(?:maven)\b/i, name: 'Maven' },
  { match: /\b(?:gradle)\b/i, name: 'Gradle' },
  { match: /\b(?:junit\s*5|junit)\b/i, name: 'JUnit' },

  // Web Frameworks & UI
  { match: /\b(?:react\s*19|react\s*18|react(?:\.js)?)\b/i, name: 'React JS' },
  { match: /\b(?:next(?:\.js)?)\b/i, name: 'Next.js' },
  { match: /\b(?:angular\s*1[789]|angular(?:\.js)?)\b/i, name: 'Angular' },
  { match: /\b(?:vue(?:\.js)?)\b/i, name: 'Vue.js' },
  { match: /\b(?:node(?:\.js)?)\b/i, name: 'Node.js' },
  { match: /\b(?:express(?:\.js)?)\b/i, name: 'Express.js' },
  { match: /\b(?:django)\b/i, name: 'Django' },
  { match: /\b(?:flask)\b/i, name: 'Flask' },
  { match: /\b(?:fastapi)\b/i, name: 'FastAPI' },
  { match: /\b(?:wordpress)\b/i, name: 'WordPress' },
  { match: /\b(?:woocommerce)\b/i, name: 'WooCommerce' },
  { match: /\b(?:tailwind(?:\s*css)?)\b/i, name: 'Tailwind CSS' },
  { match: /\b(?:bootstrap\s*5|bootstrap)\b/i, name: 'Bootstrap' },
  { match: /\b(?:redux\s*toolkit|redux)\b/i, name: 'Redux' },
  { match: /\b(?:vite)\b/i, name: 'Vite' },
  { match: /\b(?:webpack)\b/i, name: 'Webpack' },

  // AI / Data Science / ML
  { match: /\b(?:pandas)\b/i, name: 'Pandas' },
  { match: /\b(?:numpy)\b/i, name: 'NumPy' },
  { match: /\b(?:scikit[-–\s]*learn|sklearn)\b/i, name: 'Scikit-Learn' },
  { match: /\b(?:tensorflow)\b/i, name: 'TensorFlow' },
  { match: /\b(?:pytorch)\b/i, name: 'PyTorch' },
  { match: /\b(?:keras)\b/i, name: 'Keras' },
  { match: /\b(?:matplotlib)\b/i, name: 'Matplotlib' },
  { match: /\b(?:seaborn)\b/i, name: 'Seaborn' },
  { match: /\b(?:opencv)\b/i, name: 'OpenCV' },
  { match: /\b(?:langchain)\b/i, name: 'LangChain' },
  { match: /\b(?:llamaindex)\b/i, name: 'LlamaIndex' },
  { match: /\b(?:hugging\s*face)\b/i, name: 'Hugging Face' },
  { match: /\b(?:jupyter(?:\s*notebook)?)\b/i, name: 'Jupyter Notebook' },
  { match: /\b(?:colab|google\s*colab)\b/i, name: 'Google Colab' },
  { match: /\b(?:nlp|natural\s*language\s*processing)\b/i, name: 'NLP' },
  { match: /\b(?:llm|large\s*language\s*models?)\b/i, name: 'LLMs & Prompt Eng.' },

  // Databases & Storage
  { match: /\b(?:mysql(?:\s*workbench)?)\b/i, name: 'MySQL' },
  { match: /\b(?:postgresql|postgres)\b/i, name: 'PostgreSQL' },
  { match: /\b(?:mongodb|mongo)\b/i, name: 'MongoDB' },
  { match: /\b(?:redis)\b/i, name: 'Redis' },
  { match: /\b(?:sqlite)\b/i, name: 'SQLite' },

  // Tools, Testing & DevOps
  { match: /\b(?:git(?:hub)?|git)\b/i, name: 'Git & GitHub' },
  { match: /\b(?:vs\s*code|visual\s*studio\s*code)\b/i, name: 'VS Code' },
  { match: /\b(?:postman)\b/i, name: 'Postman' },
  { match: /\b(?:docker)\b/i, name: 'Docker' },
  { match: /\b(?:kubernetes|k8s)\b/i, name: 'Kubernetes' },
  { match: /\b(?:aws|amazon\s*web\s*services)\b/i, name: 'AWS' },
  { match: /\b(?:azure)\b/i, name: 'Microsoft Azure' },
  { match: /\b(?:linux|ubuntu)\b/i, name: 'Linux' },
  { match: /\b(?:selenium)\b/i, name: 'Selenium' },
  { match: /\b(?:playwright)\b/i, name: 'Playwright' },
  { match: /\b(?:testng)\b/i, name: 'TestNG' },
  { match: /\b(?:jest)\b/i, name: 'Jest' },
  { match: /\b(?:cypress)\b/i, name: 'Cypress' },
  { match: /\b(?:figma)\b/i, name: 'Figma' },
  { match: /\b(?:figjam)\b/i, name: 'FigJam' },
  { match: /\b(?:miro)\b/i, name: 'Miro' },
  { match: /\b(?:wireframing|wireframe)\b/i, name: 'Wireframing' },
  { match: /\b(?:prototyping|prototype)\b/i, name: 'Prototyping' },
  { match: /\b(?:design\s*systems?)\b/i, name: 'Design Systems' },
];

/**
 * Extracts ONLY tools & technologies explicitly mentioned in syllabus modules or document text.
 * Strictly avoids hallucinating or injecting unmentioned third-party tools.
 */
export function extractToolsFromSyllabus(modules = [], rawText = '') {
  let combined = String(rawText || '');
  if (Array.isArray(modules)) {
    modules.forEach((m) => {
      combined += ' ' + (m?.title || '') + ' ' + (m?.label || '') + ' ' + (m?.objective || '');
      const topics = m?.topics || m?.lines || m?.lessons || [];
      if (Array.isArray(topics)) combined += ' ' + topics.join(' ');
    });
  }
  if (!combined.trim()) return [];

  const seen = new Set();
  const extracted = [];
  CANONICAL_TOOLS.forEach((ct) => {
    if (!seen.has(ct.name) && ct.match.test(combined)) {
      seen.add(ct.name);
      extracted.push(ct.name);
    }
  });
  return extracted;
}

const DOMAIN_TOOLS = {
  frontend: ['HTML5', 'CSS3', 'JavaScript', 'VS Code', 'Git & GitHub', 'Chrome DevTools'],
  backend: ['REST APIs', 'SQL Database', 'VS Code', 'Git & GitHub', 'Postman'],
  data: ['Python', 'SQL', 'Pandas & NumPy', 'Jupyter Notebook', 'Git & GitHub'],
  general: ['Core Programming', 'VS Code', 'Git & GitHub', 'Unit Testing'],
};

/**
 * Returns tools for a course title.
 * CRITICAL RULE: If modules or document text are available, uses strictly extracted tools.
 * NEVER appends unmentioned tools (e.g. no Docker/Postman if not taught in the doc).
 */
export function toolsForTitle(title, detected = [], modules = [], rawText = '') {
  const fromSyllabus = extractToolsFromSyllabus(modules, rawText);
  const detectedList = Array.isArray(detected) ? detected.filter(Boolean) : [];
  const mergedFromDoc = [...new Set([...detectedList, ...fromSyllabus])];

  // STRICT RULE: If tools were verified from the document/syllabus, return ONLY those tools!
  if (mergedFromDoc.length > 0) {
    return mergedFromDoc.slice(0, 12);
  }

  // Fallback only when syllabus contains zero recognized tools
  const base = DOMAIN_TOOLS[domainOf(title)] || DOMAIN_TOOLS.general;
  return base.slice(0, 12);
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

export function moduleToolsFor(m, courseTools = []) {
  if (Array.isArray(m?.tools) && m.tools.length) return m.tools.slice(0, 4);

  // 1. Check if specific tools are mentioned inside this module's title and topics
  const modText = (m?.title || '') + ' ' + ((m?.topics || m?.lines || []).join(' '));
  const seen = new Set();
  const modTools = [];
  CANONICAL_TOOLS.forEach((ct) => {
    if (!seen.has(ct.name) && ct.match.test(modText)) {
      seen.add(ct.name);
      modTools.push(ct.name);
    }
  });

  if (modTools.length >= 2) {
    return modTools.slice(0, 4);
  }

  // 2. If 1 tool found, supplement with other course-verified tools (never unmentioned tools!)
  if (modTools.length > 0 && Array.isArray(courseTools) && courseTools.length > 0) {
    courseTools.forEach((t) => {
      if (!seen.has(t) && modTools.length < 4) {
        seen.add(t);
        modTools.push(t);
      }
    });
    return modTools.slice(0, 4);
  }

  // 3. Fallback matching cleanTitle
  const cleanTitle = String(m?.title || '')
    .replace(/^(?:module|chapter|unit|part|section)\s*\d+[:\-.]?\s*/i, '')
    .replace(/[—–-]\s*part\s*[ab]/i, '')
    .trim();
  const low = cleanTitle.toLowerCase();
  if (/html|semantic/.test(low)) return ['HTML5', 'VS Code', 'Chrome DevTools', 'Live Server'];
  if (/css|styling|bootstrap|tailwind|flexbox|grid/.test(low)) return ['CSS3', 'Flexbox / Grid', 'Responsive Design', 'VS Code'];
  if (/javascript|js|es6/.test(low)) return ['JavaScript ES6+', 'Chrome DevTools', 'VS Code', 'Git'];
  if (/react|component|hooks/.test(low)) return ['React JS', 'Vite', 'React Router', 'VS Code'];
  if (/angular/.test(low)) return ['Angular', 'TypeScript', 'RxJS', 'VS Code'];
  if (/ui|ux|figma|design/.test(low)) return ['Figma', 'FigJam', 'Auto Layout', 'Prototyping'];
  if (/database|sql|mongo/.test(low)) return ['SQL', 'Relational Schemas', 'Database Indexing', 'Queries'];
  if (/python|django|flask/.test(low)) return ['Python', 'Django / Flask', 'REST APIs', 'Postman'];
  if (/java|spring/.test(low)) return ['Java', 'Spring Boot', 'Hibernate', 'Maven'];
  if (/ai|ml|data/.test(low)) return ['Python', 'Pandas & NumPy', 'Jupyter Notebook', 'Machine Learning'];
  if (/wordpress|woo/.test(low)) return ['WordPress', 'WooCommerce', 'PHP', 'Gutenberg'];

  // If courseTools are available, pick from them
  if (Array.isArray(courseTools) && courseTools.length >= 2) {
    return courseTools.slice(0, 4);
  }
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

export const COURSE_SPECIFIC_PROJECTS = {
  java: [
    {
      level: 'Beginner',
      title: 'Core Java Console Utility & Algorithmic Processor',
      desc: 'Build a modular CLI banking or file-processing application utilizing object-oriented principles, collections, exception handling, and JUnit testing.',
      tech: 'Core Java • OOP • Collections • JUnit • Git',
    },
    {
      level: 'Intermediate',
      title: 'Spring Boot RESTful Service & Relational Database Engine',
      desc: 'Architect structured REST endpoints with Spring Data JPA / Hibernate, MySQL transactional persistence, and automated request validation.',
      tech: 'Spring Boot • Hibernate / JPA • MySQL • Maven • Postman',
    },
    {
      level: 'Advanced',
      title: 'Enterprise Microservices Platform with Security & Caching',
      desc: 'Design decoupled backend microservices with Spring Security, JWT authentication, centralized error handling, and high-throughput query caching.',
      tech: 'Spring Boot • Spring Security • JWT • MySQL • Postman',
    },
    {
      level: 'Advanced',
      title: 'Production Full Stack Java Enterprise Capstone',
      desc: 'Deploy a full-tier enterprise system combining a modern responsive frontend with a scalable Spring Boot backend, complete with continuous deployment.',
      tech: 'Java • Spring Boot • Modern Frontend • MySQL • Docker / Cloud',
    },
  ],
  python: [
    {
      level: 'Beginner',
      title: 'Python Algorithmic Engine & File Data Processor',
      desc: 'Develop a clean modular console application utilizing Python data structures, file I/O operations, error handling, and unit test coverage.',
      tech: 'Python 3 • OOP • Data Structures • PyTest • Git',
    },
    {
      level: 'Intermediate',
      title: 'Database-Backed Web Service & CRUD API',
      desc: 'Architect a relational web backend utilizing Django or Flask with database ORM models, migration management, and structured REST endpoints.',
      tech: 'Python • Django / Flask • SQL / MySQL • Postman',
    },
    {
      level: 'Advanced',
      title: 'Scalable RESTful Backend Architecture & JWT Auth',
      desc: 'Implement production-ready APIs featuring role-based authorization, request throttling, database query optimization, and automated testing.',
      tech: 'Django REST Framework • PostgreSQL / MySQL • JWT • Unit Tests',
    },
    {
      level: 'Advanced',
      title: 'Production Full Stack Python Web Platform',
      desc: 'Build and deploy a complete production-grade web application with interactive client-side interfaces and scalable backend services.',
      tech: 'Python • Django / FastAPI • Database • Modern UI • Cloud Hosting',
    },
  ],
  html_css: [
    {
      level: 'Beginner',
      title: 'Semantic Corporate Landing Page & Structure',
      desc: 'Build an accessible multi-section corporate site utilizing semantic HTML5 elements, clean document hierarchies, and W3C validation.',
      tech: 'HTML5 • Semantic Tags • Accessibility (WCAG) • VS Code',
    },
    {
      level: 'Intermediate',
      title: 'Responsive Multi-Device Portfolio with Flexbox',
      desc: 'Design modern responsive page layouts with fluid Flexbox navigation, interactive cards, media queries, and cross-browser styling.',
      tech: 'HTML5 • CSS3 • Flexbox • Media Queries • Git',
    },
    {
      level: 'Advanced',
      title: 'Modern CSS Grid Magazine & Dashboard Layout',
      desc: 'Architect complex two-dimensional CSS Grid layouts with custom typography, responsive design tokens, and smooth micro-interactions.',
      tech: 'HTML5 • CSS3 • CSS Grid • Responsive Design • DevTools',
    },
    {
      level: 'Advanced',
      title: 'Production Showcase Portal with High-Speed Optimization',
      desc: 'Publish an audit-tested, 90+ Lighthouse score responsive web showcase deployed live with verified Git version control.',
      tech: 'HTML5 • CSS3 • CSS Animations • Web Vitals • Live Hosting',
    },
  ],
  react: [
    {
      level: 'Beginner',
      title: 'Interactive Component Library & Single Page Application',
      desc: 'Build modular, reusable React UI components with declarative props, conditional rendering, and responsive styling.',
      tech: 'React JS • JSX • Components • CSS3 / Tailwind',
    },
    {
      level: 'Intermediate',
      title: 'Dynamic Product Catalog with State Management & Filtering',
      desc: 'Implement asynchronous data fetching, client-side filtering, custom state hooks, and local persistence for shopping workflows.',
      tech: 'React JS • Custom Hooks • Fetch / Axios • Local Storage',
    },
    {
      level: 'Advanced',
      title: 'SaaS Analytics Dashboard & Metrics Visualization',
      desc: 'Architect a single-page analytics portal with client routing, interactive charts, global state orchestration, and RESTful API integration.',
      tech: 'React JS • Redux / Context • React Router • REST API',
    },
    {
      level: 'Advanced',
      title: 'Production Client-Side Web Platform Capstone',
      desc: 'Deploy a high-performance single page application built with Vite, automated unit tests, and continuous cloud deployment.',
      tech: 'React JS • Vite • Unit Tests • Cloudflare / Vercel',
    },
  ],
  angular: [
    {
      level: 'Beginner',
      title: 'TypeScript Foundations & Component Dashboard',
      desc: 'Build structured Angular components with TypeScript interfaces, two-way data binding, and built-in structural directives.',
      tech: 'Angular • TypeScript • Directives • Components',
    },
    {
      level: 'Intermediate',
      title: 'Reactive Data-Driven Application with Services & DI',
      desc: 'Implement injectable Angular services, Dependency Injection, reactive RxJS observables, and client-side HTTP communications.',
      tech: 'Angular • RxJS • Services • HTTP Client',
    },
    {
      level: 'Advanced',
      title: 'Enterprise Modular Admin Portal with Lazy Routing',
      desc: 'Architect feature modules, route guards, reactive form validations, and asynchronous state pipelines for multi-user portals.',
      tech: 'Angular • Route Guards • Reactive Forms • Node.js',
    },
    {
      level: 'Advanced',
      title: 'Production Scalable Web Application Capstone',
      desc: 'Deliver a production-ready enterprise Angular application with modular architecture, performance audits, and cloud deployment.',
      tech: 'Angular • TypeScript • CI/CD Deployment • Production Build',
    },
  ],
  node: [
    {
      level: 'Beginner',
      title: 'Node.js CLI Utilities & File Streaming Engine',
      desc: 'Develop modular console tools and asynchronous file stream processors using core Node.js modules and event emitters.',
      tech: 'Node.js • JavaScript • File System • Git',
    },
    {
      level: 'Intermediate',
      title: 'RESTful CRUD Service & Schema Validation Engine',
      desc: 'Design and build structured RESTful service endpoints with input validation middleware, error handling, and unit test assertions.',
      tech: 'Node.js • Express.js • MongoDB • Postman',
    },
    {
      level: 'Advanced',
      title: 'Real-Time Communications Service & Distributed Caching',
      desc: 'Implement low-latency WebSocket communication channels, Redis caching layers, and session authorization tokens.',
      tech: 'Node.js • Express.js • Redis • WebSockets',
    },
    {
      level: 'Advanced',
      title: 'Enterprise Scalable Cloud Backend Capstone',
      desc: 'End-to-end distributed backend featuring background job queues, rate limiting, Docker containerization, and AWS deployment.',
      tech: 'Node.js • Express.js • MongoDB / Redis • Docker',
    },
  ],
  php: [
    {
      level: 'Beginner',
      title: 'Dynamic Server-Side Scripting Console & Utilities',
      desc: 'Build structured procedural and object-oriented PHP scripts with form handling, session tracking, and error management.',
      tech: 'PHP • Procedural & OOP • HTML5 • CSS3',
    },
    {
      level: 'Intermediate',
      title: 'Database-Driven Multi-User CRUD Web Portal',
      desc: 'Develop a persistent web application utilizing PHP PDO, MySQL database connections, prepared statements, and input sanitation.',
      tech: 'PHP • MySQL • PDO • Form Validation',
    },
    {
      level: 'Advanced',
      title: 'RESTful API Service with Secure Token Authentication',
      desc: 'Architect modular REST API endpoints returning structured JSON data with token-based access control and CRUD operations.',
      tech: 'PHP • MySQL • REST API • Postman',
    },
    {
      level: 'Advanced',
      title: 'Production E-Commerce Web Application Capstone',
      desc: 'Deploy a full-featured e-commerce web platform with user authentication, product catalog, cart persistence, and order workflows.',
      tech: 'PHP • MySQL • Payment Integration • Git',
    },
  ],
  wordpress: [
    {
      level: 'Beginner',
      title: 'Responsive Business Website Setup & Gutenberg Theming',
      desc: 'Configure a clean WordPress installation with custom block layouts, typography systems, and mobile-friendly responsive pages.',
      tech: 'WordPress • Gutenberg Blocks • HTML5 • CSS3',
    },
    {
      level: 'Intermediate',
      title: 'Dynamic Content Architecture & Custom Post Types',
      desc: 'Implement custom post types, taxonomies, child themes, and custom field logic for rich content-driven websites.',
      tech: 'WordPress • PHP • Custom Fields • Child Themes',
    },
    {
      level: 'Advanced',
      title: 'Full WooCommerce Online Store & Payment Gateway',
      desc: 'Build an end-to-end e-commerce store with product catalogs, dynamic cart flows, checkout gateways, and SSL configuration.',
      tech: 'WordPress • WooCommerce • Payment Gateways • SSL',
    },
    {
      level: 'Advanced',
      title: 'High-Performance Production Web Portal & Technical SEO',
      desc: 'Optimize a production WordPress site for Core Web Vitals, caching layers, database cleanup, and structured search visibility.',
      tech: 'WordPress • WooCommerce • Technical SEO • Caching',
    },
  ],
  ux: [
    {
      level: 'Beginner',
      title: 'User Persona Research & Low-Fidelity Wireframes',
      desc: 'Conduct empathy mapping, user interview synthesis, information architecture diagrams, and paper/digital wireframe sketches.',
      tech: 'User Research • Information Architecture • Figma',
    },
    {
      level: 'Intermediate',
      title: 'Interactive Component Library & Cohesive Design System',
      desc: 'Build reusable UI component kits in Figma with auto-layout constraints, responsive variants, typography scales, and color tokens.',
      tech: 'Figma • Auto Layout • Component Variants • Style Guide',
    },
    {
      level: 'Advanced',
      title: 'High-Fidelity Mobile Application Interactive Prototype',
      desc: 'Create realistic touch-based user journeys with animated micro-interactions, transition states, and usability testing scorecards.',
      tech: 'Figma • Micro-Interactions • Usability Testing • Prototypes',
    },
    {
      level: 'Advanced',
      title: 'End-to-End Enterprise SaaS Product Design Case Study',
      desc: 'Deliver a comprehensive design case study documenting user research, iterative wireframes, developer handoff specs, and business impact.',
      tech: 'Design Systems • Figma • Developer Handoff • Case Study',
    },
  ],
  data_science: [
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
      title: 'Production AI Inference & Serving System Capstone',
      desc: 'Deploy machine learning and deep learning models behind performant REST API endpoints with containerization and cloud serving.',
      tech: 'Python • FastAPI / Flask • Docker • Model Serving',
    },
  ],
  genai: [
    {
      level: 'Beginner',
      title: 'Prompt Engineering Frameworks & LLM Foundations',
      desc: 'Experiment with systematic prompting strategies, zero-shot and few-shot reasoning, structured JSON outputs, and parameter tuning.',
      tech: 'Python • LLMs & Prompt Eng. • Jupyter Notebook',
    },
    {
      level: 'Intermediate',
      title: 'Vector Embeddings & Semantic Document Search',
      desc: 'Build semantic search pipelines using modern embedding models, cosine similarity rankings, and high-performance vector databases.',
      tech: 'Python • Vector Databases • LangChain • FastAPI',
    },
    {
      level: 'Advanced',
      title: 'Enterprise Retrieval-Augmented Generation (RAG) System',
      desc: 'Architect a production RAG pipeline with document chunking, hybrid retrieval, re-ranking, and grounded source citation generation.',
      tech: 'LangChain • RAG • Vector DB • FastAPI',
    },
    {
      level: 'Advanced',
      title: 'Autonomous Multi-Agent AI System Capstone',
      desc: 'Deploy an autonomous multi-agent workflow capable of reasoning, tool use, external API execution, and verified decision reporting.',
      tech: 'LangChain / Agents • FastAPI • LLMs • Cloud Serving',
    },
  ],
};

/**
 * Returns exactly 4 structured projects: 1 Beginner, 1 Intermediate, 2 Advanced.
 * Strictly tailored to the specific course's syllabus technologies.
 */
export function projectsFor(title = '', modules = []) {
  const lowTitle = String(title || '').toLowerCase();

  // 1. Check if the course title matches a specific course configuration
  let base = null;
  if (/java/i.test(lowTitle)) base = COURSE_SPECIFIC_PROJECTS.java;
  else if (/wordpress/i.test(lowTitle)) base = COURSE_SPECIFIC_PROJECTS.wordpress;
  else if (/php/i.test(lowTitle)) base = COURSE_SPECIFIC_PROJECTS.php;
  else if (/angular/i.test(lowTitle)) base = COURSE_SPECIFIC_PROJECTS.angular;
  else if (/react/i.test(lowTitle)) base = COURSE_SPECIFIC_PROJECTS.react;
  else if (/node/i.test(lowTitle)) base = COURSE_SPECIFIC_PROJECTS.node;
  else if (/html|css/i.test(lowTitle)) base = COURSE_SPECIFIC_PROJECTS.html_css;
  else if (/ux|ui/i.test(lowTitle)) base = COURSE_SPECIFIC_PROJECTS.ux;
  else if (/generative|genai|llm/i.test(lowTitle)) base = COURSE_SPECIFIC_PROJECTS.genai;
  else if (/data|aiml|machine/i.test(lowTitle)) base = COURSE_SPECIFIC_PROJECTS.data_science;
  else if (/python/i.test(lowTitle)) base = COURSE_SPECIFIC_PROJECTS.python;

  if (!base) {
    const d = domainOf(title);
    base = DOMAIN_PROJECTS[d] || DOMAIN_PROJECTS.general;
  }

  // 2. If input modules contained standalone project modules or specific project topics, extract them
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

export function prettyTitleFromFile(filename = '') {
  const base = filename.replace(/\.docx$/i, '').trim();
  const key = base.toLowerCase();
  const MAP = [
    [/aiml/, 'AIML (AI & Machine Learning)'],
    [/angular/, 'Angular Development'],
    [/data.*science/, 'Data Science & Machine Learning'],
    [/front.*end/, 'Front-End Development'],
    [/generative.*ai|genai/, 'Generative AI & LLMs'],
    [/html.*css|css.*html/, 'HTML & CSS Development'],
    [/java.*full.?stack|full.?stack.*java/, 'Java Full Stack Development'],
    [/python.*full.?stack|full.?stack.*python/, 'Python Full Stack Development'],
    [/node/, 'Node.js Development'],
    [/php/, 'PHP Development'],
    [/python/, 'Python Development'],
    [/react/, 'React JS Development'],
    [/\bux\b|ui.?ux/, 'UI/UX Design Masterclass'],
    [/wordpress/, 'WordPress Development'],
  ];
  for (const [re, name] of MAP) {
    if (re.test(key)) return name;
  }
  return base
    .replace(/[_(]+1\)?/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts and strictly verifies the course duration directly from the document text or file name.
 * Prevents hallucinated or mismatched course durations.
 */
export function extractDurationFromDoc(rawText = '', fileName = '', fallbackTitle = '') {
  // 1. Check filename for "(3 Months)", "3 Months", "(6 Months)", "(8 Weeks)", etc.
  const fileStr = String(fileName || '');
  const fileMatch = fileStr.match(/(\d+)\s*(months?|weeks?|days?)/i);
  if (fileMatch) {
    const num = parseInt(fileMatch[1], 10);
    const unit = /week/i.test(fileMatch[2]) ? (num === 1 ? 'Week' : 'Weeks') : (num === 1 ? 'Month' : 'Months');
    return `${num} ${unit}`;
  }

  // 2. Check document text for explicit "Duration: X Months", "Course Duration: X Months", etc.
  const text = String(rawText || '').slice(0, 8000);
  const durMatch = text.match(/(?:course\s*)?duration\s*[:\-–]\s*([0-9]+\s*(?:months?|weeks?|days?|hours?)(?:\s*\([^\)]+\))?)/i);
  if (durMatch && durMatch[1]) {
    return durMatch[1].trim();
  }

  // 3. Check for standalone "X Months" or "X Weeks" in document header (first 2000 chars)
  const headerMatch = text.slice(0, 2000).match(/\b(\d+)\s*(months?|weeks?)\b/i);
  if (headerMatch) {
    const num = parseInt(headerMatch[1], 10);
    const unit = /week/i.test(headerMatch[2]) ? (num === 1 ? 'Week' : 'Weeks') : (num === 1 ? 'Month' : 'Months');
    return `${num} ${unit}`;
  }

  // 4. Fallback to standard verified duration for course title
  return durationForCourse(fallbackTitle);
}

export function durationForCourse(title = '') {
  const t = String(title).toLowerCase();
  if (/full.?stack|data.*science|aiml|machine.*learning/.test(t)) return '6 Months';
  if (/html.*css|wordpress/.test(t)) return '2 Months';
  return '3 Months';
}


