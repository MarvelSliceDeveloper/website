-- ============================================================
-- RESEED ALL COURSES WITH FULL RICH CONTENT
-- Run in Supabase SQL Editor
-- ============================================================

-- Step 1: Ensure all columns exist on courses table
alter table courses add column if not exists rating numeric default 4.5;
alter table courses add column if not exists review_count int default 0;
alter table courses add column if not exists learner_count int default 0;
alter table courses add column if not exists subtitle text;
alter table courses add column if not exists hero_image_url text;
alter table courses add column if not exists video_url text;
alter table courses add column if not exists duration text;
alter table courses add column if not exists mode text;
alter table courses add column if not exists status text default 'Active';
alter table courses add column if not exists curriculum jsonb default '[]';
alter table courses add column if not exists show_pricing boolean default false;
alter table courses add column if not exists checklist_items jsonb default '[]';
alter table projects add column if not exists difficulty text;
alter table projects add column if not exists technologies jsonb default '[]';
alter table certifications add column if not exists skills_earned jsonb default '[]';

-- Step 2: Clean existing data
delete from course_tags;
delete from course_tabs;
delete from faqs;
delete from overview_faqs;
delete from course_fees;
delete from projects;
delete from certifications;
delete from highlights;
delete from related_courses;
delete from courses;

-- Step 2: Tags (insert if missing)
insert into tags (name) values
  ('full-stack-development'), ('react'), ('nodejs'), ('javascript'),
  ('backend'), ('python'), ('apis'), ('databases'),
  ('machine-learning'), ('ai'), ('data-science'), ('python-ml'),
  ('data-analysis'), ('visualization'), ('sql'), ('excel'),
  ('cloud-computing'), ('aws'), ('azure'), ('gcp'),
  ('cybersecurity'), ('ethical-hacking'), ('network-security'), ('penetration-testing'),
  ('game-development'), ('unity'), ('csharp'), ('3d'),
  ('upsc'), ('general-studies'), ('competitive-exams'),
  ('ssc'), ('quantitative-aptitude'), ('reasoning'),
  ('banking-exams'), ('ibps'), ('sbi')
on conflict (name) do nothing;

-- Step 3: Find nav_item IDs by label + parent_label
with
nav as (select * from nav_items),

-- Software Learning leaf items
frontend_id as (select id from nav where label = 'Frontend' and parent_label = 'Web Development'),
backend_id as (select id from nav where label = 'Backend' and parent_label = 'Web Development'),
aiml_id as (select id from nav where label = 'AI & ML' and parent_label = 'Software Learning'),
datasci_id as (select id from nav where label = 'Data Science' and parent_label = 'Software Learning'),
cloud_id as (select id from nav where label = 'Cloud & DevOps' and parent_label = 'Software Learning'),
cybersec_id as (select id from nav where label = 'Cybersecurity' and parent_label = 'Software Learning'),
gamedev_id as (select id from nav where label = 'Game Dev' and parent_label = 'Software Learning'),

-- Competitive Exam leaf items
upsc_id as (select id from nav where label = 'UPSC' and parent_label = 'Competitive Exam'),
ssc_id as (select id from nav where label = 'SSC' and parent_label = 'Competitive Exam'),
banking_id as (select id from nav where label = 'Banking' and parent_label = 'Competitive Exam')

-- Step 4: Insert courses
insert into courses (slug, title, subtitle, description, hero_image_url, video_url, nav_item_id, rating, review_count, learner_count, duration, mode, status, curriculum, is_published, show_pricing)
values
-- 1. Full Stack Web Development
(
  'full-stack-web-development',
  'Full Stack Web Development Bootcamp',
  'Become a job-ready full stack developer in 6 months',
  'A comprehensive bootcamp covering frontend and backend web development. Learn HTML, CSS, JavaScript, React, Node.js, Express, MongoDB, and PostgreSQL. Build real-world projects and deploy them to production. Get hands-on experience with modern development tools including Git, Docker, and CI/CD pipelines. Master both relational and NoSQL databases, RESTful APIs, and authentication systems.',
  null, null,
  (select id from frontend_id),
  4.5, 128, 0, '6 months', 'Online', 'Active',
  '[{"title":"HTML & CSS Fundamentals","description":"Master the building blocks of the web","topics":["Semantic HTML5","CSS Selectors & Specificity","Flexbox & Grid Layouts","Responsive Design with Media Queries","CSS Animations & Transitions","SASS/SCSS Preprocessor"]},{"title":"JavaScript Deep Dive","description":"Modern ES6+ JavaScript","topics":["Variables, Scoping & Hoisting","Closures & Higher-Order Functions","Promises & Async/Await","DOM Manipulation & Events","Fetch API & AJAX","ES6 Modules & Bundlers"]},{"title":"React Frontend Framework","description":"Build interactive UIs with React","topics":["JSX & Component Architecture","useState & useEffect Hooks","React Router for SPA Navigation","State Management with Context","Custom Hooks & Reusable Logic","Testing with Jest & React Testing Library"]},{"title":"Backend with Node.js & Databases","description":"Full-stack API development","topics":["Express.js Routing & Middleware","RESTful API Design Principles","MongoDB Schemas & Aggregation","PostgreSQL Relationships & Joins","JWT Authentication & Authorization","Deployment with Docker & Vercel"]}]',
  true, true
),
-- 2. Backend Development
(
  'backend-development',
  'Backend Development Mastery',
  'Build scalable server-side applications',
  'Master backend engineering with Node.js, Python, and Go. Design RESTful and GraphQL APIs, work with SQL and NoSQL databases, implement authentication, caching, message queues, and deploy on cloud infrastructure. Learn microservices architecture, containerization with Docker, orchestration with Kubernetes, and monitoring with Prometheus and Grafana.',
  null, null,
  (select id from backend_id),
  4.6, 89, 0, '6 months', 'Online', 'Active',
  '[{"title":"Server-Side Programming","description":"Core backend languages","topics":["Node.js Event Loop & Streams","Python FastAPI Framework","Go Concurrency Patterns","TypeScript for Backend","Error Handling & Logging","Performance Optimization"]},{"title":"Database Design & Management","description":"Data storage and querying","topics":["PostgreSQL Advanced Queries","MongoDB Aggregation Pipeline","Redis Caching Strategies","Database Indexing & Performance","ACID Transactions & Migrations","Prisma & TypeORM ORMs"]},{"title":"API Development","description":"Building robust APIs","topics":["RESTful API Best Practices","GraphQL Schema Design","API Versioning Strategies","OpenAPI / Swagger Documentation","Rate Limiting & Throttling","WebSocket Real-Time Communication"]},{"title":"DevOps & Deployment","description":"Production-ready deployment","topics":["Docker Multi-Stage Builds","Kubernetes Pods & Services","CI/CD with GitHub Actions","Nginx Reverse Proxy & SSL","Cloud Deployment (AWS EC2)","Application Monitoring"]}]',
  true, true
),
-- 3. Machine Learning
(
  'machine-learning',
  'Machine Learning & AI Engineering',
  'Build intelligent systems that learn from data',
  'Dive deep into machine learning algorithms, neural networks, and artificial intelligence. Cover supervised and unsupervised learning, deep learning with TensorFlow and PyTorch, NLP, computer vision, and MLOps. Work on real-world datasets and deploy models to production. Learn feature engineering, model selection, hyperparameter tuning, and deployment pipelines.',
  null, null,
  (select id from aiml_id),
  4.7, 210, 0, '8 months', 'Online', 'Active',
  '[{"title":"Python for Machine Learning","description":"Essential Python skills","topics":["NumPy Array Operations","Pandas Data Manipulation","Matplotlib & Seaborn Visualization","Scikit-learn Overview","Jupyter Notebook Workflow","Data Cleaning & Preprocessing"]},{"title":"Supervised Learning","description":"Predictive modeling","topics":["Linear & Logistic Regression","Decision Trees & Random Forests","Support Vector Machines","Gradient Boosting (XGBoost)","Feature Selection Techniques","Cross-Validation & Hyperparameter Tuning"]},{"title":"Deep Learning & Neural Networks","description":"Advanced neural architectures","topics":["Neural Network Fundamentals","CNNs for Image Recognition","RNNs & LSTMs for Sequences","Transfer Learning","TensorFlow & Keras","PyTorch Fundamentals"]},{"title":"MLOps & Deployment","description":"Production machine learning","topics":["ML Pipeline Automation","Model Versioning with DVC","Docker for ML Models","FastAPI Model Serving","Monitoring & Drift Detection","A/B Testing for ML"]}]',
  true, true
),
-- 4. Data Analysis
(
  'data-analysis',
  'Data Analytics & Visualization Professional',
  'Turn raw data into actionable insights',
  'Learn to collect, clean, analyze, and visualize data using industry-standard tools. Master Excel, SQL, Python, Tableau, and Power BI. Build dashboards, create reports, and communicate data-driven stories. Cover statistical analysis, A/B testing, data warehousing concepts, and business intelligence tools.',
  null, null,
  (select id from datasci_id),
  4.5, 310, 0, '6 months', 'Online', 'Active',
  '[{"title":"Excel & Spreadsheet Analysis","description":"Foundation of data analysis","topics":["Pivot Tables & Charts","VLOOKUP, INDEX-MATCH","Power Query for Data Transformation","What-If Analysis","Macros & VBA Basics","Data Validation & Conditional Formatting"]},{"title":"SQL for Data Analysis","description":"Querying databases","topics":["SELECT, WHERE & JOINs","GROUP BY & Aggregations","Window Functions","CTEs & Subqueries","Query Optimization","Database Design Basics"]},{"title":"Python for Data Analysis","description":"Programmatic analysis","topics":["Pandas DataFrames","Data Cleaning with Pandas","Exploratory Data Analysis","Statistical Analysis with SciPy","Time Series Analysis","Data Visualization with Seaborn"]},{"title":"BI Tools & Dashboards","description":"Visual storytelling","topics":["Tableau Desktop & Prep","Power BI DAX Formulas","Interactive Dashboard Design","KPI Tracking & Metrics","Report Automation","Data Storytelling Best Practices"]}]',
  true, true
),
-- 5. Cloud Architecture
(
  'cloud-architecture',
  'AWS, Azure & GCP Cloud Architecture',
  'Become a cloud architect proficient in AWS, Azure, and GCP',
  'Learn compute, storage, networking, security, and cost optimization across the three major cloud providers. Design highly available, fault-tolerant, and scalable architectures. Prepare for AWS Solutions Architect, Azure Solutions Architect, and Google Cloud Architect certifications. Master infrastructure as code with Terraform and CloudFormation.',
  null, null,
  (select id from cloud_id),
  4.5, 167, 0, '6 months', 'Online', 'Active',
  '[{"title":"Cloud Fundamentals","description":"Core cloud concepts","topics":["Cloud Deployment Models","AWS Global Infrastructure","Azure Regions & Availability Zones","GCP Projects & Resources","IAM Policies & Roles","Cost Management & Budgeting"]},{"title":"Compute & Storage","description":"Core services","topics":["EC2, VM Instances & Compute Engine","S3, Blob Storage & Cloud Storage","Lambda, Functions & Cloud Run","Load Balancers & Auto Scaling","CDN with CloudFront","Database Services (RDS, Aurora, Cloud SQL)"]},{"title":"Networking & Security","description":"Connectivity and protection","topics":["VPC Design & Subnetting","Security Groups & NACLs","DNS with Route53 & Cloud DNS","VPN & Direct Connect","WAF & DDoS Protection","Secret Management"]},{"title":"Infrastructure as Code","description":"Automated provisioning","topics":["Terraform State Management","AWS CloudFormation","Azure ARM Templates","CI/CD for Infrastructure","Configuration Drift Detection","Multi-Cloud Strategies"]}]',
  true, false
),
-- 6. Ethical Hacking
(
  'ethical-hacking',
  'Ethical Hacking & Penetration Testing',
  'Master offensive security and defend against cyber threats',
  'Learn ethical hacking methodologies, penetration testing tools, and vulnerability assessment techniques. Cover network scanning, exploitation, web application security, wireless hacking, social engineering, and reporting. Prepare for CEH, OSCP, and CompTIA Security+ certifications. Practice in virtual labs and real-world scenarios.',
  null, null,
  (select id from cybersec_id),
  4.6, 95, 0, '7 months', 'Online', 'Active',
  '[{"title":"Networking & Security Fundamentals","description":"Foundations of cybersecurity","topics":["TCP/IP & OSI Model","Subnetting & Network Protocols","Firewalls & IDS/IPS","Cryptography Basics","PKI & Certificate Management","Security Policies & Compliance"]},{"title":"Reconnaissance & Scanning","description":"Information gathering","topics":["OSINT Techniques","Nmap Network Scanning","Vulnerability Scanning with Nessus","Enumeration Techniques","Service Fingerprinting","Network Mapping"]},{"title":"Exploitation & Post-Exploitation","description":"Gaining and maintaining access","topics":["Metasploit Framework","Web Application Exploitation","SQL Injection & XSS","Buffer Overflow Attacks","Privilege Escalation","Pivoting & Lateral Movement"]},{"title":"Web Application Security","description":"Securing web apps","topics":["OWASP Top 10","Burp Suite Proxy","Authentication & Session Attacks","API Security Testing","Container Security","Report Writing & Remediation"]}]',
  true, true
),
-- 7. Unity Game Development
(
  'unity-game-development',
  'Unity 2D & 3D Game Development',
  'Learn game development with Unity engine',
  'Cover C# programming, 2D and 3D game mechanics, physics, animations, audio, and publishing to multiple platforms. Build complete games from scratch including platformers, shooters, and RPGs. Learn game design principles, asset management, optimization, and monetization strategies. Publish your games to PC, mobile, and console.',
  null, null,
  (select id from gamedev_id),
  4.5, 73, 0, '6 months', 'Online', 'Active',
  '[{"title":"C# for Game Development","description":"Programming fundamentals","topics":["Variables, Data Types & Methods","OOP: Classes & Inheritance","Collections & LINQ","Coroutines & Async","File I/O & Serialization","Debugging & Profiling"]},{"title":"Unity Editor & Workflow","description":"Master the Unity interface","topics":["Scene Management & Prefabs","Physics & Collision Detection","Animation System & Animator","UI Toolkit & Canvas","Lighting & Post-Processing","Audio Mixer & Spatial Sound"]},{"title":"2D Game Development","description":"Build 2D games","topics":["Sprite Sheets & Tilemaps","2D Physics & Colliders","Parallax Scrolling","2D Pathfinding","Mobile Touch Input","2D Particle Effects"]},{"title":"3D Game Development","description":"Build 3D games","topics":["3D Models & Materials","Terrain Generation","Third-Person Controller","AI Navigation & NavMesh","Lightmapping & Baked Lighting","Build Settings & Platform Optimization"]}]',
  true, true
),
-- 8. UPSC Coaching
(
  'upsc-coaching',
  'UPSC Civil Services Comprehensive Coaching',
  'Complete preparation for UPSC Prelims, Mains, and Interview',
  'Targeted preparation for UPSC Civil Services Examination. Cover General Studies papers, CSAT, optional subject, and interview preparation. Includes current affairs analysis, answer writing practice, mock tests, and personalized mentorship. Access to comprehensive study material, video lectures, and regular doubt-clearing sessions.',
  null, null,
  (select id from upsc_id),
  4.6, 520, 0, '12 months', 'Online', 'Active',
  '[{"title":"General Studies Paper I","description":"Indian heritage, history, geography, society","topics":["Ancient & Medieval Indian History","Modern Indian Freedom Struggle","World History & International Relations","Physical & Human Geography","Indian Society & Social Issues","Art & Culture of India"]},{"title":"General Studies Paper II","description":"Governance, constitution, polity, social justice","topics":["Indian Constitution & Federal System","Parliament & State Legislatures","Judiciary & Constitutional Bodies","Governance & Administration","Social Justice & Welfare Schemes","International Relations"]},{"title":"General Studies Paper III","description":"Economy, environment, security, technology","topics":["Indian Economy & Planning","Agriculture & Food Security","Environment & Ecology","Disaster Management","Internal Security & Cyber Threats","Science & Technology"]},{"title":"General Studies Paper IV","description":"Ethics, integrity, aptitude","topics":["Ethical Theories & Thinkers","Civil Service Values & Code of Ethics","Case Study Analysis","Attitude & Emotional Intelligence","Public Service Motivation","Administrative Ethics & Probity"]},{"title":"CSAT & Interview","description":"Aptitude and personality test","topics":["Comprehension & Interpersonal Skills","Logical Reasoning & Analytical Ability","Data Interpretation & Charts","Decision Making & Problem Solving","Interview Preparation","DAF & Mock Interviews"]}]',
  true, true
),
-- 9. SSC Coaching
(
  'ssc-coaching',
  'SSC CGL & CHSL Competitive Exam Prep',
  'Complete preparation for SSC CGL, CHSL, MTS, and GD exams',
  'Comprehensive coaching for SSC examinations. Cover Quantitative Aptitude, Reasoning, English Language, General Awareness, and Computer Knowledge. Regular mock tests, daily current affairs quizzes, and doubt-clearing sessions. Access to recorded lectures, study PDFs, and previous year question papers with detailed solutions.',
  null, null,
  (select id from ssc_id),
  4.5, 340, 0, '8 months', 'Online', 'Active',
  '[{"title":"Quantitative Aptitude","description":"Mathematics & numerical ability","topics":["Number System & Simplification","Percentage, Profit & Loss","Ratio, Proportion & Mixtures","Time, Speed & Distance","Geometry & Mensuration","Data Interpretation"]},{"title":"Reasoning Ability","description":"Logical & analytical reasoning","topics":["Analogies & Classification","Coding-Decoding & Blood Relations","Syllogism & Venn Diagrams","Seating Arrangement & Puzzles","Statement & Assumptions","Non-Verbal Reasoning"]},{"title":"English Language","description":"Grammar, vocabulary & comprehension","topics":["Grammar Rules & Sentence Correction","Vocabulary & Idioms","Reading Comprehension","Cloze Test & Para Jumbles","Error Spotting & Fillers","Essay & Letter Writing"]},{"title":"General Awareness","description":"Static GK & current affairs","topics":["Indian History & Constitution","Geography & Environment","Science & Technology","Economics & Budget","Sports & Awards","Daily Current Affairs 2026"]}]',
  true, false
),
-- 10. Banking Exams
(
  'banking-exams',
  'IBPS PO & SBI Clerk Banking Exams',
  'Targeted preparation for IBPS PO, SBI Clerk, and other banking exams',
  'Cover Quantitative Aptitude, Reasoning, English, General Awareness, and Computer Knowledge with regular mock tests. Special focus on banking awareness, financial systems, and economic concepts. Access to sectional tests, full-length mocks, and personalized performance analysis with AI-driven recommendations.',
  null, null,
  (select id from banking_id),
  4.5, 410, 0, '8 months', 'Online', 'Active',
  '[{"title":"Quantitative Aptitude for Banking","description":"Banking math & calculations","topics":["Simplification & Approximation","Number Series & Quadratic Eq","Data Interpretation (Tables, Graphs)","Simple & Compound Interest","Permutation, Combination & Probability","Profit, Loss & Discount"]},{"title":"Reasoning for Banking","description":"Logical reasoning for bank exams","topics":["Inequality & Coded Inequalities","Syllogism (New Pattern)","Circular & Linear Arrangement","Puzzle & Input-Output","Data Sufficiency","Logical Reasoning (Statements)"]},{"title":"English for Banking","description":"Banking English proficiency","topics":["Reading Comprehension (Banking)","Cloze Test & Error Spotting","Phrase Replacement & Para Jumbles","Vocabulary for Banking Exams","Descriptive Letter & Essay","Grammar for Competitive Exams"]},{"title":"General & Banking Awareness","description":"Financial & banking knowledge","topics":["Banking System & RBI Functions","Financial Markets & Instruments","Government Schemes 2026","Budget & Economic Survey","Computer Awareness for Banking","Insurance & Financial Awareness"]}]',
  true, true
);

-- Step 5: Get all course IDs
with
course_ids as (select id, slug from courses),
fs_id as (select id from course_ids where slug = 'full-stack-web-development'),
be_id as (select id from course_ids where slug = 'backend-development'),
ml_id as (select id from course_ids where slug = 'machine-learning'),
da_id as (select id from course_ids where slug = 'data-analysis'),
ca_id as (select id from course_ids where slug = 'cloud-architecture'),
eh_id as (select id from course_ids where slug = 'ethical-hacking'),
gd_id as (select id from course_ids where slug = 'unity-game-development'),
up_id as (select id from course_ids where slug = 'upsc-coaching'),
ss_id as (select id from course_ids where slug = 'ssc-coaching'),
be_id2 as (select id from course_ids where slug = 'banking-exams')

-- Highlights
-- ==========================================
insert into highlights (course_id, icon, label, sort_order)
-- Full Stack Web Dev
select id, 'layers', 'Full Stack Curriculum', 0 from fs_id union all
select id, 'briefcase', 'Job-Ready Portfolio', 1 from fs_id union all
select id, 'zap', 'Live Projects', 2 from fs_id union all
select id, 'award', 'Industry Certification', 3 from fs_id
union all
-- Backend
select id, 'database', 'Database Design', 0 from be_id union all
select id, 'shield', 'API Security', 1 from be_id union all
select id, 'cpu', 'Microservices', 2 from be_id union all
select id, 'trending', 'Performance Tuning', 3 from be_id
union all
-- ML
select id, 'cpu', 'Deep Learning', 0 from ml_id union all
select id, 'layers', 'TensorFlow & PyTorch', 1 from ml_id union all
select id, 'zap', 'MLOps Pipeline', 2 from ml_id union all
select id, 'award', 'Industry Projects', 3 from ml_id
union all
-- Data Analysis
select id, 'layers', 'SQL & Python', 0 from da_id union all
select id, 'briefcase', 'BI Dashboard', 1 from da_id union all
select id, 'trending', 'Statistical Analysis', 2 from da_id union all
select id, 'award', 'Tableau Certification', 3 from da_id
union all
-- Cloud
select id, 'globe', 'Multi-Cloud Skills', 0 from ca_id union all
select id, 'shield', 'Cloud Security', 1 from ca_id union all
select id, 'database', 'IaC with Terraform', 2 from ca_id union all
select id, 'award', '3 Cloud Certifications', 3 from ca_id
union all
-- Ethical Hacking
select id, 'shield', 'CEH & OSCP Prep', 0 from eh_id union all
select id, 'zap', 'Live Labs', 1 from eh_id union all
select id, 'layers', 'Web App Security', 2 from eh_id union all
select id, 'award', 'Bug Bounty Experience', 3 from eh_id
union all
-- Game Dev
select id, 'cpu', 'C# Programming', 0 from gd_id union all
select id, 'layers', 'Unity Engine Mastery', 1 from gd_id union all
select id, 'star', '2D & 3D Games', 2 from gd_id union all
select id, 'award', 'Portfolio of 5+ Games', 3 from gd_id
union all
-- UPSC
select id, 'book', 'Comprehensive Study Material', 0 from up_id union all
select id, 'zap', 'Answer Writing Practice', 1 from up_id union all
select id, 'message', 'Personal Mentorship', 2 from up_id union all
select id, 'trending', 'Current Affairs Deep Dive', 3 from up_id
union all
-- SSC
select id, 'book', 'Topic-Wise Study Notes', 0 from ss_id union all
select id, 'video', 'Recorded Video Lectures', 1 from ss_id union all
select id, 'zap', 'Weekly Mock Tests', 2 from ss_id union all
select id, 'trending', 'Previous Year Papers', 3 from ss_id
union all
-- Banking
select id, 'book', 'Sectional Test Series', 0 from be_id2 union all
select id, 'zap', 'AI Performance Analysis', 1 from be_id2 union all
select id, 'video', 'Banking Awareness Focus', 2 from be_id2 union all
select id, 'trending', 'Current Affairs Quiz', 3 from be_id2;

-- Projects (only for software learning courses)
-- ==========================================
do $$
declare
  fs_id uuid; be_id uuid; ml_id uuid; da_id uuid;
  ca_id uuid; eh_id uuid; gd_id uuid;
begin
  select id into fs_id from courses where slug = 'full-stack-web-development';
  select id into be_id from courses where slug = 'backend-development';
  select id into ml_id from courses where slug = 'machine-learning';
  select id into da_id from courses where slug = 'data-analysis';
  select id into ca_id from courses where slug = 'cloud-architecture';
  select id into eh_id from courses where slug = 'ethical-hacking';
  select id into gd_id from courses where slug = 'unity-game-development';

  insert into projects (course_id, title, description, sort_order) values
  (fs_id, 'E-Commerce Platform', 'Build a full-stack e-commerce platform with React frontend, Node.js/Express backend, PostgreSQL database, and Stripe payment integration. Deploy on Vercel and Railway.', 0),
  (fs_id, 'Social Media Dashboard', 'Create a real-time social media analytics dashboard with dynamic charts, user authentication, and role-based access control.', 1),
  (be_id, 'RESTful API Gateway', 'Design and implement a scalable API gateway with rate limiting, caching, authentication, and documentation using OpenAPI.', 0),
  (be_id, 'Real-Time Chat Service', 'Build a WebSocket-based real-time chat application with message persistence, user presence, and file sharing.', 1),
  (ml_id, 'Image Classification Engine', 'Train a CNN model to classify images into 100+ categories using transfer learning. Deploy with FastAPI and Docker.', 0),
  (ml_id, 'Recommendation System', 'Build a collaborative filtering recommendation engine for an e-commerce platform using matrix factorization techniques.', 1),
  (da_id, 'Sales Analytics Dashboard', 'Create an interactive Tableau dashboard analyzing 5 years of sales data with forecasting, trend analysis, and KPI tracking.', 0),
  (da_id, 'Customer Segmentation Report', 'Perform RFM analysis and K-means clustering to segment customers. Present insights in a Power BI report.', 1),
  (ca_id, 'Multi-Cloud Infrastructure Pipeline', 'Design a Terraform pipeline that provisions identical infrastructure across AWS, Azure, and GCP with cost optimization.', 0),
  (ca_id, 'Serverless Image Processing App', 'Build a serverless application using Lambda, S3, and API Gateway for automated image resizing and format conversion.', 1),
  (eh_id, 'Vulnerability Assessment Lab', 'Set up a complete penetration testing lab with Metasploitable, DVWA, and custom vulnerable web applications.', 0),
  (eh_id, 'Web Application Security Audit', 'Perform a comprehensive security audit on a sample web application, document findings, and provide remediation recommendations.', 1),
  (gd_id, '2D Platformer Game', 'Build a complete 2D platformer with multiple levels, enemy AI, collectibles, and boss battles.', 0),
  (gd_id, '3D First-Person Explorer', 'Create an immersive 3D exploration game with dynamic lighting, interactive objects, and environmental storytelling.', 1);
end $$;

-- Certifications
-- ==========================================
insert into certifications (course_id, description, image_url, certificate_image_url, recognized_companies)
select id, 'Certified Full Stack Developer. Validates proficiency in React, Node.js, PostgreSQL, and modern web development practices.', null, null, '["Google","Microsoft","Amazon"]'::jsonb
from courses where slug = 'full-stack-web-development';

insert into certifications (course_id, description, image_url, certificate_image_url, recognized_companies)
select id, 'Certified Backend Engineer. Recognizes deep expertise in server-side architecture, API design, and database management.', null, null, '["Amazon","Netflix","Spotify"]'::jsonb
from courses where slug = 'backend-development';

insert into certifications (course_id, description, image_url, certificate_image_url, recognized_companies)
select id, 'Machine Learning Engineer Certification. Validates skills in ML algorithms, deep learning, and model deployment.', null, null, '["Google DeepMind","OpenAI","Meta AI"]'::jsonb
from courses where slug = 'machine-learning';

insert into certifications (course_id, description, image_url, certificate_image_url, recognized_companies)
select id, 'Certified Data Analyst. Recognizes proficiency in SQL, Python, Tableau, and business intelligence.', null, null, '["Deloitte","KPMG","McKinsey"]'::jsonb
from courses where slug = 'data-analysis';

insert into certifications (course_id, description, image_url, certificate_image_url, recognized_companies)
select id, 'Multi-Cloud Architect Certification. Validates architecture skills across AWS, Azure, and GCP.', null, null, '["AWS","Microsoft","Google Cloud"]'::jsonb
from courses where slug = 'cloud-architecture';

insert into certifications (course_id, description, image_url, certificate_image_url, recognized_companies)
select id, 'Certified Ethical Hacker. Recognizes penetration testing, vulnerability assessment, and security audit skills.', null, null, '["CrowdStrike","Palo Alto Networks","Kaspersky"]'::jsonb
from courses where slug = 'ethical-hacking';

insert into certifications (course_id, description, image_url, certificate_image_url, recognized_companies)
select id, 'Unity Certified Developer. Validates game development skills including C#, 2D/3D mechanics, and multiplatform publishing.', null, null, '["Unity Technologies","Ubisoft","Electronic Arts"]'::jsonb
from courses where slug = 'unity-game-development';

-- FAQs
-- ==========================================
do $$
declare
  fs_id uuid; be_id uuid; ml_id uuid; da_id uuid;
  ca_id uuid; eh_id uuid; gd_id uuid;
  up_id uuid; ss_id uuid; be2_id uuid;
begin
  select id into fs_id from courses where slug = 'full-stack-web-development';
  select id into be_id from courses where slug = 'backend-development';
  select id into ml_id from courses where slug = 'machine-learning';
  select id into da_id from courses where slug = 'data-analysis';
  select id into ca_id from courses where slug = 'cloud-architecture';
  select id into eh_id from courses where slug = 'ethical-hacking';
  select id into gd_id from courses where slug = 'unity-game-development';
  select id into up_id from courses where slug = 'upsc-coaching';
  select id into ss_id from courses where slug = 'ssc-coaching';
  select id into be2_id from courses where slug = 'banking-exams';

  insert into faqs (course_id, question, answer, sort_order) values
  -- Full Stack
  (fs_id, 'Do I need prior coding experience?', 'Basic familiarity with HTML and JavaScript is helpful but not required. The course starts with fundamentals and progresses to advanced topics.', 0),
  (fs_id, 'What projects will I build?', 'You will build an e-commerce platform and a social media dashboard, both deployable to production. These projects are designed to showcase your skills to employers.', 1),
  (fs_id, 'Is this course suitable for working professionals?', 'Yes, the course is self-paced with approximately 15-20 hours of commitment per week. You can access all materials anytime.', 2),
  -- Backend
  (be_id, 'Which languages are covered?', 'The course covers Node.js (TypeScript), Python (FastAPI), and Go. You will learn the strengths of each and when to use them.', 0),
  (be_id, 'Will I learn cloud deployment?', 'Yes, the course includes Docker, Kubernetes, and deployment on AWS ECS and Google Cloud Run.', 1),
  -- ML
  (ml_id, 'What math background is needed?', 'Basic understanding of linear algebra and calculus is recommended. We provide review materials for the mathematical concepts used.', 0),
  (ml_id, 'Will I work with real datasets?', 'Yes, you will work with real-world datasets from Kaggle, UCI repository, and industry partners. All data is sanitized for privacy.', 1),
  (ml_id, 'Do I need a GPU?', 'We provide access to cloud GPU resources (Google Colab Pro) for deep learning exercises. A standard laptop is sufficient for the ML fundamentals portion.', 2),
  -- Data Analysis
  (da_id, 'Which tools will I learn?', 'Excel, SQL, Python (Pandas, Matplotlib, Seaborn), Tableau, and Power BI. You will be proficient in all major data tools by the end.', 0),
  (da_id, 'Is Tableau license included?', 'Tableau Public is free and sufficient for the course. For Power BI, a free desktop version is available on Windows.', 1),
  -- Cloud
  (ca_id, 'Do I need to sign up for cloud providers?', 'Yes, you will need free-tier accounts for AWS, Azure, and GCP. The course is designed to stay within free tier limits throughout.', 0),
  (ca_id, 'Which certification does this prepare for?', 'The course prepares you for AWS Solutions Architect Associate, Azure Solutions Architect, and Google Cloud Architect certifications.', 1),
  -- Ethical Hacking
  (eh_id, 'Is this course legal?', 'Yes, all techniques are taught in an ethical context. You will practice in provided virtual labs and authorized testing environments only.', 0),
  (eh_id, 'What certifications does this prepare me for?', 'This course prepares you for CEH (Certified Ethical Hacker), OSCP (Offensive Security), and CompTIA Security+ certifications.', 1),
  -- Game Dev
  (gd_id, 'Do I need prior programming experience?', 'Some programming experience is helpful but not required. The C# section starts from basics and builds up to game development.', 0),
  (gd_id, 'Can I publish games on mobile?', 'Yes, the course covers build settings and optimization for Android and iOS platforms.', 1),
  (gd_id, 'What version of Unity will I use?', 'The course uses Unity 6 LTS, the latest stable release. All materials are updated for the current version.', 2),
  -- UPSC
  (up_id, 'Is this course for both Prelims and Mains?', 'Yes, the course comprehensively covers Prelims, Mains, and Interview preparation. Separate modules for each stage with focused strategies.', 0),
  (up_id, 'How are current affairs covered?', 'Daily current affairs summaries, weekly quizzes, monthly magazines, and special sessions for budget, economic survey, and government schemes.', 1),
  (up_id, 'Do you provide answer evaluation?', 'Yes, you get 50+ Mains answer writing practice sessions with detailed evaluation by experienced mentors and topper copies.', 2),
  (up_id, 'What optional subjects are available?', 'We offer guidance for Sociology, Geography, Public Administration, History, and Political Science. Additional subjects can be requested.', 3),
  -- SSC
  (ss_id, 'Which exams is this course for?', 'The course covers SSC CGL (Tier I & II), CHSL, MTS, and GD exams. Separate dedicated modules for each examination pattern.', 0),
  (ss_id, 'Are mock tests included?', 'Yes, you get 50+ full-length mock tests and 200+ sectional tests with detailed solutions and performance analytics.', 1),
  -- Banking
  (be2_id, 'Which banking exams are covered?', 'IBPS PO, IBPS Clerk, SBI PO, SBI Clerk, RBI Grade B, and other major banking exams. The syllabus is mapped to each exam pattern.', 0),
  (be2_id, 'How is the test series structured?', 'You get 60+ full-length mocks, 300+ sectional tests, and daily current affairs quizzes with AI-powered performance analysis and improvement suggestions.', 1),
  (be2_id, 'Is there a descriptive English module?', 'Yes, we cover letter writing, essay writing, and precis writing for the descriptive English section of IBPS PO and SBI PO Mains.', 2);
end $$;

-- Course Tabs (4 tabs each: overview, syllabus, pricing, apply_now)
-- ==========================================
do $$
declare
  c record;
  cid uuid;
begin
  for c in select id, slug from courses loop
    cid := c.id;

    -- Tab 1: Overview (type: overview)
    insert into course_tabs (course_id, label, content_type, content, sort_order) values
    (cid, 'Overview', 'overview',
      jsonb_build_object(
        'heading', 'Why Choose This Course?',
        'paragraph', 'This comprehensive program is designed by industry experts to take you from fundamentals to job-ready proficiency. With hands-on projects, personalized mentorship, and a curriculum aligned with current industry demands, you will gain the practical skills employers are looking for.',
        'subheading', 'What You Will Learn',
        'qa', jsonb_build_array(
          jsonb_build_object('question', 'Is this suitable for beginners?', 'answers', jsonb_build_array('Yes, the course starts from fundamentals and progresses to advanced topics. No prior experience is required for most modules.')),
          jsonb_build_object('question', 'How long will it take to complete?', 'answers', jsonb_build_array('The course is designed for 6-8 months at 15-20 hours per week. You can go at your own pace with lifetime access to materials.')),
          jsonb_build_object('question', 'What support is available?', 'answers', jsonb_build_array('You get 1:1 mentorship sessions, community forum access, and weekly doubt-clearing webinars.'))
        )
      ),
    0);

    -- Tab 2: Syllabus (type: syllabus)
    insert into course_tabs (course_id, label, content_type, content, sort_order) values
    (cid, 'Syllabus', 'syllabus',
      jsonb_build_object(
        'heading', 'Complete Syllabus Overview',
        'paragraph', 'Our curriculum is structured into comprehensive modules, each designed to build upon the previous one. Every module includes theory, practical exercises, and real-world case studies to ensure deep understanding.',
        'subheading', 'Module Breakdown',
        'qa', jsonb_build_array(
          jsonb_build_object('question', 'How are modules structured?', 'answers', jsonb_build_array('Each module has video lectures, reading materials, practice exercises, and a mini-project to reinforce learning.')),
          jsonb_build_object('question', 'Are there assessments?', 'answers', jsonb_build_array('Yes, each module ends with a quiz and practical assignment. There are mid-term and final capstone projects.')),
          jsonb_build_object('question', 'Can I skip modules I already know?', 'answers', jsonb_build_array('Yes, you can test out of modules by passing an assessment. We will help you identify which modules to skip.'))
        )
      ),
    1);

    -- Tab 3: Pricing (type: pricing)
    insert into course_tabs (course_id, label, content_type, content, sort_order) values
    (cid, 'Pricing', 'pricing',
      jsonb_build_object(
        'heading', 'Flexible Pricing Plans',
        'paragraph', 'Choose the plan that best fits your learning needs and budget. All plans include lifetime access to course materials, community support, and regular updates.',
        'text', E'Self-Paced Plan — ₹9,999\n• Full course access for 12 months\n• All video lectures & study materials\n• Community forum access\n• 5 mock tests\n\nMentorship Plan — ₹24,999\n• Everything in Self-Paced\n• 1:1 mentor sessions (12 sessions)\n• Weekly doubt-clearing webinars\n• Resume & portfolio review\n• 20 mock tests with evaluation\n\nPro Plan — ₹49,999\n• Everything in Mentorship\n• Unlimited 1:1 mentor access\n• Guaranteed internship placement\n• Interview preparation & mock interviews\n• All certifications & projects\n• 100+ mock tests\n\nEMI options starting at ₹833/month'
      ),
    2);

    -- Tab 4: Apply Now (type: apply_now)
    insert into course_tabs (course_id, label, content_type, content, sort_order) values
    (cid, 'Apply Now', 'apply_now',
      jsonb_build_object(
        'heading', 'Start Your Learning Journey Today',
        'paragraph', 'Take the first step toward mastering in-demand skills and advancing your career. Our next batch starts soon with limited seats available.',
        'text', E'How to Apply:\n\n1. Fill out the online application form\n2. Our academic team will review your profile\n3. Schedule a free counseling session\n4. Complete enrollment & start learning\n\nAdmission Requirements:\n• Basic computer literacy\n• A laptop/desktop with internet connection\n• Strong motivation to learn\n\nNext Batch Start Dates:\n• July 15, 2026\n• August 1, 2026\n• September 5, 2026\n\nScholarships available for deserving candidates. Contact our admissions team for more information.'
      ),
    3);

  end loop;
end $$;

-- Course Tags
-- ==========================================
do $$
declare
  tid uuid;
begin
  -- Full Stack Web Development
  select id into tid from tags where name = 'full-stack-development';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'full-stack-web-development';
  select id into tid from tags where name = 'react';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'full-stack-web-development';
  select id into tid from tags where name = 'nodejs';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'full-stack-web-development';

  -- Backend Development
  select id into tid from tags where name = 'backend';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'backend-development';
  select id into tid from tags where name = 'python';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'backend-development';
  select id into tid from tags where name = 'apis';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'backend-development';

  -- Machine Learning
  select id into tid from tags where name = 'machine-learning';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'machine-learning';
  select id into tid from tags where name = 'ai';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'machine-learning';
  select id into tid from tags where name = 'python-ml';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'machine-learning';

  -- Data Analysis
  select id into tid from tags where name = 'data-analysis';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'data-analysis';
  select id into tid from tags where name = 'sql';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'data-analysis';
  select id into tid from tags where name = 'visualization';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'data-analysis';

  -- Cloud Architecture
  select id into tid from tags where name = 'cloud-computing';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'cloud-architecture';
  select id into tid from tags where name = 'aws';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'cloud-architecture';
  select id into tid from tags where name = 'azure';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'cloud-architecture';

  -- Ethical Hacking
  select id into tid from tags where name = 'cybersecurity';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'ethical-hacking';
  select id into tid from tags where name = 'ethical-hacking';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'ethical-hacking';
  select id into tid from tags where name = 'penetration-testing';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'ethical-hacking';

  -- Unity Game Dev
  select id into tid from tags where name = 'game-development';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'unity-game-development';
  select id into tid from tags where name = 'unity';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'unity-game-development';
  select id into tid from tags where name = 'csharp';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'unity-game-development';

  -- UPSC
  select id into tid from tags where name = 'upsc';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'upsc-coaching';
  select id into tid from tags where name = 'general-studies';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'upsc-coaching';
  select id into tid from tags where name = 'competitive-exams';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'upsc-coaching';

  -- SSC
  select id into tid from tags where name = 'ssc';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'ssc-coaching';
  select id into tid from tags where name = 'quantitative-aptitude';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'ssc-coaching';
  select id into tid from tags where name = 'reasoning';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'ssc-coaching';

  -- Banking
  select id into tid from tags where name = 'banking-exams';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'banking-exams';
  select id into tid from tags where name = 'ibps';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'banking-exams';
  select id into tid from tags where name = 'sbi';
  insert into course_tags (course_id, tag_id) select id, tid from courses where slug = 'banking-exams';
end $$;
