"""Reseed all course and nav data. 5 SL + 5 CE children, 2 subs each, 3-5 courses per sub."""
import requests, sys

URL = "https://nxlsxywqvvuiljsulito.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA"
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
TO = 20

def get(p):
    r = requests.get(f"{URL}{p}", headers=H, timeout=TO); r.raise_for_status(); return r.json()
def post(p, d):
    r = requests.post(f"{URL}{p}", headers={**H, "Prefer": "return=representation"}, json=d, timeout=TO)
    if r.status_code >= 400: print(f"  ERR {r.text[:100]}"); return None
    return r.json()
def delete(p):
    try: requests.delete(f"{URL}{p}", headers=H, timeout=TO)
    except: pass

Z = "00000000-0000-0000-0000-000000000000"
PAGE = {"Services","Training","Contact","Career","About"}

# ── 1. FULL CLEAN ──
print("=== CLEAN ===")
delete(f"/rest/v1/course_tags?course_id=neq.{Z}")
for t in ["course_tabs","faqs","projects","certifications","highlights"]:
    for r in get(f"/rest/v1/{t}?select=id"): delete(f"/rest/v1/{t}?id=eq.{r['id']}")
for c in get("/rest/v1/courses?select=id"): delete(f"/rest/v1/courses?id=eq.{c['id']}")
for n in get("/rest/v1/nav_items?select=id,label"):
    if n["label"].strip() not in PAGE: delete(f"/rest/v1/nav_items?id=eq.{n['id']}")
print("Clean complete.")

# ── 2. TAGS ──
print("=== TAGS ===")
TAGS = ["react","typescript","javascript","html-css","python","nodejs","sql","docker","aws",
    "machine-learning","deep-learning","data-analysis","tableau","cybersecurity","ethical-hacking",
    "android","kotlin","swift","unity","csharp","blockchain","solidity",
    "c-programming","java","flutter","go","rust","linux",
    "upsc","general-studies","history","geography","polity","economy",
    "ssc","reasoning","quantitative-aptitude",
    "ibps","sbi","banking-awareness","rrb","general-science",
    "nda","cds","defence-exams","ctet","teaching-aptitude",
    "gate-cs","gate-ec","clat","cat","xat","logical-reasoning","verbal-ability","statistics"]
tag_map = {}
for t in get("/rest/v1/tags?select=id,name"):
    tag_map[t["name"]] = t["id"]
for t in TAGS:
    if t not in tag_map:
        r = post("/rest/v1/tags", {"name": t})
        if r: tag_map[t] = r[0]["id"]
print(f"  {len(tag_map)} tags.")

# ── 3. NAV ITEMS ──
print("=== NAV ITEMS ===")
def mk_nav(label, path, pid, pl, sort):
    r = post("/rest/v1/nav_items", {"label":label,"path":path,"parent_id":pid,"parent_label":pl,"sort_order":sort,"is_active":True})
    return r[0]["id"] if r else None

# SL: root level (5)
SL1 = [
    ("Web Development","web-dev",1),("AI & Machine Learning","ai-ml",2),
    ("Data Science & Analytics","data-science",3),("Cloud Computing & DevOps","cloud-devops",4),
    ("Cybersecurity","cybersec",5),
]
sl1_ids = {}
for lbl, ps, s in SL1:
    nid = mk_nav(lbl, f"/courses/sl/{ps}", None, "Software Learning", s)
    if nid: sl1_ids[lbl] = nid
    print(f"  SL {lbl}: {nid}")

# SL: sub-level (2 each = 10)
SL2 = [
    ("Web Development","Frontend","frontend"),("Web Development","Backend","backend"),
    ("AI & Machine Learning","ML","ml"),("AI & Machine Learning","Deep Learning","dl"),
    ("Data Science & Analytics","Analysis","analysis"),("Data Science & Analytics","Visualization","viz"),
    ("Cloud Computing & DevOps","Cloud","cloud"),("Cloud Computing & DevOps","DevOps","devops"),
    ("Cybersecurity","Ethical Hacking","ethical"),("Cybersecurity","Network Security","netsec"),
]
sl2_ids = {}
for pl, lbl, ps in SL2:
    pid = sl1_ids.get(pl)
    if pid:
        nid = mk_nav(lbl, f"/courses/sl/{ps}", pid, pl, 1)
        if nid: sl2_ids[(pl, lbl)] = nid

# CE: root level (5)
CE1 = [
    ("UPSC","upsc",1),("SSC","ssc",2),("Banking","banking",3),
    ("Railway","railway",4),("Defence","defence",5),
]
ce1_ids = {}
for lbl, ps, s in CE1:
    nid = mk_nav(lbl, f"/courses/ce/{ps}", None, "Competitive Exam", s)
    if nid: ce1_ids[lbl] = nid
    print(f"  CE {lbl}: {nid}")

# CE: sub-level (2 each = 10)
CE2 = [
    ("UPSC","Prelims","prelims"),("UPSC","Mains","mains"),
    ("SSC","CGL","cgl"),("SSC","CHSL","chsl"),
    ("Banking","IBPS","ibps"),("Banking","SBI","sbi"),
    ("Railway","NTPC","ntpc"),("Railway","Group D","gd"),
    ("Defence","NDA","nda"),("Defence","CDS","cds"),
]
ce2_ids = {}
for pl, lbl, ps in CE2:
    pid = ce1_ids.get(pl)
    if pid:
        nid = mk_nav(lbl, f"/courses/ce/{ps}", pid, pl, 1)
        if nid: ce2_ids[(pl, lbl)] = nid

print(f"  SL L1={len(sl1_ids)} L2={len(sl2_ids)} | CE L1={len(ce1_ids)} L2={len(ce2_ids)}")

# ── 4. COURSE HELPER ──
def course(slug, title, subtitle, desc, nav_id, dur, mode, sp, tagnames, highlights, projects, cert, faqs):
    if not nav_id: return None
    body = {"slug":slug,"title":title,"subtitle":subtitle,"description":desc,"nav_item_id":nav_id,
        "duration":dur,"mode":mode,"status":"Active","is_published":True,"show_pricing":sp,
        "curriculum":[{"title":f"{title} - Module {i+1}","topics":[f"Topic {j+1}" for j in range(4)]} for i in range(4)],
        "hero_image_url":f"https://picsum.photos/seed/{slug}/800/400"}
    r = post("/rest/v1/courses", body)
    if not r: return None
    cid = r[0]["id"]
    for i,(ic,lb) in enumerate(highlights): post("/rest/v1/highlights",{"course_id":cid,"icon":ic,"label":lb,"sort_order":i})
    for i,(pt,pd) in enumerate(projects): post("/rest/v1/projects",{"course_id":cid,"title":pt,"description":pd,"sort_order":i})
    if cert: post("/rest/v1/certifications",{"course_id":cid,"description":cert[0],"recognized_companies":cert[1]})
    for i,(q,a) in enumerate(faqs): post("/rest/v1/faqs",{"course_id":cid,"question":q,"answer":a,"sort_order":i})
    tabs = [
        ("Overview","overview",{"heading":"Why Choose This Course?","paragraph":"Comprehensive program designed by industry experts. Hands-on projects, mentorship, practical skills.","qa":[{"question":"For beginners?","answers":["Starts from fundamentals."]},{"question":"Duration?","answers":["Lifetime access."]}]}),
        ("Syllabus","syllabus",{"heading":"Complete Syllabus","paragraph":"Structured modules with theory, exercises, and case studies.","qa":[{"question":"Structure?","answers":["Lectures, reading, practice per module."]},{"question":"Assessments?","answers":["Quizzes and capstone projects."]}]}),
        ("Pricing","pricing",{"heading":"Flexible Pricing","paragraph":"All plans include lifetime access.","text":"Self-Paced ₹9,999\n• Full access 12 months\n\nMentorship ₹24,999\n• 12 mentor sessions\n\nPro ₹49,999\n• Unlimited mentorship\n• Internship placement\n\nEMI from ₹833/mo"}),
        ("Apply Now","apply_now",{"heading":"Start Today","paragraph":"Next batch starts soon.","text":"How to Apply: 1. Fill form 2. Profile review 3. Free counseling 4. Enroll\n\nNext: July 15 / Aug 1, 2026"})
    ]
    for i,(lb,ct,co) in enumerate(tabs): post("/rest/v1/course_tabs",{"course_id":cid,"label":lb,"content_type":ct,"content":co,"sort_order":i})
    for tn in tagnames:
        ti = tag_map.get(tn)
        if ti: post("/rest/v1/course_tags",{"course_id":cid,"tag_id":ti})
    print(f"  ✓ {title}")
    return cid

# ── 5. SL COURSES ──
print("\n=== SL COURSES ===")
total = 0
def sc(key, *a):
    global total
    n = sl2_ids.get(key)
    if n:
        args = list(a)
        args[4] = n
        r = course(*args)
        if r: total += 1

# Frontend (5)
for a in [
    ("react-mastery","Modern React with TypeScript","Build dynamic UIs","Master React 19, TypeScript, hooks, context, Suspense, server components, and testing.",None,"4 months","Online",True,["react","typescript","javascript","html-css"],[("zap","React 19"),("layers","TypeScript")],[("E-Commerce Dashboard","React dashboard with Chart.js"),("Social Media App","SPA with auth & posts")],("Certified React Dev","Google,Meta,Microsoft".split(",")),[("Experience needed?","Basic HTML/CSS/JS recommended.")]),
    ("vue-nuxt","Vue 3 & Nuxt","Progressive web apps","Vue 3, Composition API, Pinia, Nuxt 3 SSR/SSG. Covers routing, SEO, deployment.",None,"4 months","Online",False,["javascript","html-css"],[("zap","Vue 3"),("layers","Nuxt 3")],[("Blog Platform","Nuxt 3 + Markdown blog"),("Chat App","Vue + WebSocket chat")],("Vue Certified","Meta,GitLab".split(",")),[("Different from Vue 2?","Composition API is major shift.")]),
    ("angular-pro","Angular Enterprise","Large-scale SPAs","Angular 18, RxJS, NgRx, Material. Covers lazy loading, PWA, SSR.",None,"5 months","Online",True,["typescript","javascript"],[("zap","Angular 18"),("layers","RxJS & NgRx")],[("PM Tool","Kanban with Angular Material")],("Angular Certified","Google,Microsoft".split(",")),[("TypeScript required?","Yes.")]),
    ("svelte-apps","Svelte & SvelteKit","The compiler framework","Fast reactive apps with Svelte and SvelteKit. Stores, animations, SSR.",None,"3 months","Online",True,["javascript","html-css"],[("zap","Svelte Reactivity"),("layers","SvelteKit")],[("Dashboard","Svelte + D3.js")],None,[]),
    ("nextjs-fullstack","Next.js Full Stack","React for production","Next.js App Router, server components, API routes, Prisma, PostgreSQL, Vercel.",None,"4 months","Online",True,["react","typescript","nodejs","sql"],[("zap","App Router"),("database","Prisma + Postgres")],[("SaaS Landing","Next.js + Stripe")],("Next.js Certified","Vercel,Netflix".split(",")),[("Prerequisites?","React fundamentals.")]),
]:
    sc(("Web Development","Frontend"), *a)
print(f"  Frontend: 5 courses")

# Backend (3)
for a in [
    ("nodejs-express","Node.js & Express Backend","Scalable APIs","Node.js, Express, PostgreSQL, JWT auth, Redis caching, Docker deployment.",None,"4 months","Online",False,["nodejs","python","sql","docker"],[("database","PostgreSQL & Prisma"),("shield","JWT & OAuth")],[("API Gateway","Rate-limited authenticated API"),("Chat Service","WebSocket chat with Redis")],("Backend Cert","Amazon,Netflix".split(",")),[("Databases?","PostgreSQL, MongoDB, Redis.")]),
    ("python-fastapi","Python FastAPI Backend","High-performance APIs","FastAPI, SQLAlchemy, async Python, OpenAPI docs, testing.",None,"4 months","Online",True,["python","sql","docker"],[("zap","FastAPI Async"),("database","SQLAlchemy ORM")],[("E-Commerce API","FastAPI + PostgreSQL")],("FastAPI Cert","Uber,Netflix".split(",")),[("Python required?","Basic Python needed.")]),
    ("java-spring","Java Spring Boot","Enterprise microservices","Spring Boot, Cloud, JPA, Kafka, microservices, service discovery.",None,"6 months","Online",False,["java","sql","docker"],[("shield","Spring Security"),("layers","Microservices")],[("Order Management","Microservices with Kafka")],None,[]),
]:
    sc(("Web Development","Backend"), *a)
print(f"  Backend: 3 courses")

# ML (5)
for a in [
    ("ml-basics","ML Fundamentals","ML from scratch","scikit-learn, regression, classification, clustering, hyperparameter tuning.",None,"4 months","Online",True,["machine-learning","python","statistics"],[("cpu","Scikit-Learn"),("layers","Model Pipeline")],[("Price Predictor","Regression model"),("Segmenter","K-Means clustering")],("ML Cert","Google,Amazon".split(",")),[("Math needed?","Basic linear algebra and stats.")]),
    ("ml-python-sklearn","Advanced scikit-learn","Production ML","Pipelines, feature selection, ensembles, imbalanced data.",None,"3 months","Online",False,["machine-learning","python"],[("cpu","Ensembles"),("zap","Feature Engineering")],[("Fraud Detection","SMOTE classification")],None,[]),
    ("ml-r","ML with R","Statistical ML","R, caret, tidyverse, statistical modeling.",None,"3 months","Online",True,["machine-learning","statistics"],[("layers","Tidyverse"),("trending","Statistical Models")],[],None,[]),
    ("ml-automl","AutoML with H2O & TPOT","Automated ML","H2O.ai, TPOT, AutoKeras for automated model selection.",None,"2 months","Online",False,["machine-learning","python"],[("zap","H2O AutoML"),("cpu","TPOT")],[],None,[]),
    ("ml-mlops","MLOps Fundamentals","ML in production","ML pipelines, DVC, Docker, model monitoring, drift detection.",None,"3 months","Online",True,["machine-learning","docker"],[("shield","ML Pipelines"),("zap","Model Monitoring")],[("ML Pipeline","End-to-end with MLflow")],None,[]),
]:
    sc(("AI & Machine Learning","ML"), *a)
print(f"  ML: 5 courses")

# Deep Learning (3)
for a in [
    ("dl-tensorflow","Deep Learning with TF","Neural networks","TensorFlow, Keras, CNNs, RNNs, Transformers, GANs.",None,"5 months","Online",True,["deep-learning","tensorflow","python","computer-vision"],[("cpu","CNNs & RNNs"),("zap","Transformers")],[("Image Classifier","CNN 100-class"),("Text Generator","LSTM text")],("TF Certified","Google DeepMind,OpenAI".split(",")),[("GPU needed?","Cloud GPU provided.")]),
    ("dl-pytorch","PyTorch Deep Learning","Flexible deep learning","PyTorch, autograd, nn.Module, TorchScript.",None,"5 months","Online",True,["deep-learning","python"],[("cpu","PyTorch"),("layers","nn.Module")],[("Style Transfer","Neural style with PyTorch")],("PyTorch Cert","Meta AI,Tesla".split(",")),[]),
    ("dl-nlp","NLP with Transformers","Natural language processing","BERT, GPT, T5, Hugging Face, LLM fine-tuning.",None,"4 months","Online",False,["deep-learning","nlp","python"],[("zap","Transformers"),("layers","BERT & GPT")],[("Sentiment Analyzer","BERT sentiment"),("Chatbot","Fine-tuned GPT")],None,[]),
]:
    sc(("AI & Machine Learning","Deep Learning"), *a)
print(f"  DL: 3 courses")

# Analysis (5)
for a in [
    ("da-pandas","Data Analysis with Pandas","Python data analysis","Pandas, NumPy, Matplotlib, data cleaning, transformation, analysis.",None,"3 months","Online",True,["data-analysis","python","sql"],[("layers","Pandas & NumPy"),("zap","Data Cleaning")],[("Sales Analysis","100K rows pandas analysis")],("Data Analyst Cert","Deloitte,KPMG".split(",")),[]),
    ("da-sql","SQL for Data Analysis","Querying for insights","Window functions, CTEs, query optimization, analytical SQL.",None,"3 months","Online",False,["sql","data-analysis"],[("database","Window Functions"),("zap","Query Optimization")],[("E-Commerce Analytics","SQL order analysis")],None,[]),
    ("da-excel","Advanced Excel Analytics","Spreadsheet mastery","Power Query, Power Pivot, DAX, macros, charts.",None,"2 months","Online",True,["data-analysis"],[("layers","Power Query"),("zap","DAX Formulas")],[],None,[]),
    ("da-python-stats","Python Statistics","Statistical foundations","Hypothesis testing, probability, Bayesian inference, regression.",None,"3 months","Online",False,["statistics","python"],[("cpu","SciPy Stats"),("trending","Hypothesis Testing")],[("A/B Testing","Statistical analysis")],None,[]),
    ("da-etl","ETL Pipelines","Extract, transform, load","Python, Airflow, dbt, data warehousing, orchestration.",None,"4 months","Online",True,["python","sql","docker"],[("layers","Apache Airflow"),("database","dbt")],[],None,[]),
]:
    sc(("Data Science & Analytics","Analysis"), *a)
print(f"  Analysis: 5 courses")

# Visualization (3)
for a in [
    ("dv-tableau","Tableau Desktop","Interactive dashboards","Tableau, calculated fields, LOD expressions, parameters, dashboards.",None,"3 months","Online",True,["tableau","data-analysis"],[("zap","Tableau Desktop"),("layers","LOD Expressions")],[("Executive Dashboard","KPI dashboard in Tableau")],("Tableau Certified","Tableau,Deloitte".split(",")),[]),
    ("dv-powerbi","Power BI","Microsoft BI","Power BI Desktop, DAX, Power Query, row-level security, deployment.",None,"3 months","Online",False,["sql","data-analysis"],[("layers","Power BI Desktop"),("zap","DAX Formulas")],[("HR Analytics","Power BI HR dashboard")],None,[]),
    ("dv-python-viz","Python Plotly","Interactive Python","Plotly, Dash, Streamlit for interactive data apps.",None,"2 months","Online",True,["python","data-analysis"],[("zap","Plotly Express"),("layers","Dash Apps")],[],None,[]),
]:
    sc(("Data Science & Analytics","Visualization"), *a)
print(f"  Visualization: 3 courses")

# Cloud (5)
for a in [
    ("aws-solutions","AWS Solutions Architect","AWS certification","EC2, S3, RDS, Lambda, VPC, IAM, CloudFront, best practices.",None,"4 months","Online",True,["aws","docker"],[("globe","AWS Global"),("shield","IAM & Security")],[("Multi-Tier App","VPC + ALB + EC2 + RDS")],("AWS Certified","Amazon,Netflix".split(",")),[]),
    ("azure-arch","Azure Solutions Architect","Microsoft Azure","Azure VMs, App Services, SQL, Functions, DevOps.",None,"4 months","Online",False,["azure","docker"],[("globe","Azure Regions"),("shield","Azure AD")],[],None,[]),
    ("gcp-arch","Google Cloud Architect","GCP certification","Compute Engine, GKE, Cloud Storage, BigQuery, Cloud Functions.",None,"4 months","Online",True,["gcp","docker"],[("globe","GCP Services"),("zap","GKE & Cloud Run")],[],("GCP Certified","Google".split(",")),[]),
    ("multi-cloud","Multi-Cloud Strategy","AWS + Azure + GCP","Multi-cloud architecture, migration, cost optimization, vendor management.",None,"5 months","Online",False,["aws","azure","gcp"],[("globe","Multi-Cloud"),("shield","Cloud Security")],[],None,[]),
    ("terraform-iac","Terraform IaC","Infrastructure as Code","Terraform state, modules, workspaces, multi-cloud provisioning.",None,"3 months","Online",True,["aws","gcp"],[("layers","Terraform HCL"),("zap","Modules & State")],[("Multi-Cloud Infra","Terraform AWS+Azure+GCP")],("Terraform Certified","HashiCorp".split(",")),[]),
]:
    sc(("Cloud Computing & DevOps","Cloud"), *a)
print(f"  Cloud: 5 courses")

# DevOps (3)
for a in [
    ("docker-k8s","Docker & Kubernetes","Container orchestration","Docker Compose, K8s pods, services, Helm, monitoring.",None,"4 months","Online",True,["docker","aws"],[("zap","Docker Compose"),("layers","K8s")],[("Microservices K8s","EKS deployment")],("CKA Certified","CNCF,Google".split(",")),[]),
    ("cicd-pipelines","CI/CD Pipelines","Automated deployment","GitHub Actions, GitLab CI, Jenkins, ArgoCD.",None,"3 months","Online",False,["git","docker","aws"],[("zap","GitHub Actions"),("layers","ArgoCD")],[],None,[]),
    ("monitoring","Monitoring with Prometheus","Observability","PromQL, Grafana dashboards, alerting rules, SLI/SLO.",None,"3 months","Online",True,["docker"],[("trending","PromQL"),("zap","Grafana")],[],None,[]),
]:
    sc(("Cloud Computing & DevOps","DevOps"), *a)
print(f"  DevOps: 3 courses")

# Ethical Hacking (5)
for a in [
    ("ceh-class","Certified Ethical Hacker","CEH v12","Footprinting, scanning, enumeration, exploitation, CEH syllabus.",None,"4 months","Online",True,["ethical-hacking","cybersecurity","penetration-testing"],[("shield","CEH v12"),("zap","Lab Exercises")],[("Pentest Lab","DVWA pentest lab")],("EC-Council CEH","EC-Council".split(",")),[]),
    ("oscp-prep","OSCP Penetration Testing","Offensive Security","Buffer overflows, web exploitation, privilege escalation, AD attacks.",None,"5 months","Online",True,["ethical-hacking","penetration-testing"],[("zap","Buffer Overflow"),("shield","AD Attacks")],[("AD Lab","Active Directory attack lab")],("OSCP Certified","Offensive Security".split(",")),[]),
    ("web-pentest","Web App Pentesting","OWASP Top 10","SQL injection, XSS, CSRF, SSRF, Burp Suite, API testing.",None,"3 months","Online",False,["ethical-hacking","penetration-testing"],[("zap","OWASP Top 10"),("layers","Burp Suite")],[],None,[]),
    ("red-team","Red Team Operations","Adversary simulation","C2 frameworks, phishing, persistence, defense evasion.",None,"5 months","Online",True,["ethical-hacking","cybersecurity"],[("shield","C2 Frameworks"),("zap","Phishing")],[],None,[]),
    ("bug-bounty","Bug Bounty Hunting","Find vulnerabilities","Reconnaissance, vuln discovery, disclosure, platform strategies.",None,"3 months","Online",False,["ethical-hacking","penetration-testing"],[("zap","Recon Techniques"),("award","Disclosure Process")],[],None,[]),
]:
    sc(("Cybersecurity","Ethical Hacking"), *a)
print(f"  Ethical Hacking: 5 courses")

# Network Security (3)
for a in [
    ("netsec-fund","Network Security Fundamentals","Secure networks","Firewalls, IDS/IPS, VPNs, network segmentation, security monitoring.",None,"3 months","Online",True,["network-security","cybersecurity"],[("shield","Firewalls & IDS/IPS"),("globe","VPN")],[],("Security+","CompTIA".split(",")),[]),
    ("cloud-sec","Cloud Security Architecture","Secure the cloud","Shared responsibility, CSPM, CASB, cloud IAM, incident response.",None,"4 months","Online",False,["cloud-security","aws","azure"],[("shield","CSPM"),("globe","Cloud IAM")],[],None,[]),
    ("soc-analyst","SOC Analyst & Blue Team","Defend the enterprise","SIEM, SOAR, threat intel, incident response, forensics.",None,"4 months","Online",True,["cybersecurity","network-security"],[("zap","SIEM & SOAR"),("shield","Incident Response")],[],None,[]),
]:
    sc(("Cybersecurity","Network Security"), *a)
print(f"  Network Security: 3 courses")

# ── 6. CE COURSES ──
print("\n=== CE COURSES ===")
def cc(key, *a):
    global total
    n = ce2_ids.get(key)
    if n:
        args = list(a)
        args[4] = n
        r = course(*args)
        if r: total += 1

# UPSC Prelims (5)
for a in [
    ("upsc-prelims-gs","UPSC Prelims GS","GS Paper I & II","History, Geography, Polity, Economy, Science, Environment. Complete Prelims coverage.",None,"6 months","Online+Offline",True,["upsc","general-studies","history","geography","polity","economy"],[("book","Complete GS"),("zap","Mock Tests")],[],None,[("Coverage?","Entire GS Prelims syllabus.")]),
    ("upsc-prelims-csat","UPSC CSAT","Aptitude paper","Quant, reasoning, comprehension, data interpretation for CSAT.",None,"4 months","Online",False,["upsc","reasoning","quantitative-aptitude"],[("zap","CSAT Focus"),("layers","Quant")],[],None,[]),
    ("upsc-current","UPSC Current Affairs 2026","Daily current events","Daily analysis, monthly magazine, budget, schemes.",None,"12 months","Online",True,["upsc","general-studies","economy"],[("zap","Daily Analysis"),("book","Monthly Magazine")],[],None,[]),
    ("upsc-maps","UPSC Map Questions","Geography through maps","World & India maps, places in news, geographical features.",None,"3 months","Online",True,["upsc","geography"],[("globe","Map-Based"),("zap","Places in News")],[],None,[]),
    ("upsc-science","UPSC Science & Tech","Science for Prelims","Biology, Physics, Chemistry, space tech, biotech.",None,"3 months","Online",False,["upsc","general-studies"],[("zap","Science"),("trending","Tech News")],[],None,[]),
]:
    cc(("UPSC","Prelims"), *a)
print(f"  Prelims: 5 courses")

# UPSC Mains (3)
for a in [
    ("upsc-mains-gs","UPSC Mains GS","GS Papers I-IV","Answer writing, evaluation, feedback for all 4 GS papers.",None,"8 months","Online+Offline",True,["upsc","general-studies","history","polity","economy","geography"],[("book","GS I-IV"),("zap","Answer Writing"),("message","Personal Evaluation")],[],None,[]),
    ("upsc-essay","UPSC Essay","Essay writing","Structure, topics, practice with one-on-one feedback.",None,"4 months","Online",True,["upsc"],[("zap","Essay Structure"),("message","Personal Feedback")],[],None,[]),
    ("upsc-optional","UPSC Optional Subject","Sociology/Geography/PA","In-depth optional coverage with PYQ analysis.",None,"6 months","Online",False,["upsc"],[("book","Optional"),("trending","PYQ Analysis")],[],None,[]),
]:
    cc(("UPSC","Mains"), *a)
print(f"  Mains: 3 courses")

# SSC CGL (5)
for a in [
    ("ssc-cgl-quant","SSC CGL Quantitative Aptitude","Maths for CGL","Number system, algebra, geometry, trigonometry, DI.",None,"5 months","Online",True,["ssc","quantitative-aptitude"],[("zap","Advanced Maths"),("layers","DI")],[],None,[]),
    ("ssc-cgl-reasoning","SSC CGL Reasoning","Logical & analytical","Verbal, non-verbal reasoning, puzzles, critical thinking.",None,"4 months","Online",False,["ssc","reasoning"],[("zap","Puzzles"),("layers","Non-Verbal")],[],None,[]),
    ("ssc-cgl-english","SSC CGL English","Grammar & vocab","Grammar, vocabulary, comprehension, descriptive writing.",None,"4 months","Online",True,["ssc","english"],[("zap","Grammar & Vocab"),("book","Descriptive")],[],None,[]),
    ("ssc-cgl-gk","SSC CGL General Awareness","Static GK & current","History, geography, polity, economy, science.",None,"5 months","Online",True,["ssc","general-studies"],[("book","Static GK"),("trending","Current Affairs")],[],None,[]),
    ("ssc-cgl-mocks","SSC CGL Mock Series","Practice & evaluate","50+ mocks, 200+ sectional tests, detailed solutions.",None,"6 months","Online",False,["ssc","reasoning","english"],[("zap","Mock Tests"),("trending","Rank Analysis")],[],None,[]),
]:
    cc(("SSC","CGL"), *a)
print(f"  CGL: 5 courses")

# SSC CHSL (3)
for a in [
    ("ssc-chsl-combo","SSC CHSL Complete","All subjects","Quant, reasoning, English, GK for CHSL Tier I & II.",None,"4 months","Online",True,["ssc","reasoning","english"],[("layers","All Subjects"),("zap","Mock Tests")],[],None,[]),
    ("ssc-chsl-desc","SSC CHSL Descriptive","Essay & letter","Essay, letter writing for CHSL Tier II.",None,"2 months","Online",False,["ssc","english"],[("zap","Descriptive"),("message","Evaluation")],[],None,[]),
    ("ssc-chsl-gk","SSC CHSL GK","GK for CHSL","Static GK and current affairs for CHSL pattern.",None,"3 months","Online",True,["ssc","general-studies"],[("book","CHSL GK"),("trending","Current Affairs")],[],None,[]),
]:
    cc(("SSC","CHSL"), *a)
print(f"  CHSL: 3 courses")

# IBPS (5)
for a in [
    ("ibps-po","IBPS PO Complete","Probationary Officer","Quant, reasoning, English, GK, computer for PO Prelims & Mains.",None,"6 months","Online",True,["ibps","banking-awareness","reasoning","english"],[("book","Complete Syllabus"),("zap","Mock Tests")],[],None,[]),
    ("ibps-clerk","IBPS Clerk","Clerical cadre","Simplified quant, reasoning, English, GK, computer.",None,"4 months","Online",True,["ibps","banking-awareness","quantitative-aptitude"],[("zap","Clerk Focus"),("layers","Simplified Quant")],[],None,[]),
    ("ibps-so","IBPS Specialist Officer","SO preparation","IT, Agriculture, HR, Marketing, Law officer streams.",None,"5 months","Online",False,["ibps","banking-awareness"],[("layers","SO Streams"),("zap","Professional Knowledge")],[],None,[]),
    ("ibps-aao","IBPS AO & AAO","Accounting officer","Accounting, finance, taxation, auditing.",None,"4 months","Online",True,["ibps"],[("zap","Accounting"),("trending","Finance & Tax")],[],None,[]),
    ("ibps-mocks","IBPS Mock Series","Practice for IBPS","50+ mocks for PO/Clerk/SO with analysis.",None,"6 months","Online",False,["ibps","banking-awareness"],[("zap","Full-Length Mocks"),("trending","Performance Analysis")],[],None,[]),
]:
    cc(("Banking","IBPS"), *a)
print(f"  IBPS: 5 courses")

# SBI (3)
for a in [
    ("sbi-po","SBI PO Complete","State Bank PO","Quant, reasoning, English, GK, descriptive, GD/PI.",None,"6 months","Online",True,["sbi","banking-awareness","reasoning","english"],[("award","SBI PO"),("zap","GD/PI Prep")],[],None,[]),
    ("sbi-clerk","SBI Clerk","Junior associate","Focused SBI Clerk with simplified study plan.",None,"4 months","Online",True,["sbi","banking-awareness"],[("zap","Clerk Pattern"),("book","Simplified")],[],None,[]),
    ("sbi-mocks","SBI Mock Series","SBI mocks","Full-length mocks for PO and Clerk.",None,"6 months","Online",False,["sbi","banking-awareness"],[("zap","SBI Mocks"),("message","Descriptive Evaluation")],[],None,[]),
]:
    cc(("Banking","SBI"), *a)
print(f"  SBI: 3 courses")

# NTPC (5)
for a in [
    ("rrb-ntpc-combo","RRB NTPC Complete","Graduate & undergrad","Quant, reasoning, GK, science for CBT 1 & 2.",None,"5 months","Online",True,["rrb","general-science","reasoning","quantitative-aptitude"],[("book","NTPC Syllabus"),("zap","Mock Tests")],[],None,[]),
    ("rrb-ntpc-gk","RRB General Awareness","GK for railway","History, geography, polity, economy, railway current affairs.",None,"3 months","Online",False,["rrb","general-studies"],[("layers","Railway GK"),("trending","Current Affairs")],[],None,[]),
    ("rrb-ntpc-math","RRB NTPC Maths","Mathematics","Number system, algebra, geometry, trigonometry, DI.",None,"4 months","Online",True,["rrb","quantitative-aptitude"],[("zap","Advanced Maths"),("layers","DI")],[],None,[]),
    ("rrb-ntpc-reason","RRB NTPC Reasoning","Reasoning","Analogies, coding-decoding, syllogism, puzzles.",None,"3 months","Online",True,["rrb","reasoning"],[("zap","Puzzles & Syllogism"),("layers","Non-Verbal")],[],None,[]),
    ("rrb-ntpc-science","RRB General Science","Science for railway","Physics, chemistry, biology basics.",None,"3 months","Online",False,["rrb","general-science"],[("zap","Physics & Chem"),("book","Biology")],[],None,[]),
]:
    cc(("Railway","NTPC"), *a)
print(f"  NTPC: 5 courses")

# Group D (3)
for a in [
    ("rrb-gd-combo","RRB Group D Complete","Level 1 posts","Science, math, reasoning, GK, physical test prep.",None,"4 months","Online",True,["rrb","general-science","reasoning"],[("zap","Group D Focus"),("trending","Physical Test")],[],None,[]),
    ("rrb-gd-science","RRB Group D Science","Science basics","Physics, chemistry, biology basics for Group D.",None,"2 months","Online",False,["rrb","general-science"],[("book","Science Basics"),("zap","Quick Revision")],[],None,[]),
    ("rrb-gd-mocks","RRB Group D Mocks","Practice","30+ mocks with section-wise analysis.",None,"4 months","Online",True,["rrb","general-science","reasoning"],[("zap","Group D Mocks"),("trending","Analysis")],[],None,[]),
]:
    cc(("Railway","Group D"), *a)
print(f"  Group D: 3 courses")

# NDA (5)
for a in [
    ("nda-maths","NDA Mathematics","Maths for NDA","Algebra, trigonometry, calculus, vectors, statistics.",None,"5 months","Online",True,["nda","defence-exams","quantitative-aptitude"],[("zap","NDA Math"),("layers","Calculus")],[],None,[]),
    ("nda-gat","NDA General Ability","GAT","English, GK, physics, chemistry, bio, history, geography.",None,"5 months","Online",False,["nda","defence-exams","general-studies","english"],[("book","Complete GAT"),("zap","English & GK")],[],None,[]),
    ("nda-ssb","NDA SSB Interview","Officer selection","OIR, PPDT, TAT, WAT, SRT, GTO, interview.",None,"2 months","Online+Offline",True,["nda","defence-exams"],[("message","SSB Coaching"),("zap","GTO Tasks")],[],None,[]),
    ("nda-english","NDA English","English prep","Grammar, vocab, comprehension, spotting errors.",None,"3 months","Online",True,["nda","english"],[("zap","Grammar & Vocab"),("book","Comprehension")],[],None,[]),
    ("nda-gk","NDA GK","Defence GK","Current affairs, defence news, static GK.",None,"3 months","Online",False,["nda","general-studies"],[("trending","Current Affairs"),("book","Static GK")],[],None,[]),
]:
    cc(("Defence","NDA"), *a)
print(f"  NDA: 5 courses")

# CDS (3)
for a in [
    ("cds-combo","CDS Combined Defence","CDS OTA & Academy","English, GK, maths for CDS written + SSB.",None,"6 months","Online",True,["cds","defence-exams","english","general-studies"],[("layers","CDS Written"),("zap","SSB Preparation")],[],None,[]),
    ("cds-english","CDS English Language","English for CDS","Grammar, vocab, para jumbles, comprehension.",None,"3 months","Online",False,["cds","english"],[("zap","CDS Pattern"),("book","Vocabulary")],[],None,[]),
    ("cds-mocks","CDS Mock Series","Practice","Full-length mocks for CDS written exam.",None,"4 months","Online",True,["cds","defence-exams"],[("zap","CDS Mocks"),("trending","All India Rank")],[],None,[]),
]:
    cc(("Defence","CDS"), *a)
print(f"  CDS: 3 courses")

print(f"\n{'='*50}")
print(f"TOTAL COURSES: {total}")
print(f"{'='*50}")
