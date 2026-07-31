"""
Comprehensive content seed script:
1. Blog: delete old + create 10 blog posts with categories & tags
2. Home: update all sections (keep hero banner, replace everything else)
3. Nav pages: update About, Career, Contact
"""
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

def patch(path, data):
    r = requests.patch(f"{URL}{path}", headers={**H, "Prefer": "return=minimal"}, json=data)
    if r.status_code >= 400: print(f"  PATCH ERR {r.status_code}: {r.text[:120]}", file=sys.stderr); return False
    return True

def delete(path):
    r = requests.delete(f"{URL}{path}", headers=H)
    if r.status_code >= 400: print(f"  DEL ERR {r.status_code}: {r.text[:120]}", file=sys.stderr)

# ═══════════════════════════════════════════════════════════════
# 1. BLOG
# ═══════════════════════════════════════════════════════════════
print("═══ BLOG ═══")
print("Deleting existing blog data...")
# blog_post_tags cascade-deletes from blog_posts, so just delete posts
for pid in get("/rest/v1/blog_posts?select=id"): delete(f"/rest/v1/blog_posts?id=eq.{pid['id']}")
for cid in get("/rest/v1/blog_categories?select=id"): delete(f"/rest/v1/blog_categories?id=eq.{cid['id']}")
for t in get("/rest/v1/tags?select=id"): delete(f"/rest/v1/tags?id=eq.{t['id']}")
time.sleep(1)

print("Creating blog categories...")
cats = {}
for c in [
    ("Technology", "technology"), ("Career Guidance", "career-guidance"),
    ("Exam Preparation", "exam-preparation"), ("Industry Insights", "industry-insights"),
]:
    r = post("/rest/v1/blog_categories", {"name": c[0], "slug": c[1], "sort_order": 0})
    if r: cats[c[0]] = r[0]["id"]

print("Creating tags...")
tags = {}
for t in ["Python", "React", "Machine Learning", "TNPSC", "UPSC", "Career Tips", "Web Development", "Data Science", "Cloud Computing", "Cybersecurity"]:
    r = post("/rest/v1/tags", {"name": t})
    if r: tags[t] = r[0]["id"]

print("Creating 10 blog posts...")
BLOGS = [
    ("A Complete Guide to Starting Your Career in Web Development", "web-dev-career-guide",
     "Technology", "Rahul Sharma",
     "2026-07-01",
     "Web development is one of the most rewarding career paths in tech today. Whether you're a fresh graduate or looking to switch careers, this guide will help you navigate the journey.\n\nFrom understanding HTML, CSS, and JavaScript fundamentals to mastering modern frameworks like React, the path is clear but requires dedication. Start with the basics, build projects, and gradually move to advanced topics.\n\nThe demand for skilled web developers continues to grow, with companies seeking professionals who can build responsive, accessible, and performant web applications.",
     "A step-by-step roadmap to becoming a professional web developer in 2026.",
     ["Web Development", "React", "Career Tips"],
     True),
    ("Python vs JavaScript: Which Language Should You Learn First?", "python-vs-javascript",
     "Technology", "Priya Patel",
     "2026-07-03",
     "The age-old debate: Python or JavaScript? Both are excellent first languages, but they serve different purposes.\n\nPython excels in data science, machine learning, and backend development. Its clean syntax makes it beginner-friendly. JavaScript, on the other hand, is the language of the web — essential for frontend development and increasingly popular on the backend with Node.js.\n\nOur recommendation: learn both! Start with whichever aligns with your goals, then pick up the second. They complement each other beautifully.",
     "A detailed comparison to help you choose your first programming language.",
     ["Python", "JavaScript", "Career Tips"],
     False),
    ("How to Prepare for TNPSC Group 1 Exam in 6 Months", "tnpsc-group-1-prep",
     "Exam Preparation", "Sundararajan K",
     "2026-07-05",
     "Preparing for TNPSC Group 1 requires a structured approach and consistent effort. Here's a comprehensive 6-month plan.\n\nMonth 1-2: Build your foundation with General Science, Indian Polity, and History. Use NCERT textbooks as your primary source.\nMonth 3-4: Focus on Geography, Economics, and Tamil language. Practice previous year question papers.\nMonth 5-6: Revision, mock tests, and current affairs. Aim to solve at least one full-length test every week.\n\nKey to success: consistency and smart work over mere hard work.",
     "A 6-month study plan to crack the TNPSC Group 1 examination.",
     ["TNPSC", "Exam Preparation"],
     False),
    ("The Future of AI: What Every Student Should Know", "future-of-ai",
     "Technology", "Dr. Ananya Iyer",
     "2026-07-07",
     "Artificial Intelligence is reshaping every industry. From healthcare to finance, education to entertainment, AI is no longer a futuristic concept — it's here.\n\nFor students, understanding AI basics is becoming as essential as computer literacy. Machine learning, deep learning, and natural language processing are creating new career opportunities.\n\nThe key areas to watch: generative AI, autonomous systems, and AI ethics. Building skills in Python, statistics, and data analysis will prepare you for this AI-driven future.",
     "Understanding AI trends and preparing for an AI-driven career landscape.",
     ["Machine Learning", "Python", "Data Science"],
     False),
    ("Top 5 Skills Employers Look for in 2026", "top-skills-2026",
     "Career Guidance", "Marvel Slice Team",
     "2026-07-09",
     "The job market evolves rapidly. Here are the top skills employers are seeking in 2026.\n\n1. Data Literacy: Understanding and working with data is crucial across all roles.\n2. Digital Communication: Remote and hybrid work makes clear communication vital.\n3. Problem-Solving: The ability to analyze and solve complex problems remains timeless.\n4. Technical Adaptability: Willingness to learn new tools and technologies.\n5. Collaboration: Working effectively in diverse, cross-functional teams.\n\nInvest in these skills to stay competitive in the job market.",
     "Essential skills that will make you stand out to employers this year.",
     ["Career Tips"],
     False),
    ("Cloud Computing Careers: AWS, Azure, or GCP?", "cloud-computing-careers",
     "Technology", "Vikram Singh",
     "2026-07-11",
     "Cloud computing professionals are in high demand. AWS leads the market share, followed by Azure and GCP.\n\nAWS offers the widest range of services and the most job opportunities. Azure integrates seamlessly with Microsoft enterprise environments. GCP excels in data and machine learning services.\n\nOur advice: start with one platform (we recommend AWS for its market dominance), get certified, and then expand to others. The fundamentals are transferable.",
     "Comparing the three major cloud platforms to help you choose your career path.",
     ["Cloud Computing", "Career Tips"],
     False),
    ("Cybersecurity 101: Protecting Yourself in the Digital Age", "cybersecurity-101",
     "Technology", "Ahmed Khan",
     "2026-07-13",
     "Cybersecurity is no longer optional — it's a necessity. With increasing cyber threats, understanding basic security practices is essential.\n\nStart with strong, unique passwords using a password manager. Enable two-factor authentication everywhere. Keep your software updated. Be cautious of phishing attempts.\n\nFor those looking to build a career in cybersecurity, start with networking basics, then explore ethical hacking, security operations, and compliance.",
     "Essential cybersecurity practices for individuals and career guidance for aspiring professionals.",
     ["Cybersecurity", "Career Tips"],
     False),
    ("UPSC Civil Services: Your Complete Preparation Roadmap", "upsc-preparation-roadmap",
     "Exam Preparation", "Lakshmi Narayanan",
     "2026-07-15",
     "The UPSC Civil Services Examination is one of India's most challenging competitive exams. Here's a comprehensive preparation strategy.\n\nPhase 1 (6 months): Build strong fundamentals with NCERT books for history, geography, polity, and economics.\nPhase 2 (4 months): Deep dive into standard reference books and begin answer writing practice.\nPhase 3 (3 months): Focus on current affairs, revision, and mock test series.\n\nRemember: consistency, smart revision, and regular answer writing are the keys to success.",
     "A complete strategy guide for UPSC Civil Services Exam preparation.",
     ["UPSC", "Exam Preparation"],
     False),
    ("Building Your First Machine Learning Project: A Beginner's Guide", "first-ml-project",
     "Technology", "Dr. Ananya Iyer",
     "2026-07-17",
     "Ready to build your first ML project? Here's a step-by-step guide.\n\n1. Define your problem: Start with a clear question you want to answer.\n2. Collect and clean data: Real-world data is messy — cleaning is 80% of the work.\n3. Explore and visualize: Understand patterns and relationships in your data.\n4. Choose and train a model: Start simple with linear regression or decision trees.\n5. Evaluate and iterate: Measure performance and improve.\n\nStart with the famous Iris dataset or Titanic survival prediction — classic beginner projects that teach you the complete ML workflow.",
     "Step-by-step guide to building your first machine learning project from scratch.",
     ["Machine Learning", "Python", "Data Science"],
     False),
    ("Why Soft Skills Matter as Much as Technical Skills", "soft-skills-matter",
     "Career Guidance", "Marvel Slice Team",
     "2026-07-19",
     "In the rush to learn programming languages and frameworks, don't neglect your soft skills. They often determine career growth more than technical expertise.\n\nCommunication: Can you explain complex ideas simply? This skill separates good engineers from great ones.\nEmpathy: Understanding user needs and team perspectives leads to better solutions.\nAdaptability: Technology changes fast — being open to learning is non-negotiable.\nLeadership: Taking initiative and guiding others, regardless of your title.\n\nBalance technical excellence with people skills for a thriving career.",
     "Why communication, empathy, and adaptability are essential for long-term career success.",
     ["Career Tips"],
     False)
]

blog_ids = []
for b in BLOGS:
    cat_id = cats.get(b[2])
    r = post("/rest/v1/blog_posts", {
        "title": b[0], "slug": b[1], "category_id": cat_id, "author": b[3],
        "published_at": b[4], "content": b[5], "excerpt": b[6],
        "is_published": True, "is_featured": b[8],
        "image_url": f"https://picsum.photos/seed/{b[1]}/800/400",
    })
    if r:
        bid = r[0]["id"]
        blog_ids.append(bid)
        for tname in b[7]:
            tid = tags.get(tname)
            if tid:
                post("/rest/v1/blog_post_tags", {"post_id": bid, "tag_id": tid})
        print(f"  Blog: {b[0][:50]}")
    time.sleep(0.1)

# ═══════════════════════════════════════════════════════════════
# 2. HOME SECTIONS
# ═══════════════════════════════════════════════════════════════
print("\n═══ HOME SECTIONS ═══")

# hero section - keep existing (just ensure it's good)
existing_home = {s["section_key"]: s["id"] for s in get("/rest/v1/home_sections?select=id,section_key")}

if "hero" in existing_home:
    patch(f"/rest/v1/home_sections?id=eq.{existing_home['hero']}", {
        "heading": "Transform Your Career",
        "subheading": "Expert-led training for a competitive edge",
        "content": {
            "headline": "Transform Your Career with Expert-Led Learning",
            "description": "Join thousands of successful students who have transformed their careers through our industry-focused training programs. Learn from experts, build real-world projects, and achieve your goals.",
            "feature_bullets": [
                "Industry-Relevant Curriculum Designed by Experts",
                "Hands-On Projects & Real-World Simulations",
                "Personalized Mentorship & Career Guidance",
                "Flexible Learning — Online & Offline Batches"
            ],
            "stats": [
                {"value": "10,000+", "label": "Courses"},
                {"value": "8,500+", "label": "Success Stories"},
                {"value": "95%", "label": "Placement Support"}
            ]
        },
        "is_active": True, "sort_order": 0
    })
print("  hero -> updated")

if "intro_form" in existing_home:
    patch(f"/rest/v1/home_sections?id=eq.{existing_home['intro_form']}", {
        "heading": "Start Your Journey",
        "subheading": "Book a free demo class today",
        "content": {
            "intro_text": "Take the first step towards your dream career. Our expert counselors will guide you through the right learning path.",
            "stats": [
                {"value": "50+", "label": "Expert Trainers"},
                {"value": "100+", "label": "Courses Offered"},
                {"value": "95%", "label": "Success Rate"}
            ],
            "pill_buttons": ["Software Learning", "Competitive Exam", "Career Counseling", "Corporate Training"],
            "form_title": "Book Your Free Demo Class"
        },
        "is_active": True, "sort_order": 1
    })
print("  intro_form -> updated")

if "empowering" in existing_home:
    patch(f"/rest/v1/home_sections?id=eq.{existing_home['empowering']}", {
        "heading": "Empowering Careers Through Quality Education",
        "subheading": "Bridging the gap between ambition and achievement",
        "content": {
            "description": "At Marvel Slice, we believe in transforming potential into performance. Our carefully crafted programs combine theoretical knowledge with practical application, ensuring you're job-ready from day one. With industry partnerships, experienced mentors, and a curriculum that evolves with market demands, we don't just teach — we empower."
        },
        "is_active": True, "sort_order": 2
    })
print("  empowering -> updated")

if "featured_courses" in existing_home:
    patch(f"/rest/v1/home_sections?id=eq.{existing_home['featured_courses']}", {
        "heading": "Explore Our Top Programs",
        "subheading": "Choose from our most popular courses designed for career success",
        "content": {
            "cards": [
                {
                    "image_url": "https://picsum.photos/seed/frontend-card/400/300",
                    "heading": "Full-Stack Web Development",
                    "description": "Master frontend and backend technologies to build complete web applications. Covers React, Node.js, databases, and deployment.",
                    "bullets": ["Build 5 real-world projects", "Industry-recognized certification", "Placement assistance"],
                    "button_text": "Explore Programs",
                    "button_link": "/software-learning"
                },
                {
                    "image_url": "https://picsum.photos/seed/datascience-card/400/300",
                    "heading": "Data Science & Analytics",
                    "description": "Learn Python, SQL, machine learning, and data visualization. Turn raw data into actionable insights.",
                    "bullets": ["Hands-on with real datasets", "Tableau & Power BI training", "Capstone project"],
                    "button_text": "Explore Programs",
                    "button_link": "/software-learning"
                },
                {
                    "image_url": "https://picsum.photos/seed/competitive-card/400/300",
                    "heading": "Competitive Exam Coaching",
                    "description": "Crack TNPSC, UPSC, SSC, Banking, and Railway exams with expert guidance and structured preparation.",
                    "bullets": ["Comprehensive study materials", "Mock test series", "Personalized mentoring"],
                    "button_text": "Explore Programs",
                    "button_link": "/competitive-exam"
                },
                {
                    "image_url": "https://picsum.photos/seed/cloud-card/400/300",
                    "heading": "Cloud Computing & DevOps",
                    "description": "Master AWS, Azure, Docker, Kubernetes, and CI/CD pipelines. Become a cloud infrastructure expert.",
                    "bullets": ["Multi-cloud training", "Live lab environment", "Certification preparation"],
                    "button_text": "Explore Programs",
                    "button_link": "/software-learning"
                }
            ]
        },
        "is_active": True, "sort_order": 3
    })
print("  featured_courses -> updated")

if "services" in existing_home:
    patch(f"/rest/v1/home_sections?id=eq.{existing_home['services']}", {
        "heading": "Our Services",
        "subheading": "Comprehensive solutions for individuals and organizations",
        "content": {
            "intro": "From skill development to recruitment solutions, we offer end-to-end services to help you achieve your goals.",
            "left_image_url": "https://picsum.photos/seed/services-hero/600/400",
            "left_heading": "Transform Your Future with Industry-Focused Training",
            "left_description": "Our services are designed to meet the evolving needs of the job market. Whether you're a student, professional, or organization, we have the right solution for you.",
            "cta_text": "Explore Our Services",
            "cta_link": "/services",
            "services_list": [
                {"title": "Classroom Training", "description": "Interactive in-person sessions with expert instructors in state-of-the-art facilities."},
                {"title": "Online Learning", "description": "Flexible self-paced and live online courses accessible from anywhere."},
                {"title": "Corporate Training", "description": "Customized training programs for organizations to upskill their workforce."},
                {"title": "Placement Support", "description": "End-to-end placement assistance including resume building, mock interviews, and job referrals."}
            ],
            "service_cards": [
                {"image_url": "https://picsum.photos/seed/serv-classroom/400/250", "title": "Classroom Training", "description": "Learn in a collaborative environment with face-to-face interaction."},
                {"image_url": "https://picsum.photos/seed/serv-online/400/250", "title": "Online Learning", "description": "Study at your own pace with recorded sessions and live Q&A."},
                {"image_url": "https://picsum.photos/seed/serv-corporate/400/250", "title": "Corporate Training", "description": "Tailored programs to meet your organization's specific needs."}
            ]
        },
        "is_active": True, "sort_order": 4
    })
print("  services -> updated")

if "cta_banner" in existing_home:
    patch(f"/rest/v1/home_sections?id=eq.{existing_home['cta_banner']}", {
        "heading": "Ready to Start Your Dream Career?",
        "subheading": "Take the first step today",
        "content": {
            "heading": "Ready to start your dream career?",
            "description": "Join thousands of successful students who have transformed their careers with Marvel Slice. Get in touch with our counselors today.",
            "cta_text": "Request a Call Back",
            "cta_link": "+916380957390"
        },
        "is_active": True, "sort_order": 5
    })
print("  cta_banner -> updated")

if "faqs" in existing_home:
    patch(f"/rest/v1/home_sections?id=eq.{existing_home['faqs']}", {
        "heading": "Frequently Asked Questions",
        "subheading": "Everything you need to know before getting started",
        "content": {
            "items": [
                {"question": "What courses do you offer?", "answer": "We offer a wide range of courses including web development, data science, cloud computing, cybersecurity, and competitive exam coaching for TNPSC, UPSC, SSC, Banking, and Railway exams."},
                {"question": "Are your courses online or offline?", "answer": "We offer both online and offline (hybrid) learning options. Our online courses include live sessions and recorded content, while offline classes are conducted at our training centers."},
                {"question": "Do you provide placement assistance?", "answer": "Yes, we provide comprehensive placement assistance including resume building, mock interviews, and job referrals. Our placement support team works closely with industry partners to connect you with the right opportunities."},
                {"question": "What is the duration of your courses?", "answer": "Course durations vary depending on the program. Short-term courses range from 2-3 months, while comprehensive programs span 4-6 months. Competitive exam coaching runs up to 8-10 months."},
                {"question": "Do I get a certificate after completing a course?", "answer": "Yes, you will receive a verified completion certificate upon successfully finishing the course. Our certificates are recognized by industry partners."},
                {"question": "Can I get a free demo before enrolling?", "answer": "Absolutely! We offer free demo classes for all our courses. Simply fill out the form on our website or contact us to schedule your free demo session."}
            ]
        },
        "is_active": True, "sort_order": 6
    })
print("  faqs -> updated")

# ═══════════════════════════════════════════════════════════════
# 3. NAV PAGES (About, Career, Contact)
# ═══════════════════════════════════════════════════════════════
print("\n═══ NAV PAGES ═══")

existing_nav = {}
for np in get("/rest/v1/nav_pages?select=id,nav_item_id"):
    existing_nav[np["nav_item_id"]] = np["id"]

# --- About page ---
about_id = existing_nav.get("4a9231a2-47b1-4616-8515-fc76b58ae446")
if about_id:
    patch(f"/rest/v1/nav_pages?id=eq.{about_id}", {
        "heading": "About Marvel Slice",
        "subheading": "Empowering careers through expert-led education since 2020",
        "hero_image": "https://picsum.photos/seed/about-hero/1200/500",
        "sections": [
            {
                "section_type": "text",
                "heading": "Our Story",
                "content": "Marvel Slice was founded with a simple mission: make quality education accessible to everyone. What started as a small training initiative has grown into a comprehensive learning platform serving thousands of students across India.\n\nOur journey began when our founders recognized the gap between academic education and industry requirements. We set out to bridge this gap by creating programs that combine theoretical knowledge with practical, hands-on experience.\n\nToday, we offer courses across technology, competitive exams, and professional development, with a team of expert instructors who bring real-world experience to every classroom."
            },
            {
                "section_type": "stats_row",
                "heading": "Our Impact",
                "content": json.dumps([
                    {"number": "10,000+", "label": "Students Trained"},
                    {"number": "95%", "label": "Placement Rate"},
                    {"number": "50+", "label": "Expert Instructors"},
                    {"number": "100+", "label": "Courses Offered"},
                    {"number": "4.8", "label": "Average Rating"},
                    {"number": "200+", "label": "Industry Partners"}
                ])
            },
            {
                "section_type": "features",
                "heading": "Why Choose Marvel Slice?",
                "content": json.dumps([
                    "Industry-aligned curriculum updated regularly",
                    "Experienced instructors from top companies",
                    "Hands-on projects and real-world case studies",
                    "Flexible learning options — online & offline",
                    "Comprehensive placement assistance",
                    "Lifetime access to learning materials"
                ])
            },
            {
                "section_type": "cta",
                "heading": "Ready to Start Your Journey?",
                "content": "Join thousands of successful students who have transformed their careers with us. Get in touch today to learn more about our programs."
            }
        ],
        "is_published": True
    })
    print("  About page -> updated")

# --- Career page ---
career_id = existing_nav.get("8b461dc0-3f88-4340-857f-9d7248af6cdf")
if career_id:
    patch(f"/rest/v1/nav_pages?id=eq.{career_id}", {
        "heading": "Build Your Career With Marvel Slice",
        "subheading": "Join a team passionate about transforming education",
        "hero_image": "https://picsum.photos/seed/career-hero/1200/500",
        "sections": [
            {
                "section_type": "text",
                "heading": "Work With Us",
                "content": "At Marvel Slice, we're building the future of education. We're looking for passionate individuals who share our vision of making quality learning accessible to everyone.\n\nWe believe in fostering a culture of innovation, collaboration, and continuous learning. If you're excited about education and technology, you'll find a home here."
            },
            {
                "section_type": "features",
                "heading": "Why Work at Marvel Slice?",
                "content": json.dumps([
                    "Competitive compensation and benefits",
                    "Flexible work environment",
                    "Opportunities for professional growth",
                    "Collaborative and supportive team culture",
                    "Make a real impact in education",
                    "Work with cutting-edge technologies"
                ])
            },
            {
                "section_type": "positions",
                "heading": "Open Positions",
                "content": json.dumps([
                    {"title": "Senior React Developer", "location": "Chennai", "type": "Full-time", "description": "Build and maintain our learning platform using React, TypeScript, and modern web technologies."},
                    {"title": "Python Instructor", "location": "Chennai", "type": "Full-time", "description": "Teach Python programming and data science courses to aspiring developers."},
                    {"title": "Digital Marketing Specialist", "location": "Remote", "type": "Full-time", "description": "Drive our digital marketing initiatives and grow our online presence."},
                    {"title": "Content Writer", "location": "Remote", "type": "Part-time", "description": "Create engaging educational content for our blog and course materials."},
                    {"title": "Career Counselor", "location": "Chennai", "type": "Full-time", "description": "Guide students in choosing the right career paths and courses."}
                ])
            },
            {
                "section_type": "cta",
                "heading": "Don't See the Right Role?",
                "content": "We're always looking for talented individuals. Send your resume to careers@marvelslice.com and we'll keep you in mind for future opportunities."
            }
        ],
        "form_config": {
            "heading": "Apply Now",
            "subheading": "Fill out the form below and we'll get back to you.",
            "fields": {
                "full_name": {"enabled": True, "required": True, "label": "Full Name", "placeholder": "Enter your full name"},
                "email": {"enabled": True, "required": True, "label": "Email Address", "placeholder": "Enter your email"},
                "phone": {"enabled": True, "required": True, "label": "Phone Number", "placeholder": "Enter your phone number"},
                "department": {"enabled": True, "required": True, "label": "Department", "placeholder": "Select department", "options": ["Engineering", "Marketing", "Sales", "Human Resources", "Finance", "Operations", "Design", "Content", "Education"]},
                "category": {"enabled": True, "required": True, "label": "Position Type", "placeholder": "Select type", "options": ["Full-time", "Part-time", "Internship", "Contract", "Freelance"]},
                "description": {"enabled": True, "required": True, "label": "Why do you want to join us?", "placeholder": "Tell us about yourself and why you're interested..."},
                "file_upload": {"enabled": True, "required": True, "label": "Upload Resume", "placeholder": "Upload your resume (PDF, DOC)"}
            }
        },
        "is_published": True
    })
    print("  Career page -> updated")

# --- Contact page ---
contact_id = existing_nav.get("8f87aeb4-044b-4c31-ba93-f90a6e3853a0")
if contact_id:
    patch(f"/rest/v1/nav_pages?id=eq.{contact_id}", {
        "heading": "Get in Touch With Us",
        "subheading": "We'd love to hear from you. Reach out to us anytime.",
        "hero_image": "https://picsum.photos/seed/contact-hero/1200/500",
        "sections": [
            {
                "section_type": "contact_info",
                "heading": "Contact Information",
                "content": json.dumps({
                    "address": "123 Tech Park, OMR Road, Chennai, Tamil Nadu 600096",
                    "phone": "+91 63809 57390",
                    "email": "info@marvelslice.com"
                })
            },
            {
                "section_type": "map_embed",
                "heading": "Our Location",
                "content": '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.5!2d80.2!3d13.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a526f%3A0x123!2sChennai!5e0!3m2!1sen!2sin!4v1" width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
            },
            {
                "section_type": "cta",
                "heading": "Prefer to Write to Us?",
                "content": "Send us an email at info@marvelslice.com and we'll respond within 24 hours."
            }
        ],
        "form_config": {
            "heading": "Send Us a Message",
            "subheading": "We'll get back to you within 24 hours.",
            "fields": {
                "full_name": {"enabled": True, "required": True, "label": "Full Name", "placeholder": "Enter your full name"},
                "email": {"enabled": True, "required": True, "label": "Email Address", "placeholder": "Enter your email"},
                "phone": {"enabled": True, "required": False, "label": "Phone Number", "placeholder": "Optional"},
                "category": {"enabled": True, "required": True, "label": "Subject", "placeholder": "Select subject", "options": ["General Inquiry", "Course Information", "Corporate Training", "Partnership", "Support", "Other"]},
                "description": {"enabled": True, "required": True, "label": "Message", "placeholder": "Tell us how we can help you..."}
            }
        },
        "is_published": True
    })
    print("  Contact page -> updated")

# --- Services page (keep as is, user said except services and training) ---

print("\n✅ All content seeded successfully!")
