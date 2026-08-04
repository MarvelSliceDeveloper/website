import requests, json, sys, time

URL = "https://nxlsxywqvvuiljsulito.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA"
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def get(path):
    r = requests.get(f"{URL}{path}", headers=H); r.raise_for_status(); return r.json()
def post(path, data):
    r = requests.post(f"{URL}{path}", headers={**H, "Prefer": "return=representation"}, json=data)
    if r.status_code >= 400: print(f"  POST ERR {r.status_code}: {r.text[:120]}", file=sys.stderr); return None
    return r.json()
def delete(path):
    r = requests.delete(f"{URL}{path}", headers=H)
    if r.status_code >= 400: print(f"  DEL ERR {r.status_code}: {r.text[:120]}", file=sys.stderr)

print("=== Deleting existing course_tabs and courses ===")
for t in get("/rest/v1/course_tabs?select=id"): delete(f"/rest/v1/course_tabs?id=eq.{t['id']}")
for c in get("/rest/v1/courses?select=id"): delete(f"/rest/v1/courses?id=eq.{c['id']}")
print("All cleared.")

print("\n=== Fetching nav item children ===")
navs = get("/rest/v1/nav_items?select=id,label,parent_id,parent_label")
# Only children (have parent_id) and top-level SW/CE parents that have no children
children = [n for n in navs if n["parent_id"] is not None]
parents_without_children = [
    n for n in navs
    if n["parent_id"] is None and n["parent_label"] in ("Software Learning", "Competitive Exam")
    and not any(c["parent_id"] == n["id"] for c in children)
]
targets = children + parents_without_children
print(f"Found {len(targets)} categories to add courses for")

# Map parent_labels for categorization
def parent_group(n):
    if n["parent_id"] is None:
        return n["parent_label"] or "Other"
    # Walk up to find parent_label
    by_id = {x["id"]: x for x in navs}
    pid = n["parent_id"]
    while pid:
        p = by_id.get(pid)
        if not p: break
        if p["parent_label"]: return p["parent_label"]
        pid = p["parent_id"]
    return n["parent_label"] or "Other"

COURSES = {
    # {nav_id: (title, subtitle, desc, slug, duration, mode)}
}

def make_course(title, subtitle, desc, slug, duration, mode):
    return {
        "title": title, "subtitle": subtitle, "description": desc, "slug": slug,
        "status": "published", "duration": duration, "mode": mode,
        "curriculum": [
            {"title": f"{title} - Module 1", "topics": ["Introduction & Setup", "Core Concepts", "Hands-On Practice"]},
            {"title": f"{title} - Module 2", "topics": ["Advanced Topics", "Best Practices", "Real-World Applications"]},
            {"title": f"{title} - Module 3", "topics": ["Project Work", "Review & Optimization", "Final Assessment"]}
        ],
        "checklist_items": ["Gain practical hands-on experience", "Build real-world projects", "Earn completion certificate"],
        "hero_image_url": f"https://picsum.photos/seed/{slug}/800/400",
    }

def add(nav_id, title, subtitle, desc, slug, duration, mode):
    COURSES[nav_id] = (title, subtitle, desc, slug, duration, mode)

# ── Software Learning Children ──
for n in targets:
    lbl = n["label"].strip()
    if lbl == "Frontend":
        add(n["id"], "Frontend Web Development", "Build modern web interfaces",
            "Learn HTML, CSS, JavaScript, and React to build responsive, interactive web applications.",
            "frontend-dev", "3 Months", "Online")
    elif lbl == "Backend":
        add(n["id"], "Backend Development with Node.js", "Server-side programming",
            "Build RESTful APIs and web services using Node.js, Express, and databases.",
            "backend-dev", "3 Months", "Online")
    elif lbl == "Programming Fundamentals":
        add(n["id"], "Programming Fundamentals", "Core programming concepts",
            "Master the fundamentals of programming using Python. Covers data types, control flow, functions, and basic algorithms.",
            "programming-fundamentals", "2 Months", "Online")
    elif lbl == "CS Fundamentals":
        add(n["id"], "Computer Science Fundamentals", "Core CS concepts",
            "Learn data structures, algorithms, and computer science principles essential for technical interviews.",
            "cs-fundamentals", "3 Months", "Hybrid")
    elif lbl == "ML Fundamentals":
        add(n["id"], "Machine Learning Fundamentals", "Introduction to ML",
            "Understand supervised and unsupervised learning, model evaluation, and scikit-learn.",
            "ml-fundamentals", "3 Months", "Online")
    elif lbl == "Deep Learning":
        add(n["id"], "Deep Learning with Neural Networks", "Advanced AI concepts",
            "Master neural networks, CNNs, RNNs, and transformers using TensorFlow and PyTorch.",
            "deep-learning", "4 Months", "Online")
    elif lbl == "Native":
        add(n["id"], "Native Mobile App Development", "iOS & Android native apps",
            "Build native mobile applications using Kotlin for Android and Swift for iOS.",
            "native-mobile", "4 Months", "Hybrid")
    elif lbl == "Cross-Platform":
        add(n["id"], "Cross-Platform Mobile Development", "Write once, run anywhere",
            "Build cross-platform mobile apps using React Native and Flutter.",
            "cross-platform-mobile", "3 Months", "Online")
    elif lbl == "Data Analysis":
        add(n["id"], "Data Analysis with Python & SQL", "Extract insights from data",
            "Learn pandas, numpy, SQL, and data visualization to analyze and interpret data.",
            "data-analysis", "3 Months", "Online")
    elif lbl == "Data Visualization & SQL":
        add(n["id"], "Data Visualization & Advanced SQL", "Visual storytelling with data",
            "Create stunning dashboards with Tableau, Power BI, and master advanced SQL queries.",
            "data-viz-sql", "3 Months", "Online")
    elif lbl == "Cloud Platforms (AWS / Azure / GCP)":
        add(n["id"], "Cloud Platforms - AWS, Azure & GCP", "Multi-cloud expertise",
            "Learn cloud computing fundamentals across AWS, Azure, and Google Cloud Platform.",
            "cloud-platforms", "4 Months", "Online")
    elif lbl == "Infrastructure as Code (Terraform / Ansible)":
        add(n["id"], "Infrastructure as Code", "Automate cloud infrastructure",
            "Master Terraform and Ansible to provision and manage cloud infrastructure at scale.",
            "infrastructure-as-code", "3 Months", "Online")
    elif lbl == "Ethical Hacking / Pentesting":
        add(n["id"], "Ethical Hacking & Penetration Testing", "Security assessment",
            "Learn ethical hacking methodologies, vulnerability assessment, and penetration testing.",
            "ethical-hacking", "4 Months", "Hybrid")
    elif lbl == "Network & Linux Security":
        add(n["id"], "Network & Linux Security", "Secure systems and networks",
            "Harden Linux systems and configure secure network architectures.",
            "network-linux-security", "3 Months", "Hybrid")
    elif lbl == "Game Development":
        add(n["id"], "Game Development with Unity & Unreal", "Create immersive games",
            "Build 2D and 3D games using Unity and Unreal Engine. Covers C# scripting and Blueprints.",
            "game-development", "4 Months", "Hybrid")
    elif lbl == "Smart Contract Development":
        add(n["id"], "Smart Contract Development", "Ethereum blockchain development",
            "Write, test, and deploy Solidity smart contracts for Ethereum and EVM-compatible chains.",
            "smart-contracts", "3 Months", "Online")
    elif lbl == "Full-Stack Web3":
        add(n["id"], "Full-Stack Web3 Development", "Decentralized applications",
            "Build end-to-end decentralized applications using React, ethers.js, and Solidity.",
            "fullstack-web3", "3 Months", "Online")
    elif lbl == "C Programming Foundations":
        add(n["id"], "C Programming for Embedded Systems", "Low-level programming",
            "Master C programming for embedded systems, firmware, and system-level development.",
            "c-embedded", "3 Months", "Hybrid")
    elif lbl == "Microcontrollers & Firmware":
        add(n["id"], "Microcontrollers & Firmware Development", "IoT & embedded devices",
            "Develop firmware for ARM Cortex-M microcontrollers and ESP32 IoT devices.",
            "microcontrollers-firmware", "4 Months", "Hybrid")
    elif lbl == "Design Fundamentals":
        add(n["id"], "UI/UX Design Fundamentals", "Design thinking & research",
            "Learn design thinking, user research, wireframing, and prototyping.",
            "uiux-design", "3 Months", "Online")
    elif lbl == "Figma & Prototyping":
        add(n["id"], "Figma & Interactive Prototyping", "Design & prototype",
            "Master Figma for UI design and Framer for high-fidelity interactive prototypes.",
            "figma-prototyping", "2 Months", "Online")
    elif lbl == "Web Development":
        add(n["id"], "Full-Stack Web Development", "Complete web development",
            "Learn both frontend and backend technologies including React, Node.js, and databases.",
            "fullstack-web", "5 Months", "Online")
    elif lbl == "AI & Machine Learning":
        add(n["id"], "AI & Machine Learning Bootcamp", "Complete AI training",
            "Comprehensive program covering machine learning, deep learning, and AI applications.",
            "ai-ml-bootcamp", "6 Months", "Hybrid")
    elif lbl == "Mobile App Development":
        add(n["id"], "Mobile App Development Bootcamp", "Build mobile apps",
            "Learn both native and cross-platform mobile app development.",
            "mobile-dev-bootcamp", "5 Months", "Hybrid")
    elif lbl == "Data Science & Analytics":
        add(n["id"], "Data Science Bootcamp", "Become a data scientist",
            "Complete data science program covering Python, statistics, ML, and data visualization.",
            "data-science-bootcamp", "6 Months", "Hybrid")
    elif lbl == "Cloud Computing & DevOps":
        add(n["id"], "Cloud Computing & DevOps", "Cloud & DevOps mastery",
            "Master AWS, Docker, Kubernetes, CI/CD, and infrastructure automation.",
            "cloud-devops", "5 Months", "Online")
    elif lbl == "Cybersecurity":
        add(n["id"], "Cybersecurity Professional", "Security expert track",
            "Comprehensive cybersecurity training covering network security, ethical hacking, and compliance.",
            "cybersecurity-pro", "6 Months", "Hybrid")
    elif lbl == "Blockchain & Web3":
        add(n["id"], "Blockchain & Web3 Development", "Decentralized future",
            "Learn blockchain fundamentals, smart contracts, DApps, and Web3 technologies.",
            "blockchain-web3", "4 Months", "Online")
    elif lbl == "Systems & Embedded Programming":
        add(n["id"], "Systems & Embedded Programming", "Low-level systems",
            "Master C, embedded systems, Linux kernel programming, and IoT firmware development.",
            "systems-embedded", "5 Months", "Hybrid")
    elif lbl == "UI/UX Design":
        add(n["id"], "UI/UX Design Professional", "Design career track",
            "Complete UI/UX design program covering research, design, prototyping, and portfolio building.",
            "uiux-professional", "4 Months", "Online")
    elif lbl == "Foundation Courses":
        add(n["id"], "Foundation Courses - Programming & CS", "Build your foundation",
            "Essential programming and computer science fundamentals for beginners.",
            "foundation-courses", "3 Months", "Online")
    elif lbl == "TNPSC":
        add(n["id"], "TNPSC Group Exams Coaching", "Tamil Nadu PSC preparation",
            "Comprehensive preparation for TNPSC Group 1, 2, and 4 examinations.",
            "tnpsc-coaching", "6 Months", "Hybrid")
    elif lbl == "UPSC":
        add(n["id"], "UPSC Civil Services Coaching", "IAS/IPS preparation",
            "Complete coaching for UPSC Prelims, Mains, and Interview stages.",
            "upsc-coaching", "10 Months", "Hybrid")
    elif lbl == "SSC":
        add(n["id"], "SSC CGL & CHSL Coaching", "Staff Selection exams",
            "Targeted preparation for SSC CGL and CHSL examinations with mock tests.",
            "ssc-coaching", "5 Months", "Hybrid")
    elif lbl == "Banking":
        add(n["id"], "Banking Exams Coaching - IBPS & SBI", "Banking career prep",
            "Complete preparation for IBPS PO, SBI Clerk, and other banking exams.",
            "banking-coaching", "5 Months", "Hybrid")
    elif lbl == "Railway":
        add(n["id"], "Railway Exams Coaching - RRB", "Railway job preparation",
            "Focused coaching for RRB NTPC, ALP, and Technician examinations.",
            "railway-coaching", "5 Months", "Hybrid")

print(f"\n=== Creating {len(COURSES)} courses ===")
created = 0
for nav_id, c in COURSES.items():
    data = make_course(*c)
    data["nav_item_id"] = nav_id
    r = post("/rest/v1/courses", data)
    if r:
        created += 1
        print(f"  ✓ {c[0][:50]}")
    time.sleep(0.05)

print(f"\nCreated {created} courses")
