import requests, json, sys

URL = "https://nxlsxywqvvuiljsulito.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA"
HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def get(path):
    r = requests.get(f"{URL}{path}", headers=HEADERS)
    r.raise_for_status()
    return r.json()

def post(path, data):
    r = requests.post(f"{URL}{path}", headers={**HEADERS, "Prefer": "return=representation"}, json=data)
    if r.status_code >= 400:
        print(f"  ERROR {r.status_code}: {r.text}", file=sys.stderr)
        return None
    return r.json()

def delete(path):
    r = requests.delete(f"{URL}{path}", headers=HEADERS)
    if r.status_code >= 400:
        print(f"  DELETE ERROR {r.status_code}: {r.text}", file=sys.stderr)
    else:
        print(f"  Deleted ({r.status_code})")

def slugify(s):
    return s.lower().replace(" & ", "-").replace(" ", "-").replace("/", "-").replace("--", "-").strip("-")

def mk_course(title, subtitle, desc, slug, nav_id, duration, mode, curriculum, checklist):
    return {
        "title": title,
        "subtitle": subtitle,
        "description": desc,
        "slug": slug,
        "nav_item_id": nav_id,
        "status": "published",
        "duration": duration,
        "mode": mode,
        "curriculum": curriculum,
        "checklist_items": checklist,
        "cta_left": "Talk to Advisor",
        "cta_right": "Download Brochure",
    }

print("=== Fetching nav_items ===")
navs = get("/rest/v1/nav_items?select=id,label,parent_label,parent_id")
by_label = {}
by_id = {}
for n in navs:
    by_label[n["label"].strip()] = n
    by_id[n["id"]] = n

print(f"Found {len(navs)} nav items")

# ── 1. DELETE ALL EXISTING COURSES ──
print("\n=== Deleting all courses ===")
courses = get("/rest/v1/courses?select=id")
print(f"Found {len(courses)} courses to delete")
for c in courses:
    delete(f"/rest/v1/courses?id=eq.{c['id']}")

# ── 2. ADD COMPETITIVE EXAM SUB-CATEGORIES ──
print("\n=== Adding Competitive Exam sub-categories ===")
tnpsc = by_label.get("TNPSC")
if not tnpsc:
    print("ERROR: TNPSC not found!", file=sys.stderr)
    sys.exit(1)

ce_parent = tnpsc["id"]

ce_categories = [
    ("UPSC", "Civil Services Examination"),
    ("SSC", "Staff Selection Commission Exams"),
    ("Banking", "IBPS / SBI / RBI Exams"),
    ("Railway", "RRB Exams"),
]

ce_nav_ids = {}

# Check if they already exist
for label, _ in ce_categories:
    existing = [n for n in navs if n.get("parent_id") == ce_parent and n["label"].strip() == label]
    if existing:
        ce_nav_ids[label] = existing[0]["id"]
        print(f"  Found existing {label}: {existing[0]['id']}")
    else:
        slug = f"/competitive-exam/{slugify(label)}"
        data = {"label": label, "path": slug, "parent_id": ce_parent, "parent_label": "Competitive Exam", "sort_order": 0, "is_active": True}
        result = post("/rest/v1/nav_items", data)
        if result:
            ce_nav_ids[label] = result[0]["id"]
            print(f"  Added {label}: {result[0]['id']}")
        else:
            print(f"  FAILED to add {label}")

# Also keep TNPSC
ce_nav_ids["TNPSC"] = tnpsc["id"]

# ── 3. BUILD CATEGORY MAP ──
# For Software Learning: parent nav items (top-level)
sw_cats = {n["label"].strip(): n["id"] for n in navs if n.get("parent_label") == "Software Learning" and n["parent_id"] is None}
# But we need the child categories too. Let me map child label -> child id
sw_children = {}
for n in navs:
    lbl = n["label"].strip()
    pid = n.get("parent_id")
    if pid and lbl in ["Frontend", "Backend", "Programming Fundamentals", "CS Fundamentals",
                         "ML Fundamentals", "Deep Learning", "Native", "Cross-Platform",
                         "Data Analysis", "Data Visualization & SQL",
                         "Cloud Platforms (AWS / Azure / GCP)", "Infrastructure as Code (Terraform / Ansible)",
                         "Ethical Hacking / Pentesting", "Network & Linux Security",
                         "Smart Contract Development", "Full-Stack Web3",
                         "C Programming Foundations", "Microcontrollers & Firmware",
                         "Design Fundamentals", "Figma & Prototyping"]:
        sw_children[lbl] = n["id"]

# Also map parent items without children
sw_parents = {}
for lbl, nid in sw_cats.items():
    sw_parents[lbl] = nid

print(f"\nSoftware Learning parents: {list(sw_cats.keys())}")
print(f"Software Learning children found: {list(sw_children.keys())}")

# ── 4. BUILD ALL COURSES ──
print("\n=== Creating courses (2 per category) ===")
all_courses = []

# Helper
def add2(nav_id, data):
    c1 = mk_course(*data[0][:4], nav_id, *data[0][4:])
    c2 = mk_course(*data[1][:4], nav_id, *data[1][4:])
    all_courses.append(c1)
    all_courses.append(c2)

# ── Software Learning → Child categories ──

# Web Development → Frontend
cid = sw_children.get("Frontend")
if cid:
    add2(cid, (
        ("Modern Frontend Development with React", "Build dynamic UIs", "Master React, TypeScript, and modern CSS to build responsive web applications. Covers component architecture, state management, hooks, and deployment.", "frontend-react-mastery",
         "4 Months", "Online",
         [{"title": "JavaScript & TypeScript Fundamentals", "topics": ["ES6+ Syntax", "TypeScript Basics", "Async Programming"]},
          {"title": "React Core Concepts", "topics": ["JSX & Components", "Props & State", "Hooks Deep Dive"]},
          {"title": "Advanced React Patterns", "topics": ["Context API", "Custom Hooks", "Performance Optimization"]},
          {"title": "Styling & UI Libraries", "topics": ["Tailwind CSS", "Styled Components", "Responsive Design"]},
          {"title": "Testing & Deployment", "topics": ["Jest & React Testing Library", "CI/CD", "Vercel/Netlify Deploy"]}],
         ["Build 3 complete React projects", "Master TypeScript in React", "Implement responsive designs", "Write unit & integration tests"]),
        ("Frontend Fundamentals - HTML, CSS & JavaScript", "The web trifecta", "Learn the core technologies of the web. From semantic HTML to modern CSS layouts and interactive JavaScript.", "frontend-fundamentals",
         "3 Months", "Online",
         [{"title": "HTML5 Semantic Structure", "topics": ["Semantic Elements", "Forms & Validation", "Accessibility"]},
          {"title": "CSS Layout & Design", "topics": ["Flexbox & Grid", "Animations", "Custom Properties"]},
          {"title": "JavaScript Essentials", "topics": ["DOM Manipulation", "Events", "ES6 Modules"]},
          {"title": "Web APIs & Storage", "topics": ["Fetch API", "LocalStorage", "Geolocation"]}],
         ["Build responsive layouts from scratch", "Create interactive web pages", "Use browser APIs effectively", "Follow accessibility best practices"])
    ))
    print("  Added 2 courses for Frontend")

# Web Development → Backend
cid = sw_children.get("Backend")
if cid:
    add2(cid, (
        ("Node.js Backend Development", "Server-side JavaScript", "Build scalable backend services with Node.js, Express, and databases. Covers REST APIs, authentication, and deployment.", "nodejs-backend",
         "4 Months", "Online",
         [{"title": "Node.js Fundamentals", "topics": ["Event Loop", "File System", "Streams & Buffers"]},
          {"title": "Express.js Framework", "topics": ["Routing", "Middleware", "Error Handling"]},
          {"title": "Databases & ORMs", "topics": ["PostgreSQL Basics", "Prisma ORM", "MongoDB with Mongoose"]},
          {"title": "Authentication & Security", "topics": ["JWT", "OAuth", "Helmet & CORS"]},
          {"title": "Deployment & DevOps", "topics": ["Docker", "AWS EC2", "NGINX Reverse Proxy"]}],
         ["Build RESTful APIs from scratch", "Implement JWT authentication", "Connect and query databases", "Deploy to production servers"]),
        ("Python Django REST API", "Python-powered backends", "Learn Django REST Framework to build robust, secure, and maintainable backend APIs.", "django-rest-api",
         "4 Months", "Online",
         [{"title": "Python & Django Basics", "topics": ["Python Review", "Django ORM", "MVT Pattern"]},
          {"title": "Django REST Framework", "topics": ["Serializers", "ViewSets", "Permissions"]},
          {"title": "Advanced API Features", "topics": ["Pagination", "Filtering", "Caching"]},
          {"title": "Testing & Documentation", "topics": ["DRF Testing", "Swagger/OpenAPI", "Postman Collections"]}],
         ["Build production-grade REST APIs", "Master Django ORM", "Implement API security", "Create API documentation"])
    ))
    print("  Added 2 courses for Backend")

# Foundation Courses → Programming Fundamentals
cid = sw_children.get("Programming Fundamentals")
if cid:
    add2(cid, (
        ("C Programming Mastery", "The C language", "Learn C programming from basics to advanced. Covers pointers, memory management, data structures, and system calls.", "c-programming-mastery",
         "3 Months", "Hybrid",
         [{"title": "C Basics", "topics": ["Variables & Types", "Control Flow", "Functions"]},
          {"title": "Pointers & Memory", "topics": ["Pointer Arithmetic", "Dynamic Allocation", "Function Pointers"]},
          {"title": "Data Structures in C", "topics": ["Linked Lists", "Trees", "Hash Tables"]},
          {"title": "File I/O & System Calls", "topics": ["File Operations", "Process Management", "Signals"]}],
         ["Write efficient C programs", "Master pointer manipulation", "Implement data structures from scratch", "Understand memory management"]),
        ("Python Programming Fundamentals", "Python for everyone", "A comprehensive introduction to Python programming. Covers syntax, data structures, OOP, and standard library.", "python-fundamentals",
         "2 Months", "Online",
         [{"title": "Python Basics", "topics": ["Variables & Types", "Lists & Dicts", "Loops & Conditionals"]},
          {"title": "Functions & Modules", "topics": ["Functions & Scope", "Lambda", "Package Management"]},
          {"title": "Object-Oriented Python", "topics": ["Classes & Inheritance", "Magic Methods", "Decorators"]},
          {"title": "Standard Library", "topics": ["File I/O", "JSON & CSV", "Regular Expressions"]}],
         ["Write clean Python code", "Use OOP principles", "Work with files and data formats", "Build CLI tools"])
    ))
    print("  Added 2 courses for Programming Fundamentals")

# Foundation Courses → CS Fundamentals
cid = sw_children.get("CS Fundamentals")
if cid:
    add2(cid, (
        ("Data Structures & Algorithms", "Core CS foundations", "Master essential data structures and algorithms with practical implementations. Covers sorting, searching, graphs, and dynamic programming.", "dsa-complete",
         "4 Months", "Hybrid",
         [{"title": "Arrays & Strings", "topics": ["Two Pointer", "Sliding Window", "String Algorithms"]},
          {"title": "Linked Lists & Stacks", "topics": ["Singly/Doubly LL", "Stack Applications", "Queue Variations"]},
          {"title": "Trees & Graphs", "topics": ["BST", "Tree Traversals", "BFS/DFS", "Shortest Path"]},
          {"title": "Dynamic Programming", "topics": ["Memoization", "Tabulation", "Classic DP Problems"]},
          {"title": "Advanced Topics", "topics": ["Tries", "Union Find", "Segment Trees"]}],
         ["Solve 100+ coding problems", "Analyze time & space complexity", "Master recursion & DP", "Ace technical interviews"]),
        ("Computer Networks & Operating Systems", "Systems under the hood", "Understand how computers communicate and operate at the system level. Covers OS concepts and networking protocols.", "cn-os-fundamentals",
         "3 Months", "Hybrid",
         [{"title": "OS Fundamentals", "topics": ["Process & Threads", "Scheduling", "Memory Management"]},
          {"title": "Networking Basics", "topics": ["OSI Model", "TCP/IP", "HTTP/HTTPS"]},
          {"title": "Advanced OS Topics", "topics": ["File Systems", "Virtual Memory", "IPC"]},
          {"title": "Network Protocols in Depth", "topics": ["DNS", "TLS/SSL", "Load Balancing"]}],
         ["Understand OS internals", "Configure network protocols", "Debug network issues", "Write system-level programs"])
    ))
    print("  Added 2 courses for CS Fundamentals")

# AI & ML → ML Fundamentals
cid = sw_children.get("ML Fundamentals")
if cid:
    add2(cid, (
        ("Machine Learning Foundations", "ML from scratch", "Build a strong foundation in machine learning. Covers supervised and unsupervised learning, model evaluation, and scikit-learn.", "ml-foundations",
         "4 Months", "Online",
         [{"title": "Python for ML", "topics": ["NumPy", "Pandas", "Matplotlib"]},
          {"title": "Supervised Learning", "topics": ["Linear Regression", "Decision Trees", "SVM"]},
          {"title": "Unsupervised Learning", "topics": ["K-Means", "PCA", "DBSCAN"]},
          {"title": "Model Evaluation", "topics": ["Cross-Validation", "Metrics", "Hyperparameter Tuning"]},
          {"title": "Capstone Project", "topics": ["End-to-End Pipeline", "Model Deployment"]}],
         ["Implement ML algorithms from scratch", "Use scikit-learn effectively", "Evaluate and improve model performance", "Deploy ML models"]),
        ("Statistics for Data Science", "Data-driven decisions", "Learn the statistical foundations required for data science. Covers probability, hypothesis testing, and regression analysis.", "statistics-data-science",
         "3 Months", "Online",
         [{"title": "Descriptive Statistics", "topics": ["Measures of Central Tendency", "Variance & Std Dev", "Correlation"]},
          {"title": "Probability Theory", "topics": ["Distributions", "Bayes Theorem", "Law of Large Numbers"]},
          {"title": "Inferential Statistics", "topics": ["Confidence Intervals", "Hypothesis Testing", "ANOVA"]},
          {"title": "Regression & Forecasting", "topics": ["Linear Regression", "Time Series", "ARIMA"]}],
         ["Apply statistical tests confidently", "Build regression models", "Make data-driven decisions", "Visualize statistical findings"])
    ))
    print("  Added 2 courses for ML Fundamentals")

# AI & ML → Deep Learning
cid = sw_children.get("Deep Learning")
if cid:
    add2(cid, (
        ("Deep Learning with TensorFlow", "Neural networks unleashed", "Master deep learning using TensorFlow and Keras. Covers CNNs, RNNs, Transformers, and deployment.", "deep-learning-tensorflow",
         "5 Months", "Online",
         [{"title": "Neural Network Basics", "topics": ["Perceptrons", "Backpropagation", "Activation Functions"]},
          {"title": "Convolutional Neural Networks", "topics": ["Conv Layers", "Pooling", "Transfer Learning"]},
          {"title": "Sequence Models", "topics": ["RNN & LSTM", "GRU", "Attention Mechanism"]},
          {"title": "Transformers & LLMs", "topics": ["Transformer Architecture", "BERT", "Fine-tuning"]},
          {"title": "Production ML", "topics": ["TF Serving", "Model Optimization", "MLOps Basics"]}],
         ["Build CNNs for image classification", "Train sequence models for NLP", "Fine-tune transformer models", "Deploy models to production"]),
        ("PyTorch for Deep Learning", "Research-grade deep learning", "Learn PyTorch for deep learning research and production. Covers autograd, custom models, and GPU training.", "pytorch-deep-learning",
         "5 Months", "Online",
         [{"title": "PyTorch Basics", "topics": ["Tensors", "Autograd", "Datasets & DataLoaders"]},
          {"title": "Custom Models", "topics": ["nn.Module", "Custom Layers", "Loss Functions"]},
          {"title": "Computer Vision with PyTorch", "topics": ["torchvision", "Object Detection", "Segmentation"]},
          {"title": "NLP with PyTorch", "topics": ["Embeddings", "Transformers", "Hugging Face Integration"]},
          {"title": "Distributed Training", "topics": ["Multi-GPU", "Mixed Precision", "Model Parallelism"]}],
         ["Build custom neural architectures", "Train on GPU clusters", "Implement research papers", "Optimize training pipelines"])
    ))
    print("  Added 2 courses for Deep Learning")

# Mobile App Dev → Native
cid = sw_children.get("Native")
if cid:
    add2(cid, (
        ("Android App Development with Kotlin", "Native Android", "Build production-ready Android applications using Kotlin and Jetpack Compose.", "android-kotlin",
         "4 Months", "Hybrid",
         [{"title": "Kotlin Fundamentals", "topics": ["OOP in Kotlin", "Coroutines", "Flow"]},
          {"title": "Jetpack Compose", "topics": ["Composable Functions", "State Management", "Navigation"]},
          {"title": "Architecture Components", "topics": ["ViewModel", "Room DB", "Hilt DI"]},
          {"title": "Networking & Storage", "topics": ["Retrofit", "DataStore", "Firebase Integration"]},
          {"title": "Publishing", "topics": ["App Signing", "Play Store Deploy", "Monetization"]}],
         ["Build 2 complete Android apps", "Master Jetpack Compose", "Implement MVVM architecture", "Publish to Play Store"]),
        ("iOS Development with Swift", "Native iOS", "Develop iOS applications using Swift and SwiftUI. From basics to App Store submission.", "ios-swift",
         "4 Months", "Hybrid",
         [{"title": "Swift Fundamentals", "topics": ["Swift Basics", "Optionals", "Protocols & Extensions"]},
          {"title": "SwiftUI", "topics": ["Views & Modifiers", "Data Flow", "Animations"]},
          {"title": "iOS Frameworks", "topics": ["Core Data", "URLSession", "MapKit"]},
          {"title": "App Architecture", "topics": ["MVVM", "Coordinator Pattern", "Testing"]},
          {"title": "App Store Submission", "topics": ["App Icons & Screenshots", "TestFlight", "Review Guidelines"]}],
         ["Build 2 iOS apps from scratch", "Master SwiftUI and UIKit", "Integrate iOS frameworks", "Submit to App Store"])
    ))
    print("  Added 2 courses for Native")

# Mobile App Dev → Cross-Platform
cid = sw_children.get("Cross-Platform")
if cid:
    add2(cid, (
        ("React Native Mobile Development", "Cross-platform with React", "Build cross-platform mobile apps using React Native. Write once, run on iOS and Android.", "react-native",
         "4 Months", "Online",
         [{"title": "React Native Basics", "topics": ["Environment Setup", "Components", "Navigation"]},
          {"title": "State & Data Management", "topics": ["Redux Toolkit", "React Query", "AsyncStorage"]},
          {"title": "Native Features", "topics": ["Camera & Location", "Push Notifications", "Biometrics"]},
          {"title": "Performance & Testing", "topics": ["Hermes Engine", "Profiling", "Detox Testing"]},
          {"title": "Release & CI/CD", "topics": ["CodePush", "App Center", "Fastlane"]}],
         ["Ship to both app stores", "Access native device APIs", "Optimize app performance", "Set up CI/CD pipelines"]),
        ("Flutter Cross-Platform Development", "Google's UI toolkit", "Build beautiful cross-platform apps with Flutter and Dart. Single codebase for mobile, web, and desktop.", "flutter-development",
         "4 Months", "Online",
         [{"title": "Dart Programming", "topics": ["Dart Basics", "Async/Await", "Streams"]},
          {"title": "Flutter Widgets", "topics": ["Stateless/Stateful Widgets", "Layouts", "Theming"]},
          {"title": "State Management", "topics": ["Provider", "Riverpod", "BLoC"]},
          {"title": "Firebase & Backend", "topics": ["Firebase Auth", "Cloud Firestore", "Push Notifications"]},
          {"title": "Platform Integration", "topics": ["Platform Channels", "Web & Desktop", "App Store Deploy"]}],
         ["Build 3 cross-platform apps", "Master Flutter widget tree", "Implement state management", "Publish to stores"])
    ))
    print("  Added 2 courses for Cross-Platform")

# Data Science → Data Analysis
cid = sw_children.get("Data Analysis")
if cid:
    add2(cid, (
        ("Data Analysis with Python", "Analyze & visualize", "Master data analysis using Python. Covers pandas, numpy, matplotlib, and real-world datasets.", "data-analysis-python",
         "3 Months", "Online",
         [{"title": "Data Wrangling with Pandas", "topics": ["DataFrames", "GroupBy", "Merging & Reshaping"]},
          {"title": "Data Visualization", "topics": ["Matplotlib", "Seaborn", "Plotly"]},
          {"title": "Statistical Analysis", "topics": ["Descriptive Stats", "Correlation", "AB Testing"]},
          {"title": "Real-World Projects", "topics": ["EDA Reports", "Data Cleaning Pipelines", "Dashboard Creation"]}],
         ["Clean and transform messy data", "Create publication-quality visualizations", "Perform statistical analysis", "Build data dashboards"]),
        ("Excel & SQL for Data Analysis", "Business analyst toolkit", "Learn the most widely used tools for data analysis in business settings.", "excel-sql-analysis",
         "2 Months", "Hybrid",
         [{"title": "Advanced Excel", "topics": ["PivotTables", "Power Query", "DAX Formulas"]},
          {"title": "SQL Fundamentals", "topics": ["SELECT Queries", "Joins", "Subqueries"]},
          {"title": "Advanced SQL", "topics": ["Window Functions", "CTEs", "Query Optimization"]},
          {"title": "Business Reporting", "topics": ["KPI Dashboards", "Automated Reports", "Data Storytelling"]}],
         ["Master pivot tables & charts", "Write complex SQL queries", "Automate reporting workflows", "Present data insights"])
    ))
    print("  Added 2 courses for Data Analysis")

# Data Science → Data Visualization & SQL
cid = sw_children.get("Data Visualization & SQL")
if cid:
    add2(cid, (
        ("Data Visualization with Tableau & Power BI", "Visual storytelling", "Create stunning interactive dashboards and reports with industry-leading BI tools.", "tableau-powerbi",
         "3 Months", "Online",
         [{"title": "Tableau Fundamentals", "topics": ["Dimensions & Measures", "Marks Cards", "Calculated Fields"]},
          {"title": "Advanced Tableau", "topics": ["LOD Expressions", "Parameters", "Dashboard Actions"]},
          {"title": "Power BI Desktop", "topics": ["Power Query", "DAX", "Visualizations"]},
          {"title": "Power BI Service", "topics": ["Workspaces", "Row-Level Security", "Scheduled Refresh"]},
          {"title": "Capstone Dashboard", "topics": ["End-to-End BI Solution", "Storytelling with Data"]}],
         ["Build interactive Tableau dashboards", "Create Power BI reports", "Implement row-level security", "Publish and share insights"]),
        ("Advanced SQL & Database Design", "Query like a pro", "Master advanced SQL techniques, query optimization, and database design principles.", "advanced-sql",
         "3 Months", "Online",
         [{"title": "SQL Deep Dive", "topics": ["Complex Joins", "Set Operations", "Recursive CTEs"]},
          {"title": "Performance Optimization", "topics": ["Indexes", "EXPLAIN Plans", "Partitioning"]},
          {"title": "Database Design", "topics": ["Normalization", "ER Diagrams", "Constraints"]},
          {"title": "PL/pgSQL & Functions", "topics": ["Stored Procedures", "Triggers", "Window Functions Advanced"]}],
         ["Write optimized complex queries", "Design normalized databases", "Tune query performance", "Build database functions"])
    ))
    print("  Added 2 courses for Data Visualization & SQL")

# Cloud Computing → Cloud Platforms
cid = sw_children.get("Cloud Platforms (AWS / Azure / GCP)")
if cid:
    add2(cid, (
        ("AWS Solutions Architect", "Amazon Web Services", "Prepare for the AWS Solutions Architect certification. Covers EC2, S3, VPC, Lambda, and architecture best practices.", "aws-solutions-architect",
         "4 Months", "Online",
         [{"title": "AWS Core Services", "topics": ["EC2 & Auto Scaling", "S3 & Storage Classes", "VPC & Networking"]},
          {"title": "Compute & Serverless", "topics": ["Lambda", "ECS/EKS", "API Gateway"]},
          {"title": "Databases on AWS", "topics": ["RDS", "DynamoDB", "ElastiCache"]},
          {"title": "Security & IAM", "topics": ["IAM Policies", "KMS", "WAF & Shield"]},
          {"title": "Architecture & Cost", "topics": ["Well-Architected Framework", "Cost Optimization", "Migration"]}],
         ["Design AWS cloud architectures", "Implement serverless solutions", "Configure security & IAM", "Optimize cloud costs"]),
        ("Google Cloud Platform Essentials", "GCP fundamentals", "Learn Google Cloud Platform services including Compute Engine, GKE, BigQuery, and Cloud Functions.", "gcp-essentials",
         "3 Months", "Online",
         [{"title": "GCP Core Infrastructure", "topics": ["Compute Engine", "Cloud Storage", "VPC"]},
          {"title": "Containers & GKE", "topics": ["Docker on GCP", "Kubernetes Basics", "GKE Clusters"]},
          {"title": "Big Data & AI", "topics": ["BigQuery", "Dataflow", "Vertex AI"]},
          {"title": "Serverless & DevOps", "topics": ["Cloud Functions", "Cloud Run", "Cloud Build"]}],
         ["Deploy apps on GCP", "Use BigQuery for analytics", "Run containers on GKE", "Implement CI/CD pipelines"])
    ))
    print("  Added 2 courses for Cloud Platforms")

# Cloud Computing → Infrastructure as Code
cid = sw_children.get("Infrastructure as Code (Terraform / Ansible)")
if cid:
    add2(cid, (
        ("Terraform - Infrastructure as Code", "Provision at scale", "Learn Terraform to define, provision, and manage cloud infrastructure across AWS, Azure, and GCP.", "terraform-iac",
         "3 Months", "Online",
         [{"title": "Terraform Fundamentals", "topics": ["HCL Syntax", "State Management", "Providers"]},
          {"title": "Modules & Reusability", "topics": ["Module Registry", "Remote State", "Workspaces"]},
          {"title": "Multi-Cloud Deployments", "topics": ["AWS with Terraform", "Azure with Terraform", "GCP with Terraform"]},
          {"title": "CI/CD & Advanced", "topics": ["Terraform Cloud", "Policy as Code", "Drift Detection"]}],
         ["Provision multi-cloud infrastructure", "Write reusable Terraform modules", "Manage state collaboratively", "Automate infrastructure deployment"]),
        ("Ansible - Configuration Management", "Automate everything", "Master Ansible for configuration management, application deployment, and orchestration.", "ansible-config-mgmt",
         "2 Months", "Online",
         [{"title": "Ansible Basics", "topics": ["Inventory", "Playbooks", "Modules"]},
          {"title": "Roles & Galaxy", "topics": ["Role Structure", "Ansible Galaxy", "Reusable Roles"]},
          {"title": "Advanced Automation", "topics": ["Templates (Jinja2)", "Vault & Secrets", "Dynamic Inventory"]},
          {"title": "Ansible Tower/AWX", "topics": ["Job Templates", "Workflows", "RBAC"]}],
         ["Write idempotent playbooks", "Automate server configuration", "Manage secrets securely", "Operate Ansible Tower"])
    ))
    print("  Added 2 courses for Infrastructure as Code")

# Cybersecurity → Ethical Hacking
cid = sw_children.get("Ethical Hacking / Pentesting")
if cid:
    add2(cid, (
        ("Certified Ethical Hacker (CEH)", "Think like a hacker", "Master ethical hacking methodologies. Covers reconnaissance, scanning, exploitation, and reporting.", "ceh-certification",
         "4 Months", "Hybrid",
         [{"title": "Information Gathering", "topics": ["OSINT", "Network Scanning", "Enumeration"]},
          {"title": "System Hacking", "topics": ["Password Cracking", "Privilege Escalation", "Malware Analysis"]},
          {"title": "Web Application Hacking", "topics": ["SQL Injection", "XSS", "CSRF"]},
          {"title": "Network Hacking", "topics": ["Sniffing", "Social Engineering", "Wireless Attacks"]},
          {"title": "Reporting & Ethics", "topics": ["Pen Test Reports", "Legal Framework", "Remediation"]}],
         ["Conduct penetration tests", "Identify OWASP Top 10 vulnerabilities", "Write professional pentest reports", "Understand legal boundaries"]),
        ("Web Application Penetration Testing", "Hack the web", "Specialized training in web application security testing. Hands-on labs and real-world scenarios.", "web-app-pentesting",
         "3 Months", "Hybrid",
         [{"title": "Burp Suite Mastery", "topics": ["Proxy Setup", "Scanner", "Repeater & Intruder"]},
          {"title": "OWASP Top 10 Deep Dive", "topics": ["Injection", "Broken Auth", "XXE"]},
          {"title": "API Security Testing", "topics": ["REST API Testing", "GraphQL Attacks", "JWT Attacks"]},
          {"title": "Advanced Topics", "topics": ["SSRF", "Deserialization", "Race Conditions"]}],
         ["Use Burp Suite professionally", "Exploit OWASP Top 10 vulnerabilities", "Test API security", "Write PoC exploits"])
    ))
    print("  Added 2 courses for Ethical Hacking")

# Cybersecurity → Network & Linux Security
cid = sw_children.get("Network & Linux Security")
if cid:
    add2(cid, (
        ("Network Security Fundamentals", "Secure the network", "Learn network security principles, firewall configuration, IDS/IPS, and VPN technologies.", "network-security",
         "3 Months", "Hybrid",
         [{"title": "Network Security Basics", "topics": ["Security Zones", "Firewall Rules", "NAT & ACLs"]},
          {"title": "IDS/IPS & Monitoring", "topics": ["Snort", "Suricata", "SIEM Basics"]},
          {"title": "VPN & Remote Access", "topics": ["IPSec", "OpenVPN", "WireGuard"]},
          {"title": "Network Forensics", "topics": ["Packet Analysis", "Wireshark", "Log Analysis"]}],
         ["Configure enterprise firewalls", "Deploy IDS/IPS systems", "Set up secure VPNs", "Analyze network traffic"]),
        ("Linux Security Hardening", "Secure Linux systems", "Harden Linux servers against attacks. Covers SELinux, AppArmor, auditd, and security best practices.", "linux-security",
         "2 Months", "Hybrid",
         [{"title": "Linux Security Basics", "topics": ["User Management", "File Permissions", "PAM"]},
          {"title": "Mandatory Access Control", "topics": ["SELinux Policies", "AppArmor Profiles", "Seccomp"]},
          {"title": "Auditing & Monitoring", "topics": ["auditd", "OSQuery", "Fail2ban"]},
          {"title": "Container Security", "topics": ["Docker Security", "Kubernetes Security", "Image Scanning"]}],
         ["Harden Linux servers", "Configure SELinux policies", "Set up audit & monitoring", "Secure container workloads"])
    ))
    print("  Added 2 courses for Network & Linux Security")

# Game Development (no children)
cid = sw_parents.get("Game Development")
if cid:
    add2(cid, (
        ("Unity Game Development", "Create with Unity", "Learn Unity game engine to create 2D and 3D games. Covers C# scripting, physics, and game design patterns.", "unity-game-dev",
         "4 Months", "Hybrid",
         [{"title": "Unity Fundamentals", "topics": ["Scene Setup", "GameObjects", "C# Scripting"]},
          {"title": "2D Game Development", "topics": ["Sprites & Animation", "Tilemaps", "2D Physics"]},
          {"title": "3D Game Development", "topics": ["3D Models", "Lighting", "Terrain"]},
          {"title": "Audio & UI", "topics": ["Audio Mixer", "UI Canvas", "Event System"]},
          {"title": "Publishing & Monetization", "topics": ["Build Settings", "Unity Ads", "In-App Purchases"]}],
         ["Build 2 complete games", "Master C# scripting in Unity", "Implement game mechanics", "Publish to app stores"]),
        ("Unreal Engine 5 Game Development", "Next-gen gaming", "Create stunning games with Unreal Engine 5. Covers Blueprints, nanite, lumen, and advanced rendering.", "unreal-engine-5",
         "5 Months", "Hybrid",
         [{"title": "Unreal Engine Basics", "topics": ["Editor Navigation", "Blueprints", "Materials"]},
          {"title": "Level Design", "topics": ["Landscape", "Nanite Geometry", "Lumen Lighting"]},
          {"title": "Advanced Blueprints", "topics": ["AI Behavior Trees", "Animation Blueprints", "Gameplay Abilities"]},
          {"title": "C++ in Unreal", "topics": ["Unreal C++ Basics", "Gameplay Classes", "Performance Optimization"]},
          {"title": "Shipping the Game", "topics": ["Packaging", "Console Platforms", "Steam Deployment"]}],
         ["Build AAA-quality games", "Master Blueprints visual scripting", "Use Nanite & Lumen", "Optimize game performance"])
    ))
    print("  Added 2 courses for Game Development")

# Blockchain & Web3 → Smart Contract Development
cid = sw_children.get("Smart Contract Development")
if cid:
    add2(cid, (
        ("Solidity Smart Contracts", "Ethereum development", "Write, test, and deploy Ethereum smart contracts using Solidity. Covers ERC standards, security, and gas optimization.", "solidity-smart-contracts",
         "3 Months", "Online",
         [{"title": "Solidity Fundamentals", "topics": ["Data Types", "Functions & Modifiers", "Events"]},
          {"title": "ERC Standards", "topics": ["ERC-20 Tokens", "ERC-721 NFTs", "ERC-1155"]},
          {"title": "DeFi & DApps", "topics": ["Uniswap-style AMM", "Lending Protocols", "Oracles"]},
          {"title": "Security & Auditing", "topics": ["Reentrancy", "Access Control", "Tools (Slither, MythX)"],
          "title": "Foundry & Hardhat", "topics": ["Testing", "Deployment Scripts", "Mainnet Deploy"]}],
         ["Write production-grade smart contracts", "Deploy to Ethereum mainnet", "Audit for vulnerabilities", "Build DeFi protocols"]),
        ("Web3 Full-Stack Development", "Decentralized apps", "Build full-stack decentralized applications using ethers.js, wagmi, and The Graph.", "web3-fullstack",
         "3 Months", "Online",
         [{"title": "Blockchain Fundamentals", "topics": ["Consensus Mechanisms", "Wallets", "Transactions"]},
          {"title": "Frontend + Web3", "topics": ["ethers.js", "wagmi & RainbowKit", "IPFS Integration"]},
          {"title": "Smart Contract Integration", "topics": ["Reading/Writing Contracts", "Event Listening", "Multicall"]},
          {"title": "The Graph & Indexing", "topics": ["Subgraph Definition", "Querying", "Hosted Service"]},
          {"title": "Full-Stack Project", "topics": ["End-to-End DApp", "Testing", "Mainnet Launch"]}],
         ["Build end-to-end DApps", "Integrate wallets & contracts", "Index blockchain data", "Launch on mainnet"])
    ))
    print("  Added 2 courses for Smart Contract Development")

# Blockchain & Web3 → Full-Stack Web3
cid = sw_children.get("Full-Stack Web3")
if cid:
    add2(cid, (
        ("Rust & Solana Development", "High-performance blockchain", "Learn Rust programming and build high-performance decentralized applications on Solana.", "rust-solana-dev",
         "4 Months", "Online",
         [{"title": "Rust Fundamentals", "topics": ["Ownership & Borrowing", "Traits & Generics", "Error Handling"]},
          {"title": "Solana Programming Model", "topics": ["Accounts", "Programs & Instructions", "PDAs"]},
          {"title": "SPL Tokens & NFTs", "topics": ["SPL Token Program", "Metaplex", "Candy Machine"]},
          {"title": "Testing & Deployment", "topics": ["Solana CLI", "Bankrun Tests", "Mainnet Deploy"]}],
         ["Write Solana programs in Rust", "Deploy to Solana mainnet", "Build NFT collections", "Create DeFi protocols"]),
        ("Go & Hyperledger Fabric", "Enterprise blockchain", "Develop enterprise blockchain solutions using Hyperledger Fabric and Go chaincode.", "hyperledger-fabric",
         "3 Months", "Online",
         [{"title": "Go Programming", "topics": ["Go Basics", "Concurrency", "Interfaces"]},
          {"title": "Hyperledger Fabric Architecture", "topics": ["Peers & Orderers", "Channels", "Membership Service Provider"]},
          {"title": "Chaincode Development", "topics": ["Go Chaincode", "Private Data", "State DB"]},
          {"title": "Application Integration", "topics": ["Fabric SDK", "REST API", "Event Handling"]}],
         ["Develop Fabric chaincode", "Set up permissioned networks", "Integrate with enterprise systems", "Implement privacy patterns"])
    ))
    print("  Added 2 courses for Full-Stack Web3")

# Systems & Embedded → C Programming Foundations
cid = sw_children.get("C Programming Foundations")
if cid:
    add2(cid, (
        ("Embedded C Programming", "Microcontroller programming", "Master C programming for embedded systems. Covers registers, interrupts, timers, and communication protocols.", "embedded-c",
         "4 Months", "Hybrid",
         [{"title": "Embedded C Basics", "topics": ["Bit Manipulation", "Volatile Keyword", "Memory-Mapped I/O"]},
          {"title": "Microcontroller Architecture", "topics": ["ARM Cortex-M", "GPIO", "Interrupts"]},
          {"title": "Peripherals & Protocols", "topics": ["UART", "I2C", "SPI", "Timers & PWM"]},
          {"title": "RTOS Fundamentals", "topics": ["FreeRTOS", "Task Scheduling", "Mutexes & Queues"]},
          {"title": "Project: IoT Device", "topics": ["Sensor Integration", "Wireless Comms", "Power Management"]}],
         ["Program microcontrollers in C", "Interface with sensors & peripherals", "Implement RTOS applications", "Build embedded IoT devices"]),
        ("Linux Kernel Programming", "Kernel internals", "Learn Linux kernel module development, device drivers, and kernel internals.", "linux-kernel",
         "5 Months", "Hybrid",
         [{"title": "Kernel Module Basics", "topics": ["Module Skeleton", "Makefile", "Kernel Logging"]},
          {"title": "Character Device Drivers", "topics": ["File Operations", "ioctl", "Kernel Memory"]},
          {"title": "Kernel Internals", "topics": ["Process Scheduler", "Memory Management", "VFS"]},
          {"title": "Advanced Drivers", "topics": ["PCI Drivers", "USB Drivers", "DT Binding"]},
          {"title": "Kernel Debugging", "topics": ["KGDB", "ftrace", "Kprobes"]}],
         ["Write Linux kernel modules", "Develop device drivers", "Debug kernel issues", "Contribute to upstream kernel"])
    ))
    print("  Added 2 courses for C Programming Foundations")

# Systems & Embedded → Microcontrollers & Firmware
cid = sw_children.get("Microcontrollers & Firmware")
if cid:
    add2(cid, (
        ("ARM Cortex-M Firmware Development", "Bare metal firmware", "Develop bare-metal firmware for ARM Cortex-M microcontrollers. Covers startup code, linker scripts, and HAL.", "arm-cortex-firmware",
         "4 Months", "Hybrid",
         [{"title": "ARM Architecture", "topics": ["Cortex-M Overview", "Thumb-2 ISA", "Exception Model"]},
          {"title": "Startup & Linker", "topics": ["Reset Sequence", "Linker Scripts", "Vector Table"]},
          {"title": "HAL & CMSIS", "topics": ["CMSIS-Core", "HAL Drivers", "Clock Configuration"]},
          {"title": "Low-Power & DMA", "topics": ["Sleep Modes", "DMA Transfers", "Event-Driven Design"]},
          {"title": "Production Firmware", "topics": ["Bootloaders", "OTA Updates", "Secure Firmware"]}],
         ["Write bare-metal firmware", "Configure ARM peripherals", "Implement OTA updates", "Optimize power consumption"]),
        ("ESP32 & IoT Firmware", "Connected devices", "Build IoT firmware using ESP32. Covers WiFi, BLE, MQTT, and over-the-air updates.", "esp32-iot",
         "3 Months", "Hybrid",
         [{"title": "ESP32 Architecture", "topics": ["ESP-IDF Setup", "FreeRTOS on ESP32", "Peripheral Overview"]},
          {"title": "WiFi & Networking", "topics": ["WiFi Station/AP", "TCP/IP Stack", "HTTP Client/Server"]},
          {"title": "BLE & Bluetooth", "topics": ["BLE GATT", "BLE Mesh", "Bluetooth Classic"]},
          {"title": "MQTT & Cloud IoT", "topics": ["MQTT Client", "AWS IoT Core", "Azure IoT Hub"]},
          {"title": "OTA & Production", "topics": ["OTA Flashing", "Secure Boot", "Flash Encryption"]}],
         ["Build WiFi-connected IoT devices", "Implement BLE peripherals", "Integrate cloud IoT platforms", "Deploy OTA updates"])
    ))
    print("  Added 2 courses for Microcontrollers & Firmware")

# UI/UX Design → Design Fundamentals
cid = sw_children.get("Design Fundamentals")
if cid:
    add2(cid, (
        ("UI/UX Design Fundamentals", "Design thinking", "Learn design thinking, user research, wireframing, and prototyping. Build a portfolio-ready UX case study.", "uiux-fundamentals",
         "3 Months", "Online",
         [{"title": "Design Thinking Process", "topics": ["Empathize", "Define", "Ideate", "Prototype", "Test"]},
          {"title": "User Research", "topics": ["Interviews", "Surveys", "User Personas"]},
          {"title": "Wireframing & Prototyping", "topics": ["Low-Fidelity Wireframes", "High-Fidelity Mockups", "Interactive Prototypes"]},
          {"title": "Visual Design Principles", "topics": ["Typography", "Color Theory", "Layout & Grids"]},
          {"title": "Portfolio Project", "topics": ["End-to-End Case Study", "Presentation", "Feedback"]}],
         ["Conduct user research", "Create wireframes & prototypes", "Apply visual design principles", "Build a UX portfolio"]),
        ("User Experience Research", "Research-driven design", "Master qualitative and quantitative UX research methods to inform product decisions.", "ux-research",
         "2 Months", "Online",
         [{"title": "Research Planning", "topics": ["Research Questions", "Methodology Selection", "Recruiting"]},
          {"title": "Qualitative Methods", "topics": ["User Interviews", "Contextual Inquiry", "Usability Testing"]},
          {"title": "Quantitative Methods", "topics": ["Surveys", "Analytics", "A/B Testing"]},
          {"title": "Synthesis & Reporting", "topics": ["Affinity Mapping", "Research Reports", "Stakeholder Presentation"]}],
         ["Plan and conduct research studies", "Run usability tests", "Analyze qualitative data", "Present research findings"])
    ))
    print("  Added 2 courses for Design Fundamentals")

# UI/UX Design → Figma & Prototyping
cid = sw_children.get("Figma & Prototyping")
if cid:
    add2(cid, (
        ("Figma Masterclass", "Design in Figma", "Master Figma for UI design, prototyping, and collaboration. Covers components, auto-layout, and design systems.", "figma-masterclass",
         "2 Months", "Online",
         [{"title": "Figma Basics", "topics": ["Interface Overview", "Vector Tools", "Boolean Operations"]},
          {"title": "Components & Variants", "topics": ["Component Properties", "Variants", "Component Libraries"]},
          {"title": "Auto Layout & Constraints", "topics": ["Auto Layout Deep Dive", "Constraints", "Responsive Design"]},
          {"title": "Prototyping & Animation", "topics": ["Smart Animate", "Overlays", "Interactive Components"]},
          {"title": "Design Systems", "topics": ["Design Tokens", "Team Libraries", "Developer Handoff"]}],
         ["Design production UIs in Figma", "Build interactive prototypes", "Create maintainable design systems", "Collaborate with developers"]),
        ("Interactive Prototyping with Framer", "Advanced prototyping", "Learn Framer for high-fidelity interactive prototypes with real code components.", "framer-prototyping",
         "2 Months", "Online",
         [{"title": "Framer Basics", "topics": ["Canvas & Layers", "States & Variants", "Scroll & Sticky"]},
          {"title": "Interactive Components", "topics": ["Overrides", "Animation", "Gesture Handling"]},
          {"title": "Data & Logic", "topics": ["Data Layers", "Conditionals", "API Integration"]},
          {"title": "Production Prototypes", "topics": ["Performance Optimization", "Sharing & Feedback", "Handoff"]}],
         ["Create high-fidelity prototypes", "Add complex interactions", "Integrate real data", "Present to stakeholders"])
    ))
    print("  Added 2 courses for Figma & Prototyping")

# ── 5. COMPETITIVE EXAM COURSES ──
print("\n=== Adding Competitive Exam courses ===")

# TNPSC
cid = ce_nav_ids.get("TNPSC")
if cid:
    add2(cid, (
        ("TNPSC Group 1 - General Studies", "Tamil Nadu's top exam", "Comprehensive preparation for TNPSC Group 1 exam. Covers General Studies, Aptitude, Tamil, and current affairs.", "tnpsc-group-1-gs",
         "6 Months", "Hybrid",
         [{"title": "General Science", "topics": ["Physics Basics", "Chemistry Essentials", "Biology & Environment"]},
          {"title": "Indian Polity", "topics": ["Constitution", "Parliament & Judiciary", "State Government"]},
          {"title": "History & Culture", "topics": ["Ancient India", "Medieval India", "Tamil Nadu History"]},
          {"title": "Geography & Economics", "topics": ["Physical Geography", "Indian Economy", "Tamil Nadu Economy"]},
          {"title": "Aptitude & Tamil", "topics": ["Quantitative Aptitude", "Logical Reasoning", "Tamil Language"]},
          {"title": "Current Affairs", "topics": ["National News", "State News", "International Events"]}],
         ["Master TNPSC Group 1 syllabus", "Practice 2000+ MCQs", "Write effective answers", "Ace the interview"]),
        ("TNPSC Group 2 - General", "Group 2 preparation", "Complete preparation for TNPSC Group 2 (General) exam with focus on the revised syllabus.", "tnpsc-group-2",
         "5 Months", "Hybrid",
         [{"title": "General Studies Paper 1", "topics": ["Polity & Administration", "Geography", "History & Culture"]},
          {"title": "General Studies Paper 2", "topics": ["Indian Economy", "Science & Technology", "Environment"]},
          {"title": "Aptitude & Mental Ability", "topics": ["Quantitative Aptitude", "Data Interpretation", "Mental Ability"]},
          {"title": "Tamil & English", "topics": ["Tamil Grammar", "English Comprehension", "Translation"]},
          {"title": "Interview Preparation", "topics": ["Mock Interviews", "Current Affairs", "Personality Development"]}],
         ["Cover 100% of Group 2 syllabus", "Master time management", "Practice answer writing", "Build interview confidence"])
    ))
    print("  Added 2 courses for TNPSC")

# UPSC
cid = ce_nav_ids.get("UPSC")
if cid:
    add2(cid, (
        ("UPSC Civil Services Prelims", "Crack the prelims", "Comprehensive preparation for UPSC Civil Services Preliminary Examination. Covers GS Paper 1 and CSAT.", "upsc-prelims",
         "8 Months", "Hybrid",
         [{"title": "Indian Polity & Governance", "topics": ["Constitution", "Parliament", "Judiciary", "Federal System"]},
          {"title": "Indian History & Culture", "topics": ["Ancient India", "Medieval India", "Modern India", "Art & Culture"]},
          {"title": "Geography (World & India)", "topics": ["Physical Geography", "Indian Geography", "Climate & Vegetation"]},
          {"title": "Indian Economy", "topics": ["Micro & Macro", "Banking", "Budget", "Economic Survey"]},
          {"title": "Science & Technology", "topics": ["General Science", "Biotechnology", "Space & Defense"]},
          {"title": "CSAT (Paper 2)", "topics": ["Comprehension", "Logical Reasoning", "Quantitative Aptitude", "Decision Making"]}],
         ["Master the Prelims syllabus", "Practice 3000+ MCQs", "Analyze previous year papers", "Mock test series"]),
        ("UPSC Civil Services Mains", "Mains excellence", "Integrated preparation for UPSC Mains Examination with answer writing practice and essay guidance.", "upsc-mains",
         "10 Months", "Hybrid",
         [{"title": "Essay Writing", "topics": ["Essay Structure", "Philosophical Essays", "Contemporary Topics"]},
          {"title": "General Studies 1 (Heritage & Society)", "topics": ["Indian Heritage", "Society & Social Justice", "World History"]},
          {"title": "General Studies 2 (Polity & IR)", "topics": ["Indian Polity", "International Relations", "Governance"]},
          {"title": "General Studies 3 (Economy & Security)", "topics": ["Economic Development", "Security", "Environment"]},
          {"title": "General Studies 4 (Ethics)", "topics": ["Ethical Theories", "Case Studies", "Public Service Values"]},
          {"title": "Optional Subject & Interview", "topics": ["Subject Specialization", "Answer Writing", "Mock Interview"]}],
         ["Master answer writing skills", "Complete 4 GS papers", "Write high-scoring essays", "Excel in personality test"])
    ))
    print("  Added 2 courses for UPSC")

# SSC
cid = ce_nav_ids.get("SSC")
if cid:
    add2(cid, (
        ("SSC CGL - Combined Graduate Level", "SSC CGL complete", "Complete preparation for SSC CGL Tier 1, 2, 3, and 4. Covers all sections with practice tests.", "ssc-cgl",
         "6 Months", "Hybrid",
         [{"title": "General Intelligence & Reasoning", "topics": ["Analogies", "Coding-Decoding", "Puzzles", "Data Sufficiency"]},
          {"title": "General Awareness", "topics": ["Current Affairs", "Indian History", "Geography", "Science"]},
          {"title": "Quantitative Aptitude", "topics": ["Arithmetic", "Algebra", "Geometry", "Trigonometry"]},
          {"title": "English Language", "topics": ["Reading Comprehension", "Grammar", "Vocabulary", "Cloze Test"]},
          {"title": "Tier 2 - Advanced Maths", "topics": ["Advanced Arithmetic", "Statistics", "Mensuration"]},
          {"title": "Tier 3 & 4", "topics": ["Descriptive English", "Skill Test", "Computer Proficiency"]}],
         ["Master all SSC CGL sections", "Solve 5000+ practice questions", "Take 50+ mock tests", "Score 160+ marks"]),
        ("SSC CHSL - 10+2 Level", "SSC CHSL prep", "Comprehensive preparation for SSC CHSL (10+2) examination with detailed coverage of all tiers.", "ssc-chsl",
         "4 Months", "Hybrid",
         [{"title": "General Intelligence", "topics": ["Analogy & Classification", "Series", "Non-Verbal Reasoning"]},
          {"title": "General Awareness", "topics": ["Current Affairs", "Static GK", "Science Basics"]},
          {"title": "Quantitative Aptitude (Basic)", "topics": ["Number System", "Percentage", "Time & Work", "Speed & Distance"]},
          {"title": "English Language", "topics": ["Spotting Errors", "Sentence Improvement", "Comprehension"]},
          {"title": "Skill Test Preparation", "topics": ["Typing Practice", "Data Entry", "Computer Basics"]}],
         ["Cover complete CHSL syllabus", "Practice 3000+ MCQs", "Improve typing speed", "Take full-length tests"])
    ))
    print("  Added 2 courses for SSC")

# Banking
cid = ce_nav_ids.get("Banking")
if cid:
    add2(cid, (
        ("IBPS PO - Probationary Officer", "Banking career starter", "Complete preparation for IBPS PO exam including Prelims, Mains, and Interview.", "ibps-po",
         "6 Months", "Hybrid",
         [{"title": "Reasoning Ability", "topics": ["Puzzles & Seating", "Inequalities", "Syllogism", "Data Sufficiency"]},
          {"title": "Quantitative Aptitude", "topics": ["Simplification", "DI & Graphs", "Arithmetic", "Probability"]},
          {"title": "English Language", "topics": ["Reading Comprehension", "Cloze Test", "Parajumbles", "Error Spotting"]},
          {"title": "General Awareness (Banking)", "topics": ["Banking Awareness", "Current Affairs", "Financial Awareness"]},
          {"title": "Computer Knowledge", "topics": ["Computer Fundamentals", "MS Office", "Internet & Networking"]},
          {"title": "Interview & GD", "topics": ["Banking Domain", "Personality Assessment", "Mock Interview"]}],
         ["Master the Prelims", "Excel in Mains", "Develop banking domain knowledge", "Ace the interview"]),
        ("SBI Clerk (Junior Associate)", "SBI clerical exam", "Focused preparation for SBI Clerk (Junior Associate) examination with updated pattern.", "sbi-clerk",
         "4 Months", "Hybrid",
         [{"title": "Numerical Ability", "topics": ["Simplification", "Number Series", "DI & Graph", "Arithmetic"]},
          {"title": "Reasoning Ability", "topics": ["Alphanumeric Series", "Ranking", "Blood Relations", "Data Sufficiency"]},
          {"title": "English Language", "topics": ["Reading Comprehension", "Fillers", "Sentence Correction"]},
          {"title": "General Awareness", "topics": ["Current Affairs", "Banking Awareness", "Static GK"]},
          {"title": "Computer Aptitude", "topics": ["Computer Basics", "Shortcuts", "MS Office"]}],
         ["Complete SBI Clerk syllabus", "Practice 4000+ questions", "Take sectional tests", "Improve speed & accuracy"])
    ))
    print("  Added 2 courses for Banking")

# Railway
cid = ce_nav_ids.get("Railway")
if cid:
    add2(cid, (
        ("RRB NTPC - Non-Technical", "Railway Jobs", "Comprehensive preparation for RRB NTPC (Graduate/Undergraduate) examinations.", "rrb-ntpc",
         "5 Months", "Hybrid",
         [{"title": "General Awareness", "topics": ["Current Affairs", "Indian Railways", "History & Geography", "Science"]},
          {"title": "Mathematics", "topics": ["Number System", "Algebra", "Geometry", "Trigonometry"]},
          {"title": "General Intelligence & Reasoning", "topics": ["Analogy", "Series", "Coding-Decoding", "Venn Diagram"]},
          {"title": "General Science", "topics": ["Physics", "Chemistry", "Biology", "Environmental Science"]},
          {"title": "Computer Basics", "topics": ["Computer Fundamentals", "Internet", "MS Office"]}],
         ["Cover RRB NTPC syllabus", "Solve 5000+ practice MCQs", "Take 40+ mock tests", "Master time management"]),
        ("RRB ALP - Assistant Loco Pilot", "Technical railway exam", "Targeted preparation for RRB ALP (Assistant Loco Pilot) and Technician exams.", "rrb-alp",
         "5 Months", "Hybrid",
         [{"title": "General Science & Engineering", "topics": ["Physics", "Chemistry", "Engineering Mechanics", "Basic Electricity"]},
          {"title": "Mathematics", "topics": ["Arithmetic", "Algebra", "Mensuration", "Statistics"]},
          {"title": "General Intelligence", "topics": ["Analogies", "Series", "Puzzles", "Data Interpretation"]},
          {"title": "General Awareness", "topics": ["Railway GK", "Current Affairs", "Indian Polity", "Economics"]},
          {"title": "Technical Trades", "topics": ["Trade-Specific Topics", "Safety Procedures", "Maintenance Basics"]}],
         ["Master technical subjects", "Practice 4000+ MCQs", "Railway-specific preparation", "Mock exam series"])
    ))
    print("  Added 2 courses for Railway")

# ── 6. CREATE ALL COURSES ──
print(f"\n=== Creating {len(all_courses)} courses ===")
created = 0
for c in all_courses:
    result = post("/rest/v1/courses", c)
    if result:
        created += 1
print(f"Successfully created {created} out of {len(all_courses)} courses")
