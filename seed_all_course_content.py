"""
Seed ALL content fields for ALL 24 existing courses.
Populates: highlights, course_fees, projects, certifications, faqs, overview_faqs
Also updates courses table fields (hero_image_url, video_url, etc.).

Usage: python3 seed_all_course_content.py
"""

import requests, json, sys, time

URL = "https://nxlsxywqvvuiljsulito.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA"
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def get(path):
    r = requests.get(f"{URL}{path}", headers=H); r.raise_for_status(); return r.json()

def post(path, data):
    r = requests.post(f"{URL}{path}", headers={**H, "Prefer": "return=representation"}, json=data)
    if r.status_code >= 400: print(f"  POST ERR {r.status_code}: {r.text[:200]}", file=sys.stderr); return None
    return r.json()

def patch(path, data):
    r = requests.patch(f"{URL}{path}", headers={**H, "Prefer": "return=minimal"}, json=data)
    if r.status_code >= 400: print(f"  PATCH ERR {r.status_code}: {r.text[:200]}", file=sys.stderr); return False
    return True

def delete(path):
    r = requests.delete(f"{URL}{path}", headers=H)
    if r.status_code >= 400: print(f"  DEL ERR {r.status_code}: {r.text[:120]}", file=sys.stderr)

def delete_by_course(table, course_id):
    items = get(f"/rest/v1/{table}?course_id=eq.{course_id}&select=id")
    for item in items:
        delete(f"/rest/v1/{table}?id=eq.{item['id']}")
    return len(items)

VIDEOS = [
    "https://www.youtube.com/watch?v=9J7VwqCpxiY",
    "https://www.youtube.com/watch?v=6icT3M5Hc3k",
    "https://www.youtube.com/watch?v=G3e-cpL7ofc",
    "https://www.youtube.com/watch?v=T7bxY4F2gvs",
    "https://www.youtube.com/watch?v=8jLOx1hDBlw",
    "https://www.youtube.com/watch?v=3nQ3xI3WlXo",
]
UNSPLASH = "https://images.unsplash.com/photo"

COURSES = [
    # ── 1. Programming Fundamentals ──
    {
        "slug": "programming-fundamentals",
        "title": "Programming Fundamentals",
        "subtitle": "Start your coding journey from zero",
        "description": "A comprehensive introduction to programming using Python and JavaScript. Covers variables, control flow, functions, data structures, OOP, and basic algorithms. No prior experience needed.",
        "duration": "3 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1461749280684-dccba630e2f6?w=800",
        "video_url": VIDEOS[0],
        "video_thumbnail_url": "https://img.youtube.com/vi/9J7VwqCpxiY/maxresdefault.jpg",
        "checklist_items": ["Write your first Python & JS programs", "Master variables, loops, and functions", "Build projects like a calculator & to-do app", "Prepare for advanced programming courses"],
        "curriculum": [
            {"title":"Python Basics","topics":["Variables & Data Types","Control Flow (if/else)","Loops (for/while)","Functions & Scope"]},
            {"title":"Data Structures","topics":["Lists & Tuples","Dictionaries & Sets","Strings & Methods","List Comprehensions"]},
            {"title":"OOP & Modules","topics":["Classes & Objects","Inheritance","Modules & Packages","File I/O"]},
            {"title":"JavaScript Intro","topics":["JS Syntax","DOM Manipulation","Events","Simple Projects"]},
        ],
        "highlights": [{"icon":"code","label":"No Prerequisites"},{"icon":"star","label":"Python + JS"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Beginner Friendly"},{"icon":"clock","label":"Self-Paced"},{"icon":"target","label":"Build Portfolio"}],
        "fees": [{"plan_name":"Standard","price":14999,"features":["Full course","Certificate","Lifetime access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":29999,"features":["Standard + Mentorship","Doubt Sessions","Project Review"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Calculator & Unit Converter","description":"Build a CLI calculator and unit converter in Python."},{"title":"Personal To-Do App","description":"Create a browser-based to-do app with JavaScript."}],
        "certifications": {"description":"Programming Fundamentals certificate validating your coding skills.","recognized_companies":["TCS","Cognizant","Infosys"]},
        "faqs": [{"question":"I have zero coding experience. Can I join?","answer":"Absolutely! This course starts from scratch."},{"question":"Which languages will I learn?","answer":"Python and JavaScript — the two most beginner-friendly languages."}],
    },
    # ── 2. CS Fundamentals ──
    {
        "slug": "cs-fundamentals",
        "title": "Computer Science Fundamentals",
        "subtitle": "Master DSA, algorithms & system design",
        "description": "Rigorous training in data structures, algorithms, operating systems, databases, and system design. Ideal for interview preparation and building strong computer science foundations.",
        "duration": "6 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1517694712202-14dd9538aa97?w=800",
        "video_url": VIDEOS[1],
        "video_thumbnail_url": "https://img.youtube.com/vi/6icT3M5Hc3k/maxresdefault.jpg",
        "checklist_items": ["Master arrays, linked lists, trees & graphs", "Solve 200+ coding problems", "Understand OS, DBMS & networking", "Crack top tech company interviews"],
        "curriculum": [
            {"title":"Data Structures","topics":["Arrays & Strings","Linked Lists","Stacks & Queues","Trees & Graphs"]},
            {"title":"Algorithms","topics":["Sorting & Searching","Recursion & Backtracking","Dynamic Programming","Greedy Algorithms"]},
            {"title":"Core CS","topics":["Operating Systems","Database Management","Computer Networks","OO Design"]},
            {"title":"System Design","topics":["Design Patterns","Scalability","Microservices","HLD & LLD"]},
        ],
        "highlights": [{"icon":"code","label":"200+ Problems"},{"icon":"star","label":"Interview Focused"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Mock Interviews"},{"icon":"clock","label":"6 Months"},{"icon":"target","label":"Top Placements"}],
        "fees": [{"plan_name":"Standard","price":39999,"features":["Full curriculum","Certificate","1 year access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":69999,"features":["Standard + Mock Interviews","Resume Review","Placement Support"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Cache System Design","description":"Design and implement an LRU cache from scratch."},{"title":"URL Shortener","description":"Build a scalable URL shortener with database design."}],
        "certifications": {"description":"CS Fundamentals certification recognized by FAANG recruiters.","recognized_companies":["Google","Amazon","Microsoft"]},
        "faqs": [{"question":"Is this course for beginners?","answer":"Basic programming knowledge is required."},{"question":"Will this help with FAANG interviews?","answer":"Yes, we cover DSA and system design extensively."}],
    },
    # ── 3. Frontend Dev ──
    {
        "slug": "frontend-dev",
        "title": "Frontend Web Development",
        "subtitle": "HTML, CSS, JS, React & modern tools",
        "description": "Become a professional frontend developer. Covers HTML5, CSS3 (Flexbox, Grid), JavaScript (ES6+), React, responsive design, and deployment. Build portfolio-ready projects.",
        "duration": "4 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1633355198496-2f3b81f1e9c4?w=800",
        "video_url": VIDEOS[2],
        "video_thumbnail_url": "https://img.youtube.com/vi/G3e-cpL7ofc/maxresdefault.jpg",
        "checklist_items": ["Build responsive websites with HTML & CSS", "Master JavaScript ES6+", "Develop single-page apps with React", "Deploy projects on Vercel/Netlify"],
        "curriculum": [
            {"title":"HTML & CSS","topics":["Semantic HTML","Flexbox & Grid","Responsive Design","CSS Animations"]},
            {"title":"JavaScript","topics":["ES6+ Syntax","DOM Manipulation","Fetch API & AJAX","Async/Await"]},
            {"title":"React","topics":["JSX & Components","State & Props","Hooks (useEffect, useRef)","React Router"]},
            {"title":"Tools & Deployment","topics":["Git & GitHub","Tailwind CSS","Vite","Vercel / Netlify"]},
        ],
        "highlights": [{"icon":"code","label":"Build Websites"},{"icon":"star","label":"React Focus"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Mentor Support"},{"icon":"clock","label":"Flexible"},{"icon":"target","label":"Portfolio Ready"}],
        "fees": [{"plan_name":"Standard","price":24999,"features":["Full course","Certificate","Lifetime access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":44999,"features":["Standard + Mentorship","Resume Review","Interview Prep"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Portfolio Website","description":"Build a responsive personal portfolio with HTML, CSS & JS."},{"title":"E-Commerce Storefront","description":"Create a product listing app with React, search, and cart features."}],
        "certifications": {"description":"Frontend Development certification trusted by startups and agencies.","recognized_companies":["Flipkart","Swiggy","Razorpay"]},
        "faqs": [{"question":"Do I need prior coding experience?","answer":"Basic computer skills are enough."},{"question":"Will I learn React?","answer":"Yes, React is a core part of the curriculum."}],
    },
    # ── 4. Backend Dev (Node.js) ──
    {
        "slug": "backend-dev",
        "title": "Backend Development with Node.js",
        "subtitle": "Server-side JavaScript, APIs & databases",
        "description": "Build robust, scalable backends using Node.js, Express, MongoDB, and PostgreSQL. Covers REST APIs, authentication, WebSockets, and deployment on cloud platforms.",
        "duration": "4 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1558494860-0ea8c9a6c097?w=800",
        "video_url": VIDEOS[3],
        "video_thumbnail_url": "https://img.youtube.com/vi/T7bxY4F2gvs/maxresdefault.jpg",
        "checklist_items": ["Build RESTful APIs with Express", "Work with MongoDB & PostgreSQL", "Implement JWT & OAuth authentication", "Deploy to AWS & Docker"],
        "curriculum": [
            {"title":"Node.js & Express","topics":["Node.js Runtime","Express Framework","Routing & Middleware","Error Handling"]},
            {"title":"Databases","topics":["MongoDB (Mongoose)","PostgreSQL (Knex)","Schema Design","Indexing & Performance"]},
            {"title":"Authentication","topics":["JWT Tokens","OAuth 2.0","bcrypt Hashing","Session Management"]},
            {"title":"Deployment","topics":["Docker Containers","AWS EC2","CI/CD Pipelines","PM2 Process Manager"]},
        ],
        "highlights": [{"icon":"code","label":"REST APIs"},{"icon":"star","label":"Node.js Experts"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Database Design"},{"icon":"clock","label":"Flexible"},{"icon":"target","label":"Backend Ready"}],
        "fees": [{"plan_name":"Standard","price":29999,"features":["Full course","Certificate","1 year access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":49999,"features":["Standard + Mentorship","Resume Review","Placement Help"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Chat Application","description":"Build a real-time chat app with WebSockets and MongoDB."},{"title":"E-Commerce Backend","description":"Create a full backend with products, orders, users, and payments."}],
        "certifications": {"description":"Backend Development certification valued by tech companies.","recognized_companies":["Amazon","Zomato","Uber"]},
        "faqs": [{"question":"Do I need frontend knowledge?","answer":"Basic JS knowledge is sufficient."},{"question":"Will I learn databases?","answer":"Yes, both SQL and NoSQL databases are covered."}],
    },
    # ── 5. ML Fundamentals ──
    {
        "slug": "ml-fundamentals",
        "title": "Machine Learning Fundamentals",
        "subtitle": "Start your ML journey",
        "description": "Learn machine learning from scratch. Covers supervised/unsupervised learning, regression, classification, clustering, and model evaluation using Python and scikit-learn.",
        "duration": "4 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1555949962-ffc26a2f4e7b?w=800",
        "video_url": VIDEOS[4],
        "video_thumbnail_url": "https://img.youtube.com/vi/8jLOx1hDBlw/maxresdefault.jpg",
        "checklist_items": ["Build ML models from scratch", "Master Python for data science", "Understand regression & classification", "Deploy ML models with Flask"],
        "curriculum": [
            {"title":"Python for Data Science","topics":["NumPy","Pandas","Matplotlib","Seaborn"]},
            {"title":"Supervised Learning","topics":["Linear Regression","Logistic Regression","Decision Trees","Random Forest"]},
            {"title":"Unsupervised Learning","topics":["K-Means","Hierarchical Clustering","PCA","t-SNE"]},
            {"title":"Model Evaluation & Deployment","topics":["Cross-Validation","Hyperparameter Tuning","Flask API","Model Serving"]},
        ],
        "highlights": [{"icon":"code","label":"Hands-On ML"},{"icon":"star","label":"Expert Faculty"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Kaggle Projects"},{"icon":"clock","label":"Self-Paced"},{"icon":"target","label":"Career Ready"}],
        "fees": [{"plan_name":"Standard","price":34999,"features":["Full access","Certificate","1 year access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":54999,"features":["Standard + GPU Access","Mentorship","Interview Prep"],"cta_label":"Get Pro"}],
        "projects": [{"title":"House Price Prediction","description":"Build a regression model to predict house prices using real estate data."},{"title":"Customer Segmentation","description":"Cluster customers using K-Means for targeted marketing campaigns."}],
        "certifications": {"description":"ML certification recognized by top tech companies.","recognized_companies":["Google","Amazon","Microsoft"]},
        "faqs": [{"question":"Do I need a math background?","answer":"Basic statistics and linear algebra are helpful but not required."},{"question":"Will I learn deep learning?","answer":"ML fundamentals are covered; deep learning is in the advanced course."}],
    },
    # ── 6. Deep Learning ──
    {
        "slug": "deep-learning",
        "title": "Deep Learning with Neural Networks",
        "subtitle": "CNN, RNN, Transformers & GANs",
        "description": "Deep dive into neural networks, CNNs, RNNs, Transformers, and GANs using TensorFlow and PyTorch. Build and deploy production-grade deep learning models.",
        "duration": "5 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1485829234709-b6c6f7e64b8e?w=800",
        "video_url": VIDEOS[0],
        "video_thumbnail_url": "https://img.youtube.com/vi/9J7VwqCpxiY/maxresdefault.jpg",
        "checklist_items": ["Build neural networks with TensorFlow", "Implement CNNs for image recognition", "Train Transformers for NLP", "Deploy models with TensorFlow Serving"],
        "curriculum": [
            {"title":"Neural Networks Fundamentals","topics":["Perceptron","Backpropagation","Activation Functions","Loss Functions"]},
            {"title":"Convolutional Neural Networks","topics":["Conv Layers","Pooling","Transfer Learning","Object Detection (YOLO)"]},
            {"title":"Recurrent Networks & Transformers","topics":["RNN / LSTM","Attention Mechanism","Transformers","BERT & GPT"]},
            {"title":"Generative Models & Deployment","topics":["GANs","VAEs","TensorFlow Serving","MLflow"]},
        ],
        "highlights": [{"icon":"code","label":"Deep Learning"},{"icon":"star","label":"PhD Faculty"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Research Papers"},{"icon":"clock","label":"Flexible"},{"icon":"target","label":"Industry Projects"}],
        "fees": [{"plan_name":"Standard","price":44999,"features":["Full access","Certificate","GPU access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":69999,"features":["Standard + 1:1 Mentorship","Research Guidance","Placement Prep"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Image Classifier","description":"Build a CNN to classify images into 100+ categories."},{"title":"Text Summarization","description":"Implement a transformer-based text summarization model."}],
        "certifications": {"description":"Deep Learning certification from industry-recognized program.","recognized_companies":["NVIDIA","Google Brain","Meta AI"]},
        "faqs": [{"question":"What are the prerequisites?","answer":"Basic ML knowledge and Python experience required."},{"question":"Will I get GPU access?","answer":"Yes, we provide cloud GPU access for projects."}],
    },
    # ── 7. Data Analysis ──
    {
        "slug": "data-analysis",
        "title": "Data Analysis with Python & SQL",
        "subtitle": "Turn data into actionable insights",
        "description": "Master data analysis with Python, SQL, and Tableau. Learn to clean, analyze, and visualize data to drive business decisions. Real-world datasets included.",
        "duration": "3 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1551288049-7a3e4c4a3b5e?w=800",
        "video_url": VIDEOS[1],
        "video_thumbnail_url": "https://img.youtube.com/vi/6icT3M5Hc3k/maxresdefault.jpg",
        "checklist_items": ["Analyze data with Python & Pandas", "Write complex SQL queries", "Create dashboards in Tableau", "Present data-driven insights"],
        "curriculum": [
            {"title":"Python Data Analysis","topics":["Pandas (merge, groupby, pivot)","Data Cleaning","Feature Engineering","Exploratory Analysis"]},
            {"title":"SQL for Analytics","topics":["Joins","Window Functions","CTEs","Subqueries"]},
            {"title":"Data Visualization","topics":["Matplotlib","Seaborn","Plotly","Interactive Dashboards"]},
            {"title":"Tableau & Storytelling","topics":["Calculated Fields","Parameters","Dashboard Design","Presenting Insights"]},
        ],
        "highlights": [{"icon":"code","label":"Real Datasets"},{"icon":"star","label":"Industry Tools"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Tableau Desktop"},{"icon":"clock","label":"Short Duration"},{"icon":"target","label":"Business Focus"}],
        "fees": [{"plan_name":"Standard","price":19999,"features":["Full course","Certificate","6 months access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":34999,"features":["Standard + Tableau License","Mentorship","Resume Review"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Sales Dashboard","description":"Build an interactive Tableau dashboard analyzing sales performance."},{"title":"Customer Churn Analysis","description":"Analyze customer churn patterns and present recommendations."}],
        "certifications": {"description":"Data Analysis certification for analytics roles.","recognized_companies":["Amazon","Flipkart","Swiggy"]},
        "faqs": [{"question":"Do I need coding experience?","answer":"Basic Python knowledge helps but is not mandatory."},{"question":"Will I learn Tableau?","answer":"Yes, Tableau is a major part of the curriculum."}],
    },
    # ── 8. Data Viz & SQL ──
    {
        "slug": "data-viz-sql",
        "title": "Data Visualization & Advanced SQL",
        "subtitle": "Master dashboards, charts & analytics",
        "description": "Advanced training in data visualization tools (Tableau, Power BI, Looker) and advanced SQL techniques. Perfect for BI analysts and data professionals.",
        "duration": "3 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1551288049-7a3e4c4a3b5e?w=800",
        "video_url": VIDEOS[2],
        "video_thumbnail_url": "https://img.youtube.com/vi/G3e-cpL7ofc/maxresdefault.jpg",
        "checklist_items": ["Create interactive dashboards", "Master advanced SQL (window functions, CTEs)", "Build reports in Power BI & Tableau", "Work with real business datasets"],
        "curriculum": [
            {"title":"Advanced SQL","topics":["Window Functions","Common Table Expressions","Recursive Queries","Query Optimization"]},
            {"title":"Tableau","topics":["Calculated Fields","Parameters","LOD Expressions","Dashboard Actions"]},
            {"title":"Power BI","topics":["DAX Formulas","Power Query","Measures vs Columns","Publish & Share"]},
            {"title":"Storytelling with Data","topics":["Data Narratives","Visual Best Practices","Executive Dashboards","Presenting Insights"]},
        ],
        "highlights": [{"icon":"code","label":"SQL Mastery"},{"icon":"star","label":"BI Tools"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Real Datasets"},{"icon":"clock","label":"3 Months"},{"icon":"target","label":"Analyst Roles"}],
        "fees": [{"plan_name":"Standard","price":24999,"features":["Full course","Certificate","6 months access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":39999,"features":["Standard + Tableau License","Power BI License","Mentorship"],"cta_label":"Get Pro"}],
        "projects": [{"title":"E-Commerce Analytics Dashboard","description":"Build a comprehensive dashboard analyzing sales, inventory, and customer trends."},{"title":"HR Analytics Report","description":"Create an HR attrition analysis report with Power BI."}],
        "certifications": {"description":"Data Visualization certification for BI and analytics roles.","recognized_companies":["Deloitte","KPMG","PwC"]},
        "faqs": [{"question":"What tools will I learn?","answer":"Tableau, Power BI, and Looker."},{"question":"Is SQL experience required?","answer":"Basic SQL knowledge is recommended."}],
    },
    # ── 9. Cloud Platforms ──
    {
        "slug": "cloud-platforms",
        "title": "Cloud Platforms - AWS, Azure & GCP",
        "subtitle": "Multi-cloud architecture & certification prep",
        "description": "Comprehensive cloud computing training across AWS, Azure, and GCP. Covers compute, storage, networking, security, and cost optimization. Prepares for AWS Solutions Architect, Azure AZ-900, and GCP Associate certifications.",
        "duration": "5 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1451187580459-43490279c0fa?w=800",
        "video_url": VIDEOS[3],
        "video_thumbnail_url": "https://img.youtube.com/vi/T7bxY4F2gvs/maxresdefault.jpg",
        "checklist_items": ["Deploy VMs and containers on AWS", "Configure Azure Active Directory", "Build serverless apps on GCP", "Pass cloud certification exams"],
        "curriculum": [
            {"title":"Cloud Fundamentals","topics":["IaaS vs PaaS vs SaaS","Region & AZ Architecture","Billing & Cost Management","Shared Responsibility Model"]},
            {"title":"AWS Core","topics":["EC2 & Auto Scaling","S3 & CloudFront","RDS & DynamoDB","IAM & Security Groups"]},
            {"title":"Azure & GCP","topics":["Azure VMs & App Service","Azure AD & DevOps","GCP Compute Engine","GKE & Cloud Functions"]},
            {"title":"Multi-Cloud & DevOps","topics":["Terraform Multi-Cloud","Kubernetes (AKS/EKS/GKE)","Cloud Monitoring","Cost Optimization"]},
        ],
        "highlights": [{"icon":"code","label":"AWS + Azure + GCP"},{"icon":"star","label":"Cert Prep"},{"icon":"award","label":"3 Badges"},{"icon":"users","label":"Live Labs"},{"icon":"clock","label":"5 Months"},{"icon":"target","label":"Cloud Ready"}],
        "fees": [{"plan_name":"Standard","price":44999,"features":["All three clouds","Certificate","1 year access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":74999,"features":["Standard + Exam Vouchers","1:1 Coaching","Resume Review"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Multi-Tier Web App on AWS","description":"Deploy a 3-tier web application with EC2, RDS, and ELB."},{"title":"Serverless API on GCP","description":"Build a serverless REST API using Cloud Functions and Firestore."}],
        "certifications": {"description":"Multi-cloud certification covering AWS, Azure, and GCP.","recognized_companies":["AWS","Microsoft","Google"]},
        "faqs": [{"question":"Which cloud is the main focus?","answer":"All three are covered equally."},{"question":"Are certification exams included?","answer":"Exam vouchers are included in the Pro plan."}],
    },
    # ── 10. Infrastructure as Code ──
    {
        "slug": "infrastructure-as-code",
        "title": "Infrastructure as Code",
        "subtitle": "Terraform, Ansible, Docker & Kubernetes",
        "description": "Master modern DevOps practices with Infrastructure as Code using Terraform, Ansible, Docker, and Kubernetes. Automate provisioning, configuration, and deployment at scale.",
        "duration": "4 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1558494860-0ea8c9a6c097?w=800",
        "video_url": VIDEOS[4],
        "video_thumbnail_url": "https://img.youtube.com/vi/8jLOx1hDBlw/maxresdefault.jpg",
        "checklist_items": ["Provision cloud infra with Terraform", "Automate config management with Ansible", "Containerize apps with Docker", "Orchestrate with Kubernetes"],
        "curriculum": [
            {"title":"Terraform","topics":["HCL Syntax","Providers & Resources","State Management","Modules & Workspaces"]},
            {"title":"Ansible","topics":["Playbooks & Roles","Inventory Management","Variables & Templates","Idempotency"]},
            {"title":"Docker","topics":["Images & Containers","Docker Compose","Multi-Stage Builds","Registry & CI/CD"]},
            {"title":"Kubernetes","topics":["Pods & Deployments","Services & Ingress","ConfigMaps & Secrets","Helm Charts"]},
        ],
        "highlights": [{"icon":"code","label":"IaC Tools"},{"icon":"star","label":"DevOps Focus"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Live Clusters"},{"icon":"clock","label":"Flexible"},{"icon":"target","label":"DevOps Ready"}],
        "fees": [{"plan_name":"Standard","price":34999,"features":["Full course","Certificate","1 year access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":59999,"features":["Standard + Cloud Credits","Mentorship","Resume Review"],"cta_label":"Get Pro"}],
        "projects": [{"title":"3-Tier App on Kubernetes","description":"Deploy a full 3-tier application on a Kubernetes cluster."},{"title":"CI/CD Pipeline","description":"Build an automated CI/CD pipeline with Jenkins, Terraform, and Docker."}],
        "certifications": {"description":"IaC certification for DevOps and platform engineering roles.","recognized_companies":["HashiCorp","Red Hat","Docker Inc"]},
        "faqs": [{"question":"Do I need DevOps experience?","answer":"Basic Linux knowledge is recommended."},{"question":"Is Kubernetes covered in depth?","answer":"Yes, including Helm charts and production patterns."}],
    },
    # ── 11. Network & Linux Security ──
    {
        "slug": "network-linux-security",
        "title": "Network & Linux Security",
        "subtitle": "Secure networks and systems",
        "description": "Comprehensive training in network security, Linux administration, and cybersecurity fundamentals. Covers firewalls, IDS/IPS, VPNs, hardening, and compliance frameworks.",
        "duration": "4 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1550754831-0d8d6339a2f7?w=800",
        "video_url": VIDEOS[5],
        "video_thumbnail_url": "https://img.youtube.com/vi/3nQ3xI3WlXo/maxresdefault.jpg",
        "checklist_items": ["Configure firewalls & IDS/IPS", "Harden Linux servers", "Set up VPNs & secure remote access", "Understand compliance frameworks"],
        "curriculum": [
            {"title":"Linux Administration","topics":["User & Permissions","Process Management","Systemd & Services","Logging & Auditing"]},
            {"title":"Network Security","topics":["TCP/IP & OSI Model","Firewalls (iptables/nftables)","IDS/IPS (Snort/Suricata)","VPNs (WireGuard/OpenVPN)"]},
            {"title":"System Hardening","topics":["SSH Hardening","SELinux & AppArmor","Kernel Hardening","Security Benchmarks (CIS)"]},
            {"title":"Compliance & Monitoring","topics":["SIEM (Wazuh/Splunk)","Incident Response","GDPR & PCI DSS","Security Policies"]},
        ],
        "highlights": [{"icon":"code","label":"Linux Security"},{"icon":"star","label":"Lab Heavy"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"CTF Challenges"},{"icon":"clock","label":"4 Months"},{"icon":"target","label":"SOC Ready"}],
        "fees": [{"plan_name":"Standard","price":29999,"features":["Full course","Certificate","Lifetime access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":49999,"features":["Standard + Lab VMs","Mentorship","Resume Review"],"cta_label":"Get Pro"}],
        "projects": [{"title":"SOC Dashboard","description":"Set up a Security Operations Center with Wazuh SIEM."},{"title":"Network Hardening Lab","description":"Harden a multi-server network topology against common attacks."}],
        "certifications": {"description":"Network & Linux Security certification for cybersecurity roles.","recognized_companies":["Cisco","Palo Alto Networks","CrowdStrike"]},
        "faqs": [{"question":"What are the prerequisites?","answer":"Basic networking knowledge is helpful."},{"question":"Will I earn a certification?","answer":"Yes, you receive a course certificate upon completion."}],
    },
    # ── 12. Smart Contracts ──
    {
        "slug": "smart-contracts",
        "title": "Smart Contract Development",
        "subtitle": "Solidity, Ethereum & Web3",
        "description": "Learn to build and deploy smart contracts on Ethereum and EVM-compatible blockchains using Solidity, Hardhat, and OpenZeppelin. Covers DeFi, NFTs, and security best practices.",
        "duration": "3 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1633355198496-2f3b81f1e9c4?w=800",
        "video_url": VIDEOS[0],
        "video_thumbnail_url": "https://img.youtube.com/vi/9J7VwqCpxiY/maxresdefault.jpg",
        "checklist_items": ["Write and deploy Solidity contracts", "Build ERC-20 & ERC-721 tokens", "Audit smart contracts for vulnerabilities", "Interact with dApps via ethers.js"],
        "curriculum": [
            {"title":"Blockchain Fundamentals","topics":["Consensus Mechanisms","Ethereum Virtual Machine","Gas & Transactions","Wallets & Accounts"]},
            {"title":"Solidity","topics":["Data Types & Functions","Inheritance & Interfaces","Modifiers & Events","Mappings & Structs"]},
            {"title":"Token Standards","topics":["ERC-20 (Fungible Tokens)","ERC-721 (NFTs)","ERC-1155 (Multi-Token)","OpenZeppelin Libraries"]},
            {"title":"Security & Deployment","topics":["Reentrancy Attacks","Access Control","Hardhat Testing","Mainnet Deployment"]},
        ],
        "highlights": [{"icon":"code","label":"Solidity"},{"icon":"star","label":"DeFi Focus"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Audit Skills"},{"icon":"clock","label":"3 Months"},{"icon":"target","label":"Web3 Jobs"}],
        "fees": [{"plan_name":"Standard","price":29999,"features":["Full course","Certificate","Lifetime access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":49999,"features":["Standard + Gas Credits","Mentorship","Portfolio Review"],"cta_label":"Get Pro"}],
        "projects": [{"title":"NFT Marketplace","description":"Deploy an ERC-721 NFT collection with mint, buy, and sell functions."},{"title":"DeFi Lending Protocol","description":"Build a simplified lending/borrowing smart contract system."}],
        "certifications": {"description":"Smart Contract certification for blockchain development roles.","recognized_companies":["ConsenSys","Chainlink Labs","Polygon"]},
        "faqs": [{"question":"Do I need blockchain experience?","answer":"No, we start with blockchain fundamentals."},{"question":"Will I deploy on mainnet?","answer":"Pro plan includes gas credits for mainnet deployment."}],
    },
    # ── 13. Full-Stack Web3 ──
    {
        "slug": "fullstack-web3",
        "title": "Full-Stack Web3 Development",
        "subtitle": "dApps, smart contracts & frontends",
        "description": "Become a full-stack Web3 developer. Build decentralized applications with React frontends, Solidity smart contracts, and integrate with The Graph, IPFS, and wallet providers.",
        "duration": "5 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1633355198496-2f3b81f1e9c4?w=800",
        "video_url": VIDEOS[1],
        "video_thumbnail_url": "https://img.youtube.com/vi/6icT3M5Hc3k/maxresdefault.jpg",
        "checklist_items": ["Build full-stack dApps", "Integrate MetaMask & WalletConnect", "Query on-chain data with The Graph", "Store files on IPFS & Filecoin"],
        "curriculum": [
            {"title":"Web3 Foundation","topics":["Ethereum Architecture","Wallets & Signing","Gas Optimization","Layer 2 Solutions"]},
            {"title":"Frontend for Web3","topics":["ethers.js & web3.js","React + Wagmi Hooks","RainbowKit Integration","Reading Contract State"]},
            {"title":"The Graph & IPFS","topics":["Subgraph Definition","GraphQL Queries","IPFS Upload & Pin","Filecoin Storage"]},
            {"title":"Advanced dApps","topics":["DAO Frameworks","Aragon & Snapshot","Cross-Chain Bridges","Full dApp Deployment"]},
        ],
        "highlights": [{"icon":"code","label":"Full-Stack dApps"},{"icon":"star","label":"Web3 Native"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Hackathons"},{"icon":"clock","label":"5 Months"},{"icon":"target","label":"Web3 Careers"}],
        "fees": [{"plan_name":"Standard","price":44999,"features":["Full course","Certificate","Lifetime access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":69999,"features":["Standard + Gas Credits","Mentorship","Hackathon Coaching"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Decentralized Twitter","description":"Build a Twitter-like dApp with posts, likes, and follows on-chain."},{"title":"Web3 Donation Platform","description":"Create a donation platform supporting multiple tokens and fiat on-ramp."}],
        "certifications": {"description":"Full-Stack Web3 certification for end-to-end dApp development.","recognized_companies":["Ethereum Foundation","Polygon Labs","Alchemy"]},
        "faqs": [{"question":"What are the prerequisites?","answer":"JavaScript and React experience is required."},{"question":"Do I need prior blockchain knowledge?","answer":"The first module covers blockchain fundamentals."}],
    },
    # ── 14. C for Embedded Systems ──
    {
        "slug": "c-embedded",
        "title": "C Programming for Embedded Systems",
        "subtitle": "Low-level programming for hardware",
        "description": "Master C programming for embedded systems and microcontrollers. Covers pointers, memory management, interrupts, RTOS concepts, and hardware interfacing with ARM Cortex-M.",
        "duration": "4 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1517077303299-3676a8e96b45?w=800",
        "video_url": VIDEOS[2],
        "video_thumbnail_url": "https://img.youtube.com/vi/G3e-cpL7ofc/maxresdefault.jpg",
        "checklist_items": ["Master C pointers and memory management", "Program ARM Cortex-M microcontrollers", "Interface with sensors and actuators", "Understand RTOS and interrupt handling"],
        "curriculum": [
            {"title":"C Deep Dive","topics":["Pointers & Arrays","Dynamic Memory","Structs & Unions","Bit Manipulation"]},
            {"title":"Microcontroller Programming","topics":["GPIO & Timers","ADC & PWM","Interrupts & NVIC","UART / I2C / SPI"]},
            {"title":"RTOS Concepts","topics":["Tasks & Scheduling","Mutexes & Semaphores","Queue & Mailbox","FreeRTOS Porting"]},
            {"title":"Advanced Topics","topics":["DMA Controllers","Low-Power Modes","Bootloader Design","Debugging with Segger"]},
        ],
        "highlights": [{"icon":"code","label":"C Programming"},{"icon":"star","label":"ARM Cortex-M"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Hardware Kits"},{"icon":"clock","label":"4 Months"},{"icon":"target","label":"Embedded Jobs"}],
        "fees": [{"plan_name":"Standard","price":34999,"features":["Full course","Certificate","1 year access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":54999,"features":["Standard + Dev Board Kit","Mentorship","Lab Support"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Temperature Logger","description":"Read temperature from an I2C sensor and log data to serial."},{"title":"Stepper Motor Controller","description":"Control a stepper motor with precise positioning using timers."}],
        "certifications": {"description":"Embedded C certification for firmware and IoT development roles.","recognized_companies":["ARM","Texas Instruments","NXP"]},
        "faqs": [{"question":"Do I need prior C experience?","answer":"Basic programming knowledge is sufficient."},{"question":"Will I work with actual hardware?","answer":"Yes, the Pro plan includes a development board kit."}],
    },
    # ── 15. Microcontrollers & Firmware ──
    {
        "slug": "microcontrollers-firmware",
        "title": "Microcontrollers & Firmware Development",
        "subtitle": "Firmware for IoT & embedded devices",
        "description": "Advanced firmware development for microcontrollers including STM32, ESP32, and Arduino. Covers bare-metal programming, peripheral drivers, RTOS, and IoT protocol integration.",
        "duration": "5 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1517077303299-3676a8e96b45?w=800",
        "video_url": VIDEOS[3],
        "video_thumbnail_url": "https://img.youtube.com/vi/T7bxY4F2gvs/maxresdefault.jpg",
        "checklist_items": ["Program STM32 & ESP32 MCUs", "Write bare-metal peripheral drivers", "Implement MQTT & BLE protocols", "Design low-power IoT devices"],
        "curriculum": [
            {"title":"Bare-Metal Programming","topics":["Register-Level GPIO","Clock Configuration","Timer & PWM","ADC & DAC"]},
            {"title":"Peripheral Drivers","topics":["UART Driver","I2C & SPI","DMA Transfers","External Interrupts"]},
            {"title":"IoT Protocols","topics":["MQTT & CoAP","BLE & Zigbee","WiFi (ESP-IDF)","LoRaWAN"]},
            {"title":"Advanced Firmware","topics":["OTA Updates","Bootloader Design","Secure Firmware","Power Management"]},
        ],
        "highlights": [{"icon":"code","label":"Firmware Dev"},{"icon":"star","label":"STM32/ESP32"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"IoT Projects"},{"icon":"clock","label":"5 Months"},{"icon":"target","label":"Embedded Roles"}],
        "fees": [{"plan_name":"Standard","price":39999,"features":["Full course","Certificate","1 year access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":64999,"features":["Standard + Dev Board Kit","Mentorship","Sensor Kit"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Smart Home Hub","description":"Build an ESP32-based smart home hub with MQTT and BLE."},{"title":"Firmware OTA Update","description":"Implement secure OTA firmware updates for an STM32 device."}],
        "certifications": {"description":"Firmware Development certification for embedded and IoT roles.","recognized_companies":["STMicroelectronics","Espressif","Nordic Semi"]},
        "faqs": [{"question":"What's the difference from the C course?","answer":"This focuses on MCU-specific firmware and IoT protocols."},{"question":"Do I need a development board?","answer":"The Pro plan includes an STM32 + ESP32 kit."}],
    },
    # ── 16. Cross-Platform Mobile ──
    {
        "slug": "cross-platform-mobile",
        "title": "Cross-Platform Mobile Development",
        "subtitle": "Flutter & React Native",
        "description": "Build beautiful, performant mobile apps for iOS and Android using Flutter and React Native. Covers UI design, state management, native modules, and app store deployment.",
        "duration": "4 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1512942481577-6dc3fc6bb7eb?w=800",
        "video_url": VIDEOS[4],
        "video_thumbnail_url": "https://img.youtube.com/vi/8jLOx1hDBlw/maxresdefault.jpg",
        "checklist_items": ["Build iOS & Android apps from one codebase", "Master Flutter widgets & Dart", "Develop with React Native", "Publish apps to App Store & Play Store"],
        "curriculum": [
            {"title":"Flutter & Dart","topics":["Dart Language","Widget Tree","State Management (Bloc)","Navigation & Routing"]},
            {"title":"React Native","topics":["JSX & Components","React Navigation","Redux Toolkit","Native Modules"]},
            {"title":"UI & Animations","topics":["Custom Widgets","Hero Animations","Lottie & Rive","Platform Adaptive UI"]},
            {"title":"Deployment","topics":["App Store Connect","Google Play Console","CodePush & Updates","Testing & CI/CD"]},
        ],
        "highlights": [{"icon":"code","label":"Flutter + RN"},{"icon":"star","label":"Two Frameworks"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"App Publishing"},{"icon":"clock","label":"4 Months"},{"icon":"target","label":"Mobile Ready"}],
        "fees": [{"plan_name":"Standard","price":34999,"features":["Both frameworks","Certificate","Lifetime access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":54999,"features":["Standard + Mentorship","App Store Fees Covered","Resume Review"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Fitness Tracker App","description":"Build a cross-platform fitness tracker with charts and notifications."},{"title":"E-Commerce Mobile App","description":"Create a mobile shopping app with cart, payments, and orders."}],
        "certifications": {"description":"Cross-Platform Mobile certification for mobile development roles.","recognized_companies":["Google","Meta","Uber"]},
        "faqs": [{"question":"Which framework is better?","answer":"Both are taught; Flutter for UI, React Native for ecosystem."},{"question":"Do I need mobile experience?","answer":"Basic programming knowledge is sufficient."}],
    },
    # ── 17. Native Mobile ──
    {
        "slug": "native-mobile",
        "title": "Native Mobile App Development",
        "subtitle": "Swift (iOS) & Kotlin (Android)",
        "description": "Build native iOS and Android apps with Swift and Kotlin. Covers platform-specific UI, APIs, local storage, networking, and app store deployment. Master each platform's ecosystem.",
        "duration": "5 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1512942481577-6dc3fc6bb7eb?w=800",
        "video_url": VIDEOS[5],
        "video_thumbnail_url": "https://img.youtube.com/vi/3nQ3xI3WlXo/maxresdefault.jpg",
        "checklist_items": ["Develop iOS apps with SwiftUI", "Build Android apps with Jetpack Compose", "Integrate platform APIs (camera, GPS)", "Publish apps on both stores"],
        "curriculum": [
            {"title":"iOS with Swift","topics":["Swift Language","SwiftUI Layouts","MVVM Architecture","Core Data & CloudKit"]},
            {"title":"Android with Kotlin","topics":["Kotlin Basics","Jetpack Compose","ViewModel & LiveData","Room Database"]},
            {"title":"Networking & APIs","topics":["URLSession & Retrofit","REST & GraphQL","Firebase Integration","Push Notifications"]},
            {"title":"App Store Deployment","topics":["TestFlight & Beta","Google Play Console","App Store Review","Monetization (IAP)"]},
        ],
        "highlights": [{"icon":"code","label":"Swift + Kotlin"},{"icon":"star","label":"Native APIs"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Apple & Google"},{"icon":"clock","label":"5 Months"},{"icon":"target","label":"Native Dev"}],
        "fees": [{"plan_name":"Standard","price":44999,"features":["Both platforms","Certificate","Lifetime access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":69999,"features":["Standard + Mentorship","Apple Developer Fee","Resume Review"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Weather App","description":"Build native weather apps for iOS and Android with location services."},{"title":"Social Media Clone","description":"Create a social feed app with posts, likes, and comments on both platforms."}],
        "certifications": {"description":"Native Mobile certification for iOS and Android development.","recognized_companies":["Apple","Google","Spotify"]},
        "faqs": [{"question":"Can I learn only one platform?","answer":"Both iOS and Android are covered equally."},{"question":"Do I need a Mac?","answer":"Yes, a Mac is required for iOS development."}],
    },
    # ── 18. Unity Game Dev ──
    {
        "slug": "unity-game-dev",
        "title": "Unity Game Development",
        "subtitle": "2D & 3D game development",
        "description": "Create 2D and 3D games with Unity and C#. Covers game mechanics, physics, lighting, animations, audio, and publishing to PC, mobile, and consoles.",
        "duration": "4 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1556432467-75e4176f50e8?w=800",
        "video_url": VIDEOS[0],
        "video_thumbnail_url": "https://img.youtube.com/vi/9J7VwqCpxiY/maxresdefault.jpg",
        "checklist_items": ["Build 2D & 3D games in Unity", "Master C# scripting for games", "Implement physics, animations & audio", "Publish games on Steam & mobile stores"],
        "curriculum": [
            {"title":"Unity Essentials","topics":["Editor Interface","GameObjects & Components","Prefabs & Scenes","C# Scripting Basics"]},
            {"title":"2D Game Development","topics":["Sprite Management","Tilemaps","2D Physics","Animator Controller"]},
            {"title":"3D Game Development","topics":["3D Models & Materials","Lighting & Shadows","Terrain System","NavMesh AI"]},
            {"title":"Publishing & Monetization","topics":["Build Settings","Ads & IAP","Steam Publishing","Mobile Optimization"]},
        ],
        "highlights": [{"icon":"code","label":"2D & 3D"},{"icon":"star","label":"C# Scripting"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Game Portfolio"},{"icon":"clock","label":"4 Months"},{"icon":"target","label":"Indie Dev"}],
        "fees": [{"plan_name":"Standard","price":29999,"features":["Full course","Certificate","Lifetime access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":49999,"features":["Standard + Asset Store Pack","Mentorship","Steam Publishing Help"],"cta_label":"Get Pro"}],
        "projects": [{"title":"2D Platformer","description":"Build a complete 2D platformer with enemies, collectibles, and levels."},{"title":"3D FPS Prototype","description":"Create a first-person shooter with shooting mechanics and AI enemies."}],
        "certifications": {"description":"Unity certification for game development roles.","recognized_companies":["Unity Technologies","Ubisoft","Electronic Arts"]},
        "faqs": [{"question":"Do I need art skills?","answer":"No, we use Unity Asset Store assets."},{"question":"Can I publish my game?","answer":"Yes, the Pro plan includes Steam publishing support."}],
    },
    # ── 19. Unreal Engine 5 ──
    {
        "slug": "unreal-engine-dev",
        "title": "Unreal Engine 5 Game Development",
        "subtitle": "AAA-quality game development",
        "description": "Create stunning, high-fidelity games with Unreal Engine 5. Covers Blueprints, C++, Nanite, Lumen, MetaHumans, and advanced rendering techniques. Build for PC and consoles.",
        "duration": "6 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1556432467-75e4176f50e8?w=800",
        "video_url": VIDEOS[1],
        "video_thumbnail_url": "https://img.youtube.com/vi/6icT3M5Hc3k/maxresdefault.jpg",
        "checklist_items": ["Master Unreal Engine 5 interface", "Program with Blueprints & C++", "Use Nanite & Lumen for AAA visuals", "Create realistic environments & characters"],
        "curriculum": [
            {"title":"UE5 Fundamentals","topics":["Editor Overview","Blueprints Visual Scripting","Materials & Textures","Level Design"]},
            {"title":"C++ for Unreal","topics":["C++ in Unreal","Actors & Components","Gameplay Classes","Multiplayer Basics"]},
            {"title":"Advanced Rendering","topics":["Nanite Virtual Geometry","Lumen Global Illumination","Post-Processing","Niagara VFX"]},
            {"title":"Animation & Publishing","topics":["Control Rig","MetaHuman Characters","Sequencer (Cinematics)","Packaging & Build"]},
        ],
        "highlights": [{"icon":"code","label":"AAA Quality"},{"icon":"star","label":"Blueprints + C++"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"MetaHumans"},{"icon":"clock","label":"6 Months"},{"icon":"target","label":"Triple-A Roles"}],
        "fees": [{"plan_name":"Standard","price":44999,"features":["Full course","Certificate","Lifetime access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":74999,"features":["Standard + MegaScans Assets","Mentorship","Portfolio Review"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Open World Environment","description":"Build an open world scene with Nanite foliage, Lumen lighting, and dynamic weather."},{"title":"Third-Person Action Game","description":"Create a third-person game with combat, AI, and cutscenes."}],
        "certifications": {"description":"Unreal Engine 5 certification for high-end game development.","recognized_companies":["Epic Games","CD Projekt RED","Rockstar Games"]},
        "faqs": [{"question":"Do I need prior game dev experience?","answer":"Basic programming knowledge is helpful."},{"question":"Can I work with MetaHumans?","answer":"Yes, MetaHuman character creation is covered."}],
    },
    # ── 20. Ethical Hacking ──
    {
        "slug": "ethical-hacking",
        "title": "Ethical Hacking & Penetration Testing",
        "subtitle": "Certified ethical hacker (CEH) track",
        "description": "Learn ethical hacking and penetration testing from the ground up. Covers reconnaissance, scanning, exploitation, post-exploitation, web app testing, and CTF challenges.",
        "duration": "4 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1550754831-0d8d6339a2f7?w=800",
        "video_url": VIDEOS[2],
        "video_thumbnail_url": "https://img.youtube.com/vi/G3e-cpL7ofc/maxresdefault.jpg",
        "checklist_items": ["Perform network reconnaissance & scanning", "Exploit vulnerabilities in web apps", "Conduct post-exploitation & pivoting", "Prepare for CEH & OSCP certifications"],
        "curriculum": [
            {"title":"Reconnaissance","topics":["Passive Recon (OSINT)","Active Recon (Nmap)","Service Enumeration","Subdomain Discovery"]},
            {"title":"Exploitation","topics":["Metasploit Framework","Web App Attacks (SQLi, XSS)","Password Cracking","Social Engineering"]},
            {"title":"Post-Exploitation","topics":["Privilege Escalation (Linux/Windows)","Persistence Mechanisms","Lateral Movement","Data Exfiltration"]},
            {"title":"Web & Mobile Hacking","topics":["Burp Suite","API Testing","Mobile App Pentesting","Reporting & Remediation"]},
        ],
        "highlights": [{"icon":"code","label":"Pentesting"},{"icon":"star","label":"CEH Track"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"CTF Challenges"},{"icon":"clock","label":"4 Months"},{"icon":"target","label":"SOC/Red Team"}],
        "fees": [{"plan_name":"Standard","price":34999,"features":["Full course","Certificate","Lab access"],"cta_label":"Enroll"},{"plan_name":"Pro","price":59999,"features":["Standard + Exam Voucher (CEH)","Mentorship","Resume Review"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Vulnerability Assessment Report","description":"Conduct a full pentest on a vulnerable lab and write a professional report."},{"title":"CTF Competition","description":"Participate in a CTF and document exploit chains."}],
        "certifications": {"description":"Ethical Hacking certification aligning with CEH objectives.","recognized_companies":["EC-Council","Offensive Security","Mandiant"]},
        "faqs": [{"question":"Is this course legal?","answer":"Yes, we teach ethical hacking in controlled lab environments."},{"question":"Will I get CEH certified?","answer":"The Pro plan includes a CEH exam voucher."}],
    },
    # ── 21. UPSC Coaching ──
    {
        "slug": "upsc-coaching",
        "title": "UPSC Civil Services Coaching",
        "subtitle": "Crack UPSC Prelims, Mains & Interview",
        "description": "Comprehensive preparation for UPSC Civil Services Examination. Covers all GS papers, optional subject guidance, answer writing practice, and mock interviews.",
        "duration": "12 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1501950135003-e5ca74831344?w=800",
        "video_url": VIDEOS[3],
        "video_thumbnail_url": "https://img.youtube.com/vi/T7bxY4F2gvs/maxresdefault.jpg",
        "checklist_items": ["Cover complete UPSC syllabus", "Master answer writing skills", "Attend weekly mock tests", "Get personalized mentorship"],
        "curriculum": [
            {"title":"General Studies I","topics":["Indian Heritage & Culture","Modern Indian History","Geography (World & Indian)","Society & Social Issues"]},
            {"title":"General Studies II","topics":["Indian Constitution & Polity","Governance & Social Justice","International Relations","Public Policy"]},
            {"title":"General Studies III","topics":["Indian Economy","Science & Technology","Environment & Ecology","Internal Security & Disaster Management"]},
            {"title":"General Studies IV & Essay","topics":["Ethics & Integrity","Case Studies","Essay Writing Techniques","Previous Year Analysis"]},
        ],
        "highlights": [{"icon":"code","label":"Full Syllabus"},{"icon":"star","label":"Expert Faculty"},{"icon":"award","label":"Mock Interviews"},{"icon":"users","label":"Answer Writing"},{"icon":"clock","label":"12 Months"},{"icon":"target","label":"IAS/IPS/IFS"}],
        "fees": [{"plan_name":"Standard","price":59999,"features":["Complete course","Study material","Test series"],"cta_label":"Enroll"},{"plan_name":"Pro","price":99999,"features":["Standard + 1:1 Mentorship","Optional Subject","Interview Guidance"],"cta_label":"Get Pro"}],
        "projects": [{"title":"Current Affairs Compilation","description":"Compile monthly current affairs with relevance to GS papers."},{"title":"Model Answer Writing","description":"Write 50+ model answers for GS and Essay papers."}],
        "certifications": {"description":"No formal certification — the goal is UPSC selection. Performance certificate provided.","recognized_companies":[]},
        "faqs": [{"question":"Is this course live or recorded?","answer":"Both live classes and recorded sessions are available."},{"question":"Do you cover optional subjects?","answer":"Yes, the Pro plan includes optional subject guidance."}],
    },
    # ── 22. SSC Coaching ──
    {
        "slug": "ssc-coaching",
        "title": "SSC CGL & CHSL Coaching",
        "subtitle": "Crack SSC exams with confidence",
        "description": "Targeted preparation for SSC CGL, CHSL, and other SSC exams. Covers Quantitative Aptitude, Reasoning, English, and General Awareness with topic-wise tests and full mocks.",
        "duration": "6 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1501950135003-e5ca74831344?w=800",
        "video_url": VIDEOS[4],
        "video_thumbnail_url": "https://img.youtube.com/vi/8jLOx1hDBlw/maxresdefault.jpg",
        "checklist_items": ["Master all SSC topics", "Practice 200+ topic-wise tests", "Attempt 30+ full mock exams", "Improve speed & accuracy"],
        "curriculum": [
            {"title":"Quantitative Aptitude","topics":["Number System & Algebra","Arithmetic (Profit/Loss, SI/CI)","Geometry & Mensuration","Trigonometry & DI"]},
            {"title":"Reasoning","topics":["Verbal (Analogy, Coding)","Non-Verbal (Series, Matrix)","Puzzle & Seating","Critical Reasoning"]},
            {"title":"English Language","topics":["Grammar (Tenses, Voice)","Vocabulary & Cloze Test","Reading Comprehension","Error Spotting"]},
            {"title":"General Awareness","topics":["Indian History & Geography","Polity & Economy","Science & Tech","Current Affairs"]},
        ],
        "highlights": [{"icon":"code","label":"SSC CGL/CHSL"},{"icon":"star","label":"Mock Tests"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Speed Drills"},{"icon":"clock","label":"6 Months"},{"icon":"target","label":"Govt Jobs"}],
        "fees": [{"plan_name":"Standard","price":19999,"features":["Complete course","Mock series","Study material"],"cta_label":"Enroll"},{"plan_name":"Pro","price":34999,"features":["Standard + Doubt Sessions","Personalized Plan","Current Affairs PDF"],"cta_label":"Get Pro"}],
        "projects": [],
        "certifications": {"description":"No certification — goal is SSC exam selection.","recognized_companies":[]},
        "faqs": [{"question":"Is this for CGL and CHSL both?","answer":"Yes, both CGL and CHSL are fully covered."},{"question":"How many mock tests are included?","answer":"30+ full-length mock tests are provided."}],
    },
    # ── 23. Banking Coaching ──
    {
        "slug": "banking-coaching",
        "title": "Banking Exams Coaching - IBPS & SBI",
        "subtitle": "IBPS PO, SBI PO & Clerk preparation",
        "description": "Complete preparation for IBPS PO, SBI PO, IBPS Clerk, and other banking exams. Covers all sections including Quant, Reasoning, English, General Awareness, and Descriptive Writing.",
        "duration": "6 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1501950135003-e5ca74831344?w=800",
        "video_url": VIDEOS[5],
        "video_thumbnail_url": "https://img.youtube.com/vi/3nQ3xI3WlXo/maxresdefault.jpg",
        "checklist_items": ["Cover Quant, Reasoning, English, GA", "Practice 200+ sectional tests", "Attempt 40+ full mocks", "Master descriptive writing"],
        "curriculum": [
            {"title":"Quantitative Aptitude","topics":["Simplification & Approximation","Data Interpretation","Quadratic Equations","Arithmetic Advanced"]},
            {"title":"Reasoning","topics":["Puzzle & Arrangement","Syllogism & Inequality","Data Sufficiency","Machine Input-Output"]},
            {"title":"English","topics":["Reading Comprehension","Cloze Test & Fillers","Para Jumbles","Descriptive (Letter/Essay)"]},
            {"title":"General & Banking Awareness","topics":["Indian Banking System","RBI & Monetary Policy","Financial Awareness","Current Affairs"]},
        ],
        "highlights": [{"icon":"code","label":"IBPS + SBI"},{"icon":"star","label":"Mock Focus"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"Sectional Tests"},{"icon":"clock","label":"6 Months"},{"icon":"target","label":"Banking Jobs"}],
        "fees": [{"plan_name":"Standard","price":24999,"features":["Complete course","Mock series (40+)","Study material"],"cta_label":"Enroll"},{"plan_name":"Pro","price":44999,"features":["Standard + Descriptive Review","Doubt Sessions","Interview Prep"],"cta_label":"Get Pro"}],
        "projects": [],
        "certifications": {"description":"No certification — goal is banking exam selection.","recognized_companies":[]},
        "faqs": [{"question":"Which exams are covered?","answer":"IBPS PO, SBI PO, IBPS Clerk, and RRB."},{"question":"Is descriptive writing covered?","answer":"Yes, the Pro plan includes descriptive review."}],
    },
    # ── 24. Railway Coaching ──
    {
        "slug": "railway-coaching",
        "title": "Railway Exams Coaching - RRB",
        "subtitle": "RRB NTPC, Group D & ALP preparation",
        "description": "Focused preparation for RRB NTPC, Group D, ALP, and other railway recruitment exams. Covers General Science, Maths, Reasoning, General Awareness, and subject-specific topics.",
        "duration": "5 Months", "mode": "Online",
        "hero_image_url": f"{UNSPLASH}/1501950135003-e5ca74831344?w=800",
        "video_url": VIDEOS[0],
        "video_thumbnail_url": "https://img.youtube.com/vi/9J7VwqCpxiY/maxresdefault.jpg",
        "checklist_items": ["Cover railway exam syllabus completely", "Practice subject-wise tests", "Attempt 25+ full mock exams", "Master General Science"],
        "curriculum": [
            {"title":"Mathematics","topics":["Number System","Algebra & Ratio","Time & Work","Speed, Distance & Time"]},
            {"title":"General Intelligence & Reasoning","topics":["Analogy & Classification","Coding-Decoding","Series & Patterns","Logical Reasoning"]},
            {"title":"General Science","topics":["Physics (Motion, Force)","Chemistry (Elements, Reactions)","Biology (Human Body, Cells)","Environment & Ecology"]},
            {"title":"General Awareness","topics":["Current Affairs","Indian Geography","History & Polity","Railway-specific GK"]},
        ],
        "highlights": [{"icon":"code","label":"RRB NTPC/Group D"},{"icon":"star","label":"Subject Tests"},{"icon":"award","label":"Certificate"},{"icon":"users","label":"General Science"},{"icon":"clock","label":"5 Months"},{"icon":"target","label":"Railway Jobs"}],
        "fees": [{"plan_name":"Standard","price":17999,"features":["Complete course","Mock series (25+)","Study material"],"cta_label":"Enroll"},{"plan_name":"Pro","price":29999,"features":["Standard + Doubt Sessions","Personalized Plan","Current Affairs PDF"],"cta_label":"Get Pro"}],
        "projects": [],
        "certifications": {"description":"No certification — goal is railway exam selection.","recognized_companies":[]},
        "faqs": [{"question":"Which railway exams are covered?","answer":"RRB NTPC, Group D, ALP, and Technician."},{"question":"Is General Science covered in depth?","answer":"Yes, Physics, Chemistry, and Biology are covered thoroughly."}],
    },
]

def process_course(cd):
    slug = cd["slug"]
    print(f"\nProcessing: {cd['title']} ({slug})")

    existing = get(f"/rest/v1/courses?slug=eq.{slug}&select=id")
    if not existing:
        print(f"  Course not found! Skipping.")
        return None
    course_id = existing[0]["id"]

    # Update courses table
    patch(f"/rest/v1/courses?id=eq.{course_id}", {
        "subtitle": cd.get("subtitle", ""),
        "description": cd.get("description", ""),
        "duration": cd.get("duration", ""),
        "mode": cd.get("mode", "Online"),
        "hero_image_url": cd.get("hero_image_url", ""),
        "video_url": cd.get("video_url", ""),
        "video_thumbnail_url": cd.get("video_thumbnail_url", ""),
        "checklist_items": cd.get("checklist_items", []),
        "curriculum": cd.get("curriculum", []),
    })
    print(f"  Course fields updated")

    # Highlights
    if cd.get("highlights"):
        delete_by_course("highlights", course_id); time.sleep(0.1)
        for h in cd["highlights"]:
            post("/rest/v1/highlights", {"course_id": course_id, "icon": h["icon"], "label": h["label"]})
        print(f"  Highlights: {len(cd['highlights'])} items")

    # Fees
    if cd.get("fees"):
        delete_by_course("course_fees", course_id); time.sleep(0.1)
        for f in cd["fees"]:
            post("/rest/v1/course_fees", {"course_id": course_id, "plan_name": f["plan_name"], "price": f.get("price"), "currency": "INR", "features": f.get("features", []), "cta_label": f.get("cta_label", "")})
        print(f"  Fees: {len(cd['fees'])} plans")

    # Projects
    if cd.get("projects"):
        delete_by_course("projects", course_id); time.sleep(0.1)
        for p in cd["projects"]:
            post("/rest/v1/projects", {"course_id": course_id, "title": p["title"], "description": p.get("description", "")})
        print(f"  Projects: {len(cd['projects'])} items")

    # Certification
    if cd.get("certifications"):
        delete_by_course("certifications", course_id); time.sleep(0.1)
        cert = cd["certifications"]
        post("/rest/v1/certifications", {"course_id": course_id, "description": cert.get("description", ""), "recognized_companies": cert.get("recognized_companies", [])})
        print(f"  Certification set")

    # FAQs
    if cd.get("faqs"):
        delete_by_course("faqs", course_id); time.sleep(0.1)
        for f in cd["faqs"]:
            post("/rest/v1/faqs", {"course_id": course_id, "question": f["question"], "answer": f.get("answer", "")})
        print(f"  FAQs: {len(cd['faqs'])} items")

    print(f"  Done!")
    return course_id

print("═══ SEEDING ALL COURSE CONTENT ═══")
count = 0
for cd in COURSES:
    process_course(cd)
    count += 1
print(f"\n═══ Done! Processed {count} courses ═══")
