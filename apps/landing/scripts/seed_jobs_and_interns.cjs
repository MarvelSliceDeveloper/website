const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nzwxelouyrfhliwrzevu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56d3hlbG91eXJmaGxpd3J6ZXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDQwMjEsImV4cCI6MjEwMzMyMDAyMX0.32IoQn6pfrHCxgpL2-CPuUbOB7OvDPJZRPm8eLQQi34'
);

const CAT_DESIGN = '5bfe51dc-e866-4781-adf0-ab4f29fde1ed'; // Design & UX
const CAT_SOFTWARE = 'eefe5dc5-fb98-46c5-8a74-fd4ff52dc20a'; // Software Engineering
const CAT_DATA = 'd13e498f-60df-4071-992f-faa8bb47a722'; // Data Science & Analytics

// Exactly 10 Core Development Jobs
const jobsData = [
  {
    title: 'UI & UX Design',
    department: 'Design & UX',
    role_category_id: CAT_DESIGN,
    type: 'Full-time',
    experience: '2–5 years',
    location: 'Chennai / Hybrid',
    salary: '₹6 LPA – ₹11 LPA',
    qualification: 'Bachelor’s or Master’s in Design, HCI, Computer Science, or equivalent design portfolio',
    skills: 'Figma, Adobe XD, User Research, Wireframing, Prototyping, Design Systems, Usability Testing, Information Architecture, Interaction Design, Micro-interactions',
    description: `We are seeking an innovative UI & UX Designer to lead end-to-end user experience design and shape intuitive digital interfaces for our enterprise web and mobile applications.
You will conduct in-depth user research, customer journey mapping, stakeholder interviews, and persona creation to uncover critical user pain points and identify opportunities for delight.
Working collaboratively with engineering leads and product managers, you will transform complex technical workflows into elegant, friction-free interactive prototypes and wireframes using Figma.
You will build, scale, and maintain a robust, accessible design system comprising reusable UI components, design tokens, typography scales, and interactive states.
Your work will directly guide product architecture, ensuring cohesive visual hierarchy, intuitive navigation, and consistent brand identity across all customer touchpoints.
You will plan and execute usability testing sessions, collect behavioral feedback, and analyze user metrics to iterate rapidly on feature usability and accessibility.
A strong grasp of cognitive psychology, human-computer interaction principles, and modern micro-interaction design is essential to deliver engaging experiences.
In this position, you will advocate vigorously for the end-user while balancing business objectives and technical feasibility during sprint planning.
You will work closely with frontend developers during handoff, providing comprehensive design specs, edge-case documentation, and visual asset exports.
Join our creative product team to design meaningful, elegant solutions that simplify complex processes and empower thousands of users every day.`,
    key_requirements: `• Demonstrated track record as a UI/UX Designer with an exceptional portfolio showcasing end-to-end web/mobile product case studies.
• Mastery of Figma, including advanced components, auto-layout, interactive variants, design tokens, and prototyping workflows.
• Deep understanding of user-centered design processes, information architecture, wireframing, and usability heuristics.
• Experience planning and running generative and evaluative user research, usability testing, and heuristic evaluations.
• Proven ability to create, maintain, and document comprehensive multi-platform design systems.
• Familiarity with modern frontend capabilities, CSS grid/flexbox constraints, and technical feasibility boundaries.
• Strong presentation and storytelling skills to articulate design decisions persuasively to cross-functional stakeholders.`,
    responsibilities: `• Lead the UX research and UI design lifecycle for flagship web and mobile applications from problem discovery to final validation.
• Conduct user interviews, competitive analysis, and task analysis to produce detailed personas, user journey maps, and flowcharts.
• Create low-fidelity sketches and wireframes, progressing to high-fidelity clickable prototypes in Figma for user validation.
• Architect and maintain the enterprise design system, ensuring consistency across typography, color palettes, spacing, and UI components.
• Collaborate with software engineers during sprint development to review UI implementation and ensure pixel-perfect fidelity.
• Plan, execute, and synthesize usability testing sessions to generate actionable user experience recommendations.
• Champion accessibility best practices (WCAG), user empathy, and clean design thinking throughout the organization.`,
    sort_order: 1
  },
  {
    title: 'Front-End Developer',
    department: 'Frontend Engineering',
    role_category_id: CAT_SOFTWARE,
    type: 'Full-time',
    experience: '2–5 years',
    location: 'Chennai / Hybrid',
    salary: '₹6 LPA – ₹12 LPA',
    qualification: 'B.E / B.Tech / BCA / MCA / B.Sc in Computer Science or related field',
    skills: 'JavaScript (ES6+), TypeScript, HTML5, CSS3, React / Vue, Tailwind CSS, Webpack, Vite, Git, REST APIs, Cross-Browser Compatibility',
    description: `We are looking for an experienced Front-End Developer to translate visual designs and product requirements into elegant, resilient, and responsive client-side web applications.
In this role, you will architect modular frontend solutions utilizing modern JavaScript, TypeScript, semantic HTML5, and responsive CSS frameworks such as Tailwind CSS.
You will collaborate hand-in-hand with UI/UX designers, backend architects, and QA engineers to ensure flawless user journeys, accessibility standards, and pixel-accurate implementation.
You will be responsible for integrating RESTful APIs and GraphQL endpoints, handling client-side state caching, form validation, and real-time event updates.
Performance tuning is critical: you will optimize critical rendering paths, asset pipelines, code splitting, and browser rendering efficiency to maintain sub-second page loads.
You will guarantee seamless cross-browser compatibility and device responsiveness across mobile, tablet, and ultra-wide displays.
Code hygiene is paramount, and you will maintain high test coverage with automated unit and end-to-end testing frameworks.
You will implement reusable component libraries, design system tokens, and consistent styling across all customer-facing applications.
As an active agile team member, you will participate in technical spike investigations, sprint demos, and peer code reviews to maintain engineering excellence.
If you are passionate about crafting seamless user interfaces and driving the future of modern frontend web technologies, we would love to have you on board.`,
    key_requirements: `• Strong practical experience as a Front-End Developer building complex, responsive web applications at scale.
• Deep proficiency in modern JavaScript (ES6+), TypeScript, HTML5, and advanced CSS3 (Flexbox, Grid, animations).
• Hands-on experience with modern frontend libraries and frameworks such as React.js, Vue.js, or Next.js.
• Mastery of utility-first CSS frameworks like Tailwind CSS, modern CSS preprocessors, and responsive design methodologies.
• Proven track record integrating RESTful APIs, managing asynchronous state, and handling network errors gracefully.
• Familiarity with modern build tools (Vite, Webpack), package managers (pnpm, npm), and version control (Git).
• Passion for web accessibility (WCAG), semantic HTML, and Core Web Vitals performance optimization.`,
    responsibilities: `• Build and maintain intuitive, responsive, and high-performance client-facing web applications using modern JavaScript/TypeScript.
• Convert Figma UI/UX designs into pixel-perfect, accessible, and standards-compliant web components.
• Integrate frontend views with backend RESTful APIs, WebSockets, and third-party web services.
• Profile and optimize client-side performance, reducing Time to Interactive (TTI), First Contentful Paint (FCP), and Cumulative Layout Shift (CLS).
• Ensure seamless usability and visual consistency across all major desktop and mobile web browsers.
• Author robust unit and integration tests to ensure software reliability and prevent regressions.
• Collaborate with cross-functional product and design teams in fast-paced agile development cycles.`,
    sort_order: 2
  },
  {
    title: 'React JS',
    department: 'Frontend Engineering',
    role_category_id: CAT_SOFTWARE,
    type: 'Full-time',
    experience: '2–5 years',
    location: 'Chennai / Hybrid',
    salary: '₹6 LPA – ₹12 LPA',
    qualification: 'B.E / B.Tech / MCA in Computer Science, IT, or equivalent engineering background',
    skills: 'React.js, Next.js, TypeScript, Redux Toolkit, React Query, Tailwind CSS, Jest, React Testing Library, RESTful APIs, WebSockets',
    description: `We are hiring a skilled React JS Developer to spearhead the construction of scalable, reactive, and component-driven web applications for our core platform products.
You will leverage modern React conventions—including React 18/19 hooks, Context API, suspense, and server-side rendering with Next.js—to deliver fluid user experiences.
Collaborating with UI/UX designers and product owners, you will convert Figma specifications into clean, reusable, accessible UI component libraries.
You will manage complex client application states using Redux Toolkit, Zustand, or TanStack React Query, ensuring efficient caching and data synchronization.
Integrating REST APIs and real-time WebSockets, you will optimize client-side data handling, error boundaries, and optimistic UI updates for high responsiveness.
You will relentlessly profile and optimize web performance, eliminating unnecessary re-renders, leveraging dynamic imports, and boosting Core Web Vitals scores.
Writing robust unit and integration tests using Jest and React Testing Library will be an integral part of your continuous delivery workflow.
You will configure and maintain modern build systems with Vite, Webpack, and Docker for smooth development and production deployments.
You will participate in agile sprint ceremonies, code reviews, and architectural discussions to foster a culture of continuous learning and high code quality.
This role is a prime opportunity for a frontend specialist eager to work with the latest React ecosystem tools and drive impactful web solutions.`,
    key_requirements: `• Solid hands-on experience building enterprise-grade single-page and server-rendered web applications with React.js and Next.js.
• Advanced knowledge of TypeScript, ES6+ JavaScript, React hooks, custom hooks, and functional programming paradigms.
• Proven proficiency with state management solutions such as Redux Toolkit, Zustand, or TanStack Query.
• Deep understanding of component styling with Tailwind CSS, CSS Modules, or styled-components.
• Experience consuming RESTful APIs, WebSockets, and managing asynchronous data fetching with optimistic updates.
• Familiarity with unit testing frameworks including Jest and React Testing Library.
• Strong diagnostic skills for profiling React render cycles, memory consumption, and bundle size reduction.`,
    responsibilities: `• Architect and develop scalable, responsive web interfaces using React.js, Next.js, and TypeScript.
• Build reusable, accessible UI components and design systems aligned with product design guidelines.
• Manage global and server-state synchronization with Redux Toolkit and TanStack Query.
• Integrate third-party libraries, authentication flows (OAuth2/JWT), payment gateways, and real-time communication protocols.
• Analyze and improve application performance, optimizing bundle size, code-splitting, and rendering bottlenecks.
• Maintain high code coverage by authoring comprehensive unit, integration, and component tests.
• Collaborate closely with backend architects and product teams to deliver feature releases in rapid agile sprints.`,
    sort_order: 3
  },
  {
    title: 'Back-End Developer',
    department: 'Backend Engineering',
    role_category_id: CAT_SOFTWARE,
    type: 'Full-time',
    experience: '2–5 years',
    location: 'Chennai / Hybrid',
    salary: '₹6 LPA – ₹13 LPA',
    qualification: 'B.E / B.Tech / MCA / M.Sc in Computer Science or related engineering discipline',
    skills: 'Node.js, Express, Python, Go, RESTful APIs, GraphQL, PostgreSQL, MongoDB, Redis, Docker, Microservices, CI/CD',
    description: `We are seeking an experienced Back-End Developer to design, build, and maintain high-throughput, secure, and distributed server-side systems and APIs.
In this role, you will develop core backend services using modern runtime environments such as Node.js, Python, or Go, powering multi-tenant web and mobile applications.
You will architect robust relational and NoSQL databases—optimizing schema designs, indexes, complex queries, and migrations using PostgreSQL and MongoDB.
Designing and maintaining scalable RESTful APIs, gRPC services, and GraphQL interfaces will be at the heart of your daily engineering responsibilities.
You will implement distributed caching strategies with Redis, background job processing with queue workers, and asynchronous event streams to handle peak traffic effortlessly.
Security and compliance are top priorities: you will implement OAuth2, JWT authentication, role-based access control (RBAC), data encryption, and vulnerability mitigation.
You will collaborate closely with frontend engineers, DevOps specialists, and product managers to define clear API contracts and deployment architectures.
You will containerize applications using Docker, configure automated CI/CD deployment pipelines, and monitor production health via structured logging and telemetry.
You will participate in disaster recovery planning, automated database backup strategies, and comprehensive performance profiling.
If you take pride in architecting resilient backend infrastructures that handle massive concurrency with zero downtime, this position is tailored for you.`,
    key_requirements: `• Strong backend development experience using Node.js (TypeScript/Express/NestJS), Python, or Go in production environments.
• Comprehensive knowledge of database design, normalization, indexing, and query optimization in PostgreSQL or MySQL.
• Practical experience with NoSQL datastores (MongoDB, Redis) and message brokers (RabbitMQ, Kafka, BullMQ).
• Deep understanding of microservices architecture, RESTful API design standards, and API authentication/authorization protocols.
• Experience with containerization (Docker) and basic familiarity with Kubernetes and cloud environments (AWS/GCP).
• Solid understanding of software design patterns, SOLID principles, clean code architecture, and automated testing (Mocha/Jest/PyTest).
• Strong debugging, profiling, and root-cause analysis skills for distributed, high-concurrency systems.`,
    responsibilities: `• Design, implement, and maintain highly scalable backend microservices and RESTful API endpoints.
• Architect relational database schemas, optimize queries, manage database migrations, and maintain data integrity.
• Implement distributed caching layers, rate limiting, and asynchronous background worker queues using Redis.
• Enforce strict security controls including OAuth2/JWT authentication, input validation, encryption, and protection against common vulnerabilities.
• Write comprehensive automated unit, integration, and load tests to guarantee service reliability.
• Work alongside frontend developers to design efficient API payload contracts and support seamless client-server integration.
• Monitor production health, debug runtime issues, and continuously enhance system uptime, latency, and fault tolerance.`,
    sort_order: 4
  },
  {
    title: 'Python Developer',
    department: 'Software Engineering',
    role_category_id: CAT_SOFTWARE,
    type: 'Full-time',
    experience: '2–5 years',
    location: 'Chennai / Hybrid',
    salary: '₹6 LPA – ₹12 LPA',
    qualification: 'B.E / B.Tech / MCA in Computer Science, Information Technology, or related field',
    skills: 'Python 3+, Django, FastAPI, Flask, PostgreSQL, Celery, Redis, Docker, PyTest, RESTful APIs, AsyncIO',
    description: `We are looking for an accomplished Python Developer to architect, build, and deploy high-performance backend systems, automation pipelines, and robust APIs.
You will utilize modern Python frameworks such as FastAPI, Django, and Flask to develop scalable microservices and asynchronous backend workflows.
You will design, optimize, and manage relational database models in PostgreSQL, utilizing ORMs like SQLAlchemy and Django ORM while writing performant raw SQL when necessary.
A key focus will be building asynchronous task queues with Celery and Redis to handle data ingestion, background processing, and scheduled batch jobs.
You will implement secure RESTful and GraphQL APIs equipped with token-based authentication (JWT/OAuth), strict request validation, and comprehensive Swagger/OpenAPI documentation.
Collaborating with data engineers, frontend developers, and cloud teams, you will ensure reliable service integration and high availability across distributed cloud environments.
You will maintain superior software reliability by authoring automated unit and integration tests using PyTest, targeting high test coverage standards.
Containerization with Docker, CI/CD pipeline automation, and production monitoring using tools like Sentry and Prometheus will be regular aspects of your workflow.
You will profile memory usage, identify computational bottlenecks, and leverage Python's AsyncIO to maximize I/O throughput.
This role is an excellent opportunity for a passionate Pythonist to work on cutting-edge software solutions that process critical business data at scale.`,
    key_requirements: `• Strong professional background in Python 3+ development with in-depth knowledge of FastAPI, Django, or Flask.
• Practical experience with relational databases (PostgreSQL/MySQL), schema modeling, query profiling, and ORMs (SQLAlchemy, Django ORM).
• Proficiency in asynchronous programming using AsyncIO, Celery task queues, and Redis for distributed caching.
• Solid background designing and securing RESTful APIs, implementing JWT authentication, and defining OpenAPI specifications.
• Experience with unit and integration testing frameworks (PyTest, unittest) and mocking dependencies.
• Familiarity with Docker containerization, Linux environments, Git workflows, and CI/CD deployment pipelines.
• Excellent analytical, debugging, and algorithmic problem-solving capabilities.`,
    responsibilities: `• Architect, implement, and maintain high-performance backend services and APIs using Python, FastAPI, and Django.
• Design, optimize, and migrate PostgreSQL databases, writing performant queries and indexing structures.
• Build asynchronous job pipelines with Celery and Redis to process data imports, exports, and scheduled maintenance tasks.
• Collaborate with frontend and mobile engineers to define clear API specifications and deliver cohesive end-to-end features.
• Implement robust authentication, data encryption, rate limiting, and security best practices across all endpoints.
• Write comprehensive automated unit and integration tests in PyTest to ensure bulletproof system stability.
• Participate in code reviews, technical architecture sessions, and continuous system performance tuning.`,
    sort_order: 5
  },
  {
    title: 'Java Full Stack Development',
    department: 'Full Stack Engineering',
    role_category_id: CAT_SOFTWARE,
    type: 'Full-time',
    experience: '2–6 years',
    location: 'Chennai / Hybrid',
    salary: '₹7 LPA – ₹14 LPA',
    qualification: 'B.E / B.Tech / MCA / M.Tech in Computer Science, Software Engineering, or related discipline',
    skills: 'Java 17+, Spring Boot, Spring Cloud, Hibernate/JPA, React / Angular, PostgreSQL, MySQL, Docker, Kubernetes, Microservices, Maven',
    description: `We are seeking a versatile Java Full Stack Developer to spearhead the end-to-end development of enterprise-grade, cloud-native web applications.
On the backend, you will design and build resilient microservices using Java 17+, Spring Boot, Spring Security, and Spring Data JPA with Hibernate.
On the frontend, you will develop interactive, modular client-side interfaces using React or Angular, delivering smooth user journeys backed by responsive styling.
You will design and optimize relational databases including PostgreSQL and MySQL, crafting efficient queries, connection pooling, and transactional integrity.
Building, documenting, and securing RESTful APIs and WebSocket interfaces that bridge the frontend and backend layers will be a cornerstone of your daily work.
You will implement distributed caching, message brokering with Apache Kafka or RabbitMQ, and secure authentication workflows with OAuth2 and JWT.
Embracing DevOps and cloud best practices, you will containerize applications using Docker and participate in deploying containerized workloads to Kubernetes clusters.
You will enforce high engineering standards through automated unit and integration testing using JUnit 5, Mockito, and frontend testing suites.
You will troubleshoot production incidents, analyze thread dumps, and fine-tune JVM memory management and garbage collection performance.
Working within an agile team, you will collaborate with product managers, UX designers, and DevOps engineers to iteratively ship robust features that scale reliably to meet enterprise demands.`,
    key_requirements: `• Solid full-stack software development experience with Java (11/17+) and Spring Boot ecosystem (Spring Cloud, Security, Data).
• Proven proficiency with modern frontend frameworks (React.js or Angular) using TypeScript, HTML5, and modern CSS.
• In-depth expertise in relational database architecture, SQL optimization, and ORM persistence with Hibernate/JPA.
• Practical experience designing, building, and securing microservices architectures and RESTful web services.
• Familiarity with message streaming and queuing systems (Kafka, RabbitMQ) and caching mechanisms (Redis, Hazelcast).
• Experience with build tools (Maven, Gradle), Docker containerization, Git version control, and CI/CD pipelines.
• Strong foundation in object-oriented programming, data structures, design patterns, and automated testing (JUnit, Mockito).`,
    responsibilities: `• Lead the full-stack design and implementation of enterprise web applications using Java Spring Boot and React/Angular.
• Develop secure, scalable microservices, REST APIs, and event-driven architectures connecting multiple enterprise subsystems.
• Build responsive, accessible, and user-friendly frontend components that consume backend APIs seamlessly.
• Design, maintain, and optimize PostgreSQL and MySQL schemas, ensuring transaction safety and query performance.
• Implement enterprise security standards including OAuth2, JWT, SSO, and encryption protocols across all services.
• Write rigorous automated unit and integration tests across both frontend and backend layers to ensure software stability.
• Collaborate in sprint planning, perform peer code reviews, and support continuous deployment automation.`,
    sort_order: 6
  },
  {
    title: 'Python Full Stack Developer',
    department: 'Full Stack Engineering',
    role_category_id: CAT_SOFTWARE,
    type: 'Full-time',
    experience: '2–5 years',
    location: 'Chennai / Hybrid',
    salary: '₹6 LPA – ₹13 LPA',
    qualification: 'B.E / B.Tech / MCA in Computer Science, Information Technology, or equivalent',
    skills: 'Python 3+, Django, FastAPI, React.js, Next.js, PostgreSQL, TypeScript, Redis, Docker, Tailwind CSS, REST APIs',
    description: `We are hiring an enthusiastic Python Full Stack Developer to take end-to-end ownership of full-lifecycle web applications from concept to production deployment.
In this versatile position, you will build robust, secure backend services using Python with Django or FastAPI, coupled with modern relational databases like PostgreSQL.
Simultaneously, you will build polished, reactive frontend user interfaces using React.js, Next.js, TypeScript, and modern Tailwind CSS styling.
You will design and consume clean RESTful APIs, managing asynchronous state, client caching, form handling, and interactive real-time dashboards.
You will implement distributed background tasks with Celery and Redis to handle intensive computing, asynchronous processing, and third-party integrations.
Performance optimization will span both sides of the stack—optimizing SQL queries and database indexes while streamlining frontend bundle sizes and Core Web Vitals.
You will implement comprehensive security practices, including JWT authentication, CSRF protections, input sanitization, and role-based permissions across all user workflows.
You will package and orchestrate applications using Docker and Docker Compose, supporting automated testing and CI/CD delivery pipelines.
You will collaborate in an agile team, participating in technical architecture design, sprint estimation, code reviews, and continuous deployments.
If you love working across the entire technology spectrum and turning ambitious product ideas into reliable full-stack applications, this role is a great fit for you.`,
    key_requirements: `• Demonstrated experience developing full-stack web applications using Python (Django/FastAPI) and JavaScript/TypeScript (React/Next.js).
• Deep understanding of relational database design, query tuning, and ORM usage in PostgreSQL or MySQL.
• Proficiency in building dynamic, accessible, and mobile-responsive UI components with React.js, Next.js, and Tailwind CSS.
• Hands-on expertise building and integrating RESTful APIs with token-based authentication and role-based access control.
• Experience with background worker queues (Celery, Redis) and real-time communication protocols (WebSockets).
• Familiarity with Docker, Linux server administration, Git version control, and automated CI/CD workflows.
• Strong analytical mindset, passion for learning new technologies, and proactive team collaboration.`,
    responsibilities: `• Develop, test, and ship complete full-stack web applications using Python backend frameworks and React/Next.js frontend libraries.
• Create clean, documented, and secure RESTful APIs to facilitate seamless data communication between client and server.
• Design, migrate, and optimize PostgreSQL database schemas, indexes, and complex analytical queries.
• Implement responsive frontend interfaces adhering to modern UI/UX principles and accessibility standards.
• Set up asynchronous background task processing and caching using Celery and Redis for heavy workloads.
• Author automated unit and end-to-end tests across frontend and backend layers to maintain exceptional release reliability.
• Work in close collaboration with product managers, designers, and DevOps engineers to ship impactful features iteratively.`,
    sort_order: 7
  },
  {
    title: 'WordPress Developer',
    department: 'Web Development',
    role_category_id: CAT_SOFTWARE,
    type: 'Full-time',
    experience: '2–5 years',
    location: 'Chennai / Hybrid',
    salary: '₹5 LPA – ₹9 LPA',
    qualification: 'B.E / B.Tech / BCA / MCA / B.Sc in CS or relevant web development background',
    skills: 'WordPress, PHP 8+, Custom Theme Development, Plugin Development, WooCommerce, MySQL, JavaScript, HTML5, CSS3, REST API',
    description: `We are seeking an experienced WordPress Developer to design, build, and maintain custom, high-traffic WordPress websites, bespoke themes, and specialized plugins.
You will write clean, secure, and extensible PHP code following WordPress coding standards, creating tailored themes from scratch without reliance on bloated pre-made templates.
In this role, you will develop custom WordPress Gutenberg blocks, ACF (Advanced Custom Fields) architectures, and bespoke plugins that satisfy unique business specifications.
You will customize, extend, and maintain WooCommerce e-commerce platforms, configuring custom checkout flows, payment gateways, and inventory integrations.
Performance and security optimization are paramount: you will implement server-side caching, database query tuning, image optimization, CDN integrations, and hardening measures against vulnerabilities.
You will build and leverage the WordPress REST API to enable headless architectures and integrate external web services, CRM systems, and marketing tools.
Ensuring cross-browser compatibility, mobile responsiveness, and accessibility across all custom templates will be a core requirement.
You will manage website staging environments, automated backups, version control with Git, and seamless migration workflows.
You will collaborate with content creators and digital marketing teams to ensure rapid publishing workflows, SEO compliance, and analytics tracking.
If you possess deep WordPress architecture expertise and take pride in delivering fast, bespoke web solutions, we look forward to meeting you.`,
    key_requirements: `• Proven experience as a professional WordPress Developer creating custom themes, plugins, and complex web architectures.
• In-depth knowledge of PHP 8+, MySQL, JavaScript, HTML5, CSS3/SCSS, and WordPress template hierarchy.
• Extensive experience developing custom Gutenberg blocks (using React/JS) and advanced ACF Pro implementations.
• Hands-on experience customizing and extending WooCommerce functionality, payment gateways, and custom checkout experiences.
• Demonstrated understanding of WordPress security hardening, performance optimization, and object caching (Redis/Memcached).
• Experience working with the WordPress REST API, third-party webhooks, and headless WordPress setups.
• Proficiency in Git version control, staging/production deployments, and database migration routines.`,
    responsibilities: `• Architect, develop, and maintain custom WordPress themes and plugins built from ground up to client specifications.
• Create modular, reusable Gutenberg blocks and Advanced Custom Fields configurations for streamlined content editing.
• Integrate third-party APIs, CRM platforms, email marketing software, and secure payment gateways into WordPress environments.
• Optimize WordPress websites for maximum loading speed, Core Web Vitals, and technical on-page SEO.
• Maintain database integrity, perform version updates, manage automated backups, and implement rigorous security monitoring.
• Troubleshoot and resolve website bugs, plugin conflicts, and cross-browser visual rendering issues.
• Collaborate with web designers and marketing strategists to launch high-converting landing pages on schedule.`,
    sort_order: 8
  },
  {
    title: 'Data Science',
    department: 'Data Science & Analytics',
    role_category_id: CAT_DATA,
    type: 'Full-time',
    experience: '2–5 years',
    location: 'Chennai / Hybrid',
    salary: '₹7 LPA – ₹14 LPA',
    qualification: 'B.E / B.Tech / M.Tech / M.Sc in Data Science, Computer Science, Statistics, Mathematics, or related quantitative field',
    skills: 'Python, R, SQL, Pandas, NumPy, Scikit-learn, Statistical Modeling, Machine Learning, Tableau / Power BI, Big Data, Data Visualization',
    description: `We are looking for an analytical and forward-thinking Data Scientist to transform massive volumes of structured and unstructured data into actionable business intelligence and predictive models.
You will spearhead the complete data science lifecycle—from exploratory data analysis, data cleaning, and hypothesis formulation to advanced feature engineering and statistical validation.
Utilizing Python, R, and advanced SQL, you will query enterprise data lakes and data warehouses to extract meaningful patterns, trends, and operational correlations.
You will build, train, and fine-tune machine learning models using libraries such as Scikit-learn, XGBoost, and statsmodels to solve complex predictive problems like forecasting, churn analysis, and customer segmentation.
Collaborating with data engineers, you will establish automated data preprocessing pipelines and monitor model drift and performance metrics in production.
You will translate sophisticated statistical findings into clear executive summaries, interactive dashboards, and compelling visual reports using Power BI, Tableau, or Matplotlib.
A strong command of linear algebra, probability theory, A/B testing methodologies, and experimental design will be essential for your daily analytical work.
You will partner cross-functionally with product managers and business leaders to frame strategic questions and deploy data-driven solutions that drive measurable business growth.
You will continuously evaluate new modeling techniques, benchmark predictive accuracy, and document algorithmic methodologies for enterprise transparency.
Join our analytics team to shape the future of our data-driven decision-making and build impactful predictive systems.`,
    key_requirements: `• Proven professional experience in Data Science, statistical modeling, and applied machine learning.
• Advanced proficiency in Python (Pandas, NumPy, Scikit-learn, SciPy) or R, and mastery of complex SQL queries and relational databases.
• Strong mathematical foundation in inferential statistics, probability distributions, linear regression, clustering, and decision trees.
• Hands-on experience developing end-to-end predictive models, evaluating performance with AUC/ROC, RMSE, and F1-score metrics.
• Experience building interactive business dashboards and data visualizations with Tableau, Power BI, Seaborn, or Plotly.
• Familiarity with big data tools, cloud data warehouses (Snowflake, BigQuery), and Git version control.
• Outstanding ability to communicate technical data insights clearly to non-technical business stakeholders.`,
    responsibilities: `• Conduct end-to-end data science projects: scoping business questions, ingesting data, engineering features, and training models.
• Query, clean, and validate complex datasets from disparate enterprise sources to create clean modeling pipelines.
• Build, evaluate, and operationalize statistical and machine learning algorithms for predictive and prescriptive analytics.
• Design, execute, and analyze rigorous A/B experiments and multivariate tests to measure feature performance and business impact.
• Create insightful dashboards and automated reporting visualizations to track company KPIs and model performance.
• Collaborate with software engineers to deploy trained models as accessible API microservices in production.
• Continuously research novel data science methodologies and present actionable findings to executive leadership.`,
    sort_order: 9
  },
  {
    title: 'Generative AI',
    department: 'AI & Data Science',
    role_category_id: CAT_DATA,
    type: 'Full-time',
    experience: '2–5 years',
    location: 'Chennai / Hybrid',
    salary: '₹8 LPA – ₹16 LPA',
    qualification: 'B.E / B.Tech / M.Tech / M.Sc in Computer Science, Artificial Intelligence, Machine Learning, or related field',
    skills: 'LLMs, LangChain, LlamaIndex, OpenAI API, Hugging Face, PyTorch, Vector Databases (Pinecone/Milvus/Chroma), RAG Architectures, Prompt Engineering, Python',
    description: `We are seeking an ambitious Generative AI Engineer to architect, build, and deploy next-generation AI-powered products and intelligent agent workflows.
In this cutting-edge role, you will design and implement enterprise Retrieval-Augmented Generation (RAG) pipelines leveraging vector databases like Pinecone, Milvus, and ChromaDB.
You will develop intelligent conversational agents, document analyzers, and automated cognitive workflows utilizing state-of-the-art Large Language Models (LLMs) from OpenAI, Anthropic, and open-source models via Hugging Face.
You will leverage modern AI orchestration frameworks including LangChain, LlamaIndex, and AutoGen to build multi-step reasoning, tool-using agents, and robust memory management.
Fine-tuning models with techniques like LoRA and PEFT, optimizing prompt engineering strategies, and evaluating model hallucinations will be fundamental to your technical responsibilities.
You will implement enterprise guardrails, safety filtering, rate limiting, and cost-optimization measures to ensure predictable, secure, and compliant AI outputs.
Collaborating with full-stack engineers and product architects, you will integrate LLM microservices into customer-facing web and mobile applications via high-speed asynchronous APIs.
You will establish automated evaluation frameworks to benchmark answer relevancy, retrieval precision, and semantic similarity across production queries.
You will continuously research and experiment with emerging breakthroughs in multimodal AI, embeddings, graph RAG, and reasoning models to keep our products at the bleeding edge.
If you are thrilled by the rapid evolution of generative AI and want to build practical applications that solve real-world problems, this role is for you.`,
    key_requirements: `• Hands-on engineering experience developing and deploying Generative AI and LLM-powered applications in production.
• Deep proficiency in Python and expertise with LLM orchestration frameworks (LangChain, LlamaIndex, Semantic Kernel).
• Extensive experience with commercial and open-source models (OpenAI GPT-4, Claude, Mistral, LLaMA) and Hugging Face Transformers.
• Solid background in building and scaling Retrieval-Augmented Generation (RAG) systems using vector databases (Pinecone, Chroma, Milvus, Qdrant).
• Practical understanding of prompt engineering, fine-tuning methodologies (LoRA, QLoRA), embeddings, and semantic search.
• Experience developing asynchronous microservices using FastAPI, Docker, and cloud AI platforms.
• Strong grasp of AI security, prompt injection defenses, output validation, and cost-monitoring strategies.`,
    responsibilities: `• Architect, implement, and deploy production-grade Generative AI microservices, RAG architectures, and autonomous agent workflows.
• Integrate Large Language Models into user-facing web applications using LangChain, LlamaIndex, and FastAPI.
• Build, index, and optimize vector databases to power lightning-fast, context-aware semantic retrieval over large enterprise document collections.
• Benchmark and continuously refine prompt engineering templates, chain-of-thought logic, and output validation guardrails.
• Monitor and optimize LLM token consumption, API latency, retrieval accuracy, and inference costs across all AI features.
• Collaborate with product managers, designers, and software engineers to prototype and test novel AI user experiences.
• Stay at the forefront of generative AI academic research and open-source developments to drive continuous product innovation.`,
    sort_order: 10
  }
];

// Exactly 4 Entry-Level Internships
const internsData = [
  {
    title: 'Web Design Intern',
    department: 'Design & Creative',
    role_category_id: CAT_DESIGN,
    type: 'Internship',
    duration: '3 Months',
    experience: 'Freshers / Final Year Students',
    location: 'Chennai / Hybrid',
    stipend: '₹12,000 – ₹18,000/month',
    qualification: 'Pursuing or Completed B.E / B.Tech / BCA / B.Sc / Diploma in Web or Graphic Design',
    skills: 'HTML5, CSS3, JavaScript, Tailwind CSS, Figma, Responsive Web Design, UI Design Basics',
    description: `We are looking for an energetic and creative Web Design Intern to join our digital design team and gain hands-on experience building real-world websites.
During this internship, you will work alongside experienced web designers and frontend engineers on production landing pages, user portals, and responsive digital campaigns.
You will learn to translate design ideas and Figma mockups into clean, semantic HTML5, CSS3, and utility-first styling using modern frameworks like Tailwind CSS.
You will receive one-on-one mentorship covering responsive design principles, web accessibility (WCAG), cross-browser compatibility, and visual hierarchy.
You will assist in creating interactive wireframes, website banners, iconography, and visual digital assets that elevate our brand identity.
You will participate in daily standups, design reviews, and constructive code feedback sessions to accelerate your technical and creative development.
This internship provides practical exposure to modern version control workflows with Git, collaborative team sprints, and asset optimization techniques.
High-performing interns will have the opportunity to take full ownership of feature deliverables and showcase tangible work in their portfolios.
We foster a collaborative, learning-focused environment where your fresh perspectives, creativity, and enthusiasm will be highly celebrated.
Candidates who demonstrate exceptional passion, rapid learning capability, and solid work ethic will be considered for full-time employment offers upon completion.`,
    key_requirements: `• Basic understanding of HTML5, CSS3, and modern JavaScript fundamentals.
• Familiarity with design tools such as Figma, Adobe XD, or Photoshop.
• Eagerness to learn responsive web design, modern CSS frameworks (Tailwind CSS), and web accessibility.
• A keen eye for aesthetics, visual layout balance, color choices, and typography.
• Good written and verbal communication skills and excitement to collaborate in a team.
• Currently pursuing or recently graduated with a degree in Computer Science, Design, or related field.`,
    responsibilities: `• Assist in designing and coding responsive web pages and landing templates using HTML5, CSS3, and Tailwind CSS.
• Convert Figma design wireframes into clean, interactive web components.
• Optimize images, icons, and multimedia assets for rapid website loading.
• Test web pages across various devices and browsers to identify and resolve visual bugs.
• Participate in design critiques, sprint discussions, and technical learning sessions.
• Collaborate with senior designers to maintain and update the company design library.`,
    sort_order: 1
  },
  {
    title: 'Angular JS Intern',
    department: 'Software Engineering',
    role_category_id: CAT_SOFTWARE,
    type: 'Internship',
    duration: '3 Months',
    experience: 'Freshers / Final Year Students',
    location: 'Chennai / Hybrid',
    stipend: '₹12,000 – ₹18,000/month',
    qualification: 'Pursuing or Completed B.E / B.Tech / BCA / MCA in CS / IT or related discipline',
    skills: 'AngularJS, Angular, TypeScript, JavaScript, HTML5, CSS3, REST APIs, Git',
    description: `We are seeking an enthusiastic Angular JS Intern to join our software engineering team and gain real-world experience building robust single-page applications.
During this internship, you will receive structured guidance from senior developers as you build modular frontend components using Angular and TypeScript.
You will learn to consume RESTful APIs, manage client-side routing, handle form validation, and implement clean reactive programming patterns with RxJS.
You will participate in code refactoring initiatives, discovering how enterprise teams modernize legacy AngularJS code into modern Angular frameworks.
You will write clean, semantic HTML5 and modern CSS3, ensuring that application views are responsive, performant, and consistent across all devices.
Through hands-on bug fixes and feature development, you will learn professional software debugging, browser profiling, and Git version control practices.
You will take part in daily agile standup meetings, sprint reviews, and technical discussions that provide a window into professional software engineering.
We emphasize continuous learning, mentorship, and practical skill-building, empowering you to tackle real technical challenges with confidence.
Your contributions will directly touch live applications used by real users, giving you tangible engineering achievements for your career launch.
Interns who demonstrate exceptional technical aptitude, problem-solving determination, and positive collaboration will be eligible for full-time job offers.`,
    key_requirements: `• Basic knowledge of JavaScript (ES6+), TypeScript, HTML5, and CSS3.
• Exposure to Angular or AngularJS through coursework, personal projects, or internships.
• Understanding of fundamental web development concepts like REST APIs, JSON, and DOM manipulation.
• Familiarity with Git for source code management.
• Strong logical thinking, enthusiasm for learning new frameworks, and passion for software engineering.
• Pursuing or completed a Bachelor's or Master's degree in Computer Science, IT, or related field.`,
    responsibilities: `• Assist in developing and maintaining web components and views in Angular and AngularJS under mentor guidance.
• Integrate frontend forms and dashboards with backend REST API endpoints.
• Debug and resolve client-side visual glitches, layout issues, and functional defects.
• Write clean, readable, and well-documented TypeScript and JavaScript code.
• Participate in code reviews, technical pair-programming sessions, and agile sprint standups.
• Explore and implement modern frontend best practices, including responsive design and modular architecture.`,
    sort_order: 2
  },
  {
    title: 'PHP Developer Intern',
    department: 'Software Engineering',
    role_category_id: CAT_SOFTWARE,
    type: 'Internship',
    duration: '3 Months',
    experience: 'Freshers / Final Year Students',
    location: 'Chennai / Hybrid',
    stipend: '₹10,000 – ₹16,000/month',
    qualification: 'Pursuing or Completed B.E / B.Tech / BCA / MCA in CS / IT or equivalent',
    skills: 'PHP 8+, MySQL, Laravel basics, HTML5, CSS3, JavaScript, REST APIs, Git',
    description: `We are looking for an ambitious PHP Developer Intern to join our software development team and work on modern PHP web applications and API platforms.
Throughout this internship, you will receive mentorship from seasoned software engineers, learning modern object-oriented PHP 8+ and Laravel framework conventions.
You will participate in building scalable web modules, working with relational databases in MySQL, and writing efficient database queries.
You will learn to create and consume RESTful web services, handle user authentication, and validate incoming form submissions securely.
You will discover how to implement caching with Redis, manage dependencies using Composer, and organize clean MVC (Model-View-Controller) architectures.
You will gain hands-on exposure to web security best practices, learning how to prevent SQL injection, cross-site scripting (XSS), and CSRF vulnerabilities.
Working with Git, you will collaborate on shared code repositories, submit pull requests, and participate in thorough peer code review sessions.
This internship offers practical, project-based learning where you will tackle real business problems and contribute to live enterprise applications.
We maintain an encouraging, collaborative atmosphere designed to nurture your technical talent and prepare you for a successful engineering career.
Interns demonstrating strong dedication, fast learning pace, and high code quality will be actively evaluated for full-time junior developer positions.`,
    key_requirements: `• Good foundational knowledge of PHP and object-oriented programming concepts.
• Basic understanding of MySQL databases, SQL queries, and relational data modeling.
• Familiarity with the MVC architecture and interest in learning the Laravel framework.
• Understanding of frontend basics (HTML5, CSS3, basic JavaScript) to integrate dynamic views.
• Familiarity with Git for code version control and Composer for package management.
• Eagerness to learn, strong problem-solving orientation, and good team collaboration skills.`,
    responsibilities: `• Write clean, well-documented PHP code to develop web application features and API endpoints under mentorship.
• Create and manage MySQL database tables, writing optimized queries and basic migrations.
• Assist in building secure backend validation and integrating frontend web forms.
• Test and debug application modules to ensure stability and cross-browser reliability.
• Participate in team code reviews, agile standup meetings, and technical knowledge-sharing sessions.
• Continuously learn modern PHP standards, Laravel best practices, and enterprise coding patterns.`,
    sort_order: 3
  },
  {
    title: 'AIML Intern',
    department: 'AI & Machine Learning',
    role_category_id: CAT_DATA,
    type: 'Internship',
    duration: '3 Months',
    experience: 'Freshers / Final Year Students',
    location: 'Chennai / Hybrid',
    stipend: '₹15,000 – ₹25,000/month',
    qualification: 'Pursuing or Completed B.E / B.Tech / M.Tech in CS, AI, ML, Data Science, or related quantitative field',
    skills: 'Python, PyTorch / TensorFlow basics, Machine Learning, Deep Learning, Computer Vision / NLP basics, Git',
    description: `We are seeking an ambitious AI & Machine Learning Intern to join our advanced machine learning team and work on production AI systems.
In this position, you will work side-by-side with senior AI engineers on challenging problems in Computer Vision, Natural Language Processing, and predictive modeling.
You will write clean, performant Python code using PyTorch or TensorFlow, learning how to build, train, evaluate, and fine-tune deep learning neural networks.
You will gain hands-on experience with data curation, annotation, image preprocessing, tokenization, and data augmentation to feed training pipelines.
Under senior mentorship, you will explore MLOps principles, learning how to track model metrics with MLflow, version datasets, and containerize models with Docker.
You will discover how trained models are optimized for low-latency inference using ONNX, TensorRT, and quantization techniques for cloud deployment.
You will participate in academic research reading groups, translating cutting-edge deep learning papers into practical code implementations.
This internship provides an immersive, rigorous environment designed to elevate your theoretical machine learning foundation into enterprise-level engineering capability.
You will take ownership of model experimentation tasks and see your algorithms deployed into real-world software products.
Interns who demonstrate exceptional analytical depth, strong software engineering foundations, and persistent curiosity will be evaluated for full-time positions.`,
    key_requirements: `• Strong coding proficiency in Python and familiarity with scientific computing libraries (NumPy, SciPy).
• Fundamental understanding of machine learning algorithms (linear models, decision trees, neural networks).
• Academic or project experience using deep learning frameworks such as PyTorch, TensorFlow, or Keras.
• Familiarity with Computer Vision (OpenCV, CNNs) or Natural Language Processing (tokenizers, transformers) fundamentals.
• Familiarity with Git for code versioning and Linux terminal environments.
• Pursuing or completed a Bachelor's or Master's degree in Computer Science, Artificial Intelligence, Data Science, or related field.`,
    responsibilities: `• Assist in collecting, cleaning, labeling, and augmenting datasets for machine learning and deep learning models.
• Implement, train, and evaluate baseline deep learning models using PyTorch or TensorFlow under mentor supervision.
• Track model hyperparameter experiments, loss curves, and validation metrics using MLflow or Weights & Biases.
• Help optimize inference runtimes through model conversion to ONNX and basic quantization.
• Package trained models into containerized FastAPI microservices for engineering testing.
• Participate in engineering sprint ceremonies, model review presentations, and AI research discussions.`,
    sort_order: 4
  }
];

async function run() {
  console.log('--- Step 1: Deleting existing jobs and internships ---');
  
  // 1. Delete all existing job_openings
  const { error: errDelJobs } = await supabase.from('job_openings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errDelJobs) {
    console.error('Error deleting jobs:', errDelJobs);
  } else {
    console.log('Successfully deleted all existing jobs.');
  }

  // 2. Delete all existing internships
  const { error: errDelInterns } = await supabase.from('internships').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errDelInterns) {
    console.error('Error deleting internships:', errDelInterns);
  } else {
    console.log('Successfully deleted all existing internships.');
  }

  console.log('\n--- Step 2: Inserting 10 Job Openings with 10+ line detailed descriptions ---');
  for (const job of jobsData) {
    const payload = {
      title: job.title,
      department: job.department,
      division: job.department,
      role_category_id: job.role_category_id,
      location: job.location,
      type: job.type,
      experience: job.experience,
      salary: job.salary,
      description: job.description.replace(/?
+/g, ' ').trim(),
      key_requirements: job.key_requirements,
      responsibilities: job.responsibilities,
      qualifications: job.qualification,
      skills: job.skills,
      is_active: true,
      sort_order: job.sort_order
    };

    const { data, error } = await supabase.from('job_openings').insert(payload).select('id, title');
    if (error) {
      console.error(`Error inserting job "${job.title}":`, error.message);
    } else {
      console.log(`✓ Added Job [${job.sort_order}]: ${job.title} (ID: ${data[0]?.id})`);
    }
  }

  console.log('\n--- Step 3: Inserting 4 Internships with 10+ line detailed descriptions ---');
  for (const intern of internsData) {
    const payload = {
      title: intern.title,
      role_category_id: intern.role_category_id,
      division: intern.department,
      location: intern.location,
      type: intern.type,
      duration: intern.duration,
      stipend: intern.stipend,
      experience: intern.experience,
      description: intern.description.replace(/?
+/g, ' ').trim(),
      key_requirements: intern.key_requirements,
      responsibilities: intern.responsibilities,
      qualifications: intern.qualification,
      skills: intern.skills,
      is_active: true,
      sort_order: intern.sort_order
    };

    const { data, error } = await supabase.from('internships').insert(payload).select('id, title');
    if (error) {
      console.error(`Error inserting internship "${intern.title}":`, error.message);
    } else {
      console.log(`✓ Added Internship [${intern.sort_order}]: ${intern.title} (ID: ${data[0]?.id})`);
    }
  }

  console.log('\n--- Step 4: Verification ---');
  const { count: jobCount } = await supabase.from('job_openings').select('*', { count: 'exact', head: true });
  const { count: internCount } = await supabase.from('internships').select('*', { count: 'exact', head: true });
  console.log(`Total Job Openings in DB: ${jobCount}`);
  console.log(`Total Internships in DB: ${internCount}`);
}

run().catch(console.error);
