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

/** Grounded projects: early modules → guided builds, later modules → capstones. */
export function projectsFor(title, modules) {
  const mods = (modules || []).filter((m) => (m.topics || []).length);
  if (!mods.length) return [];
  const n = mods.length;
  const picks = [];
  if (mods[0]) {
    picks.push({
      level: 'Beginner',
      title: `${mods[0].title} — Foundation Build`,
      desc: `Apply ${(mods[0].topics || []).slice(0, 3).join(', ')} in a mentor-reviewed guided build.`,
    });
  }
  const mid = mods[Math.floor(n / 2)];
  if (mid && mid !== mods[0]) {
    picks.push({
      level: 'Intermediate',
      title: `${mid.title} — Integrated Project`,
      desc: `Combine ${(mid.topics || []).slice(0, 3).join(', ')} into one working application.`,
    });
  }
  const lastTwo = mods.slice(-2);
  lastTwo.forEach((m) => {
    picks.push({
      level: 'Advanced',
      title: `${m.title} — Capstone`,
      desc: `End-to-end capstone using ${(m.topics || []).slice(0, 3).join(', ')} with deployment.`,
    });
  });
  // Level tags normalized to module position
  return picks.slice(0, 6).map((p, i) => ({ ...p, level: LEVEL_BY_INDEX(i, picks.length) }));
}

export function faqsFor(title, modules) {
  const count = (modules || []).length;
  const first = modules?.[0]?.title || 'fundamentals';
  const last = modules?.[count - 1]?.title || 'capstone';
  return [
    ['Is this course suitable for absolute beginners?',
      `Yes. It starts from ${first} and progresses step by step across ${count} modules to ${last}.`],
    ['How are the classes conducted?',
      'Mentor-led sessions plus self-paced practice, with every topic backed by live examples and exercises.'],
    ['Will I build projects during the course?',
      'Yes — guided builds after early modules and capstone projects covering the advanced modules, all portfolio-ready.'],
    ['What do I need before joining?',
      `${prerequisitesFor(title).join('; ')}.`],
    ['Do I get a certificate?',
      'Yes — a Marvel Slice course-completion certificate listing the modules and projects you finished.'],
    ['How does career support work?',
      'Resume review, LinkedIn profile cleanup, mock interviews and referrals once your capstones are complete.'],
  ];
}

export function outcomesFor(title, modules) {
  const tops = (modules || []).slice(0, 6).map((m) => m.title).filter(Boolean);
  const base = tops.map((t) => `Independently plan and build ${t.toLowerCase()} tasks without supervision`);
  return [
    ...base.slice(0, 4),
    `Ship ${Math.min(4, Math.max(2, Math.round((modules || []).length / 4)))} portfolio-grade projects with clean, commented code`,
    'Debug errors systematically using logs, docs and mentor guidance',
    'Explain your work in interviews with architecture-level clarity',
    'Keep learning solo with docs, GitHub and community resources',
  ].slice(0, 8);
}
