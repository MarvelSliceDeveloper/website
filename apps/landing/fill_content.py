import requests, json, sys, time

URL = "https://nxlsxywqvvuiljsulito.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA"
HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def get(path):
    r = requests.get(f"{URL}{path}", headers=HEADERS)
    r.raise_for_status()
    return r.json()

def patch(path, data):
    r = requests.patch(f"{URL}{path}", headers={**HEADERS, "Prefer": "return=minimal"}, json=data)
    if r.status_code >= 400:
        print(f"  PATCH ERROR {r.status_code}: {r.text}", file=sys.stderr)
        return False
    return True

def post(path, data):
    r = requests.post(f"{URL}{path}", headers={**HEADERS, "Prefer": "return=representation"}, json=data)
    if r.status_code >= 400:
        print(f"  POST ERROR {r.status_code}: {r.text}", file=sys.stderr)
        return None
    return r.json()

def delete(path):
    r = requests.delete(f"{URL}{path}", headers=HEADERS)
    if r.status_code >= 400:
        print(f"  DELETE ERROR {r.status_code}: {r.text}", file=sys.stderr)

print("=== Fetching all courses ===")
courses = get("/rest/v1/courses?select=id,slug,title,description,duration,mode,curriculum,checklist_items")
print(f"Found {len(courses)} courses")

# ── 1. SET HERO IMAGES ──
print("\n=== Setting hero images ===")
for c in courses:
    cid = c["id"]
    slug = c["slug"]
    # Use picsum with seed for deterministic images
    hero_url = f"https://picsum.photos/seed/{slug}/800/400"
    success = patch(f"/rest/v1/courses?id=eq.{cid}", {"hero_image_url": hero_url})
    if success:
        print(f"  Hero set: {c['title']}")
    time.sleep(0.05)

# ── 2. DELETE EXISTING COURSE_TABS ──
print("\n=== Deleting existing course_tabs ===")
existing_tabs = get("/rest/v1/course_tabs?select=id")
print(f"Found {len(existing_tabs)} existing tabs")
for t in existing_tabs:
    delete(f"/rest/v1/course_tabs?id=eq.{t['id']}")

# ── 3. CREATE COURSE_TABS ──
print("\n=== Creating course tabs ===")

def make_overview_content(course):
    """Generate Overview tab content from course data."""
    desc = course.get("description", "")
    title = course["title"]
    duration = course.get("duration", "Flexible")
    mode = course.get("mode", "Online")

    qa = [
        {
            "question": f"What will I learn in {title}?",
            "answers": [
                f"This comprehensive course covers all aspects of {title.lower()}.",
                "You will gain practical, hands-on experience through real-world projects.",
                "Industry experts guide you through the latest tools and best practices.",
                "By the end, you will have a portfolio-ready project to showcase.",
            ]
        },
        {
            "question": f"What is the duration and mode of this course?",
            "answers": [
                f"The course runs for {duration} in {mode} mode.",
                "Self-paced learning with mentor support throughout.",
                "Weekly live sessions for doubt clearing and networking.",
            ]
        },
        {
            "question": "Are there any prerequisites?",
            "answers": [
                "Basic familiarity with computers and the internet is recommended.",
                "No prior experience in this specific field is required — we start from fundamentals.",
                "A willingness to learn and practice regularly is the key requirement.",
            ]
        },
        {
            "question": "Will I get a certificate?",
            "answers": [
                "Yes, you will receive a verified completion certificate.",
                "The certificate is recognized by industry partners.",
                "You need to complete all modules and the capstone project to qualify.",
            ]
        },
    ]

    return {
        "heading": f"About {title}",
        "paragraph": desc,
        "subheading": "Frequently Asked Questions",
        "qa": qa,
    }

def make_syllabus_content(course):
    """Generate Syllabus tab content from curriculum JSON."""
    curriculum = course.get("curriculum", [])
    qa = []
    for mod in curriculum:
        qa.append({
            "question": mod.get("title", "Module"),
            "answers": mod.get("topics", []),
        })
    return {
        "heading": f"{course['title']} - Complete Syllabus",
        "paragraph": f"A structured {course.get('duration', '')} curriculum designed to take you from fundamentals to advanced concepts in {course['title'].lower()}.",
        "subheading": "Module Breakdown",
        "qa": qa,
    }

def make_pricing_content(course):
    """Generate pricing tab content."""
    return {
        "text": json.dumps({
            "plans": [
                {"name": "Self-Paced", "price": "₹9,999", "features": ["Recorded lectures", "Study materials", "Community access"]},
                {"name": "Instructor-Led", "price": "₹24,999", "features": ["Live classes", "1:1 mentoring", "Project review", "Placement support"]},
                {"name": "Premium", "price": "₹49,999", "features": ["Everything in Instructor-Led", "Interview preparation", "Resume building", "Guaranteed internship"]}
            ]
        })
    }

created = 0
for c in courses:
    cid = c["id"]
    title = c["title"]

    # Tab 1: Overview
    ov = make_overview_content(c)
    r1 = post("/rest/v1/course_tabs", {
        "course_id": cid, "label": "Overview", "content_type": "overview",
        "content": ov, "sort_order": 0
    })

    # Tab 2: Syllabus
    sy = make_syllabus_content(c)
    r2 = post("/rest/v1/course_tabs", {
        "course_id": cid, "label": "Curriculum", "content_type": "syllabus",
        "content": sy, "sort_order": 1
    })

    # Tab 3: Apply Now
    r3 = post("/rest/v1/course_tabs", {
        "course_id": cid, "label": "Apply Now", "content_type": "apply_now",
        "content": {}, "sort_order": 2
    })

    if r1 and r2 and r3:
        created += 1
        print(f"  Tabs created: {title}")
    else:
        print(f"  PARTIAL FAIL: {title}")

    time.sleep(0.05)

print(f"\nCreated tabs for {created} out of {len(courses)} courses")
