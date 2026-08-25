import { Link, useLocation } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";

const createSlugs = new Set(["new", "wizard", "add"]);

// Entity routes: list page, create, edit, and optional sub-pages
const entityConfig = {
  courses: {
    list: "All Courses",
    new: "New Course",
    edit: "Edit Course",
    parent: "/admin/courses",
    subs: { reports: "Reports", brochure: "Brochure" },
  },
  blog: {
    list: "All Blog",
    new: "Add New Post",
    edit: "Edit Post",
    parent: "/admin/blog",
    subs: { categories: "Categories" },
  },
  jobs: {
    list: "Job Openings",
    new: "Add Job Opening",
    edit: "Edit Job Opening",
    parent: "/admin/jobs",
  },
  internships: {
    list: "Internships",
    new: "Add Internship",
    edit: "Edit Internship",
    parent: "/admin/internships",
  },
  training: {
    list: "Training Programs",
    new: "New Training Program",
    edit: "Edit Training Program",
    parent: "/admin/training",
  },
  tags: {
    list: "Tags",
    new: "New Tag",
    edit: "Edit Tag",
    parent: "/admin/tags",
  },
  home: {
    list: "Home",
    edit: "Edit Home",
    parent: "/admin/home/hero",
  },
  "nav-pages": {
    list: "Menu",
    edit: "Edit Page",
    parent: "/admin/nav-menu",
  },
  pages: {
    list: "Pages",
    edit: "Edit Page",
  },
};

// Single-segment pages (list / leaf pages)
const singles = {
  "site-settings": "Site Settings",
  "nav-menu": "Menu",
  alumni: "Alumni Companies",
  footer: "Footer",
  media: "Media Library",
  "admin-users": "Admin Users",
  "about-page": "Edit About",
  "contact-page": "Edit Contact",
  "career-page": "Edit Career",
  "services-page": "Edit Services Page",
  "training-page": "Edit Training Page",
  "blog-page": "Edit Blog Page",
  "career-submissions": "Career Submissions",
  "career-contact-submissions": "Career Enquiry Submissions",
  "brochure-downloads": "Brochure Downloads",
  "form-submissions": "Form Submissions",
  "newsletter-subscribers": "Newsletter Subscribers",
  "contact-submissions": "Contact Submissions",
  "chat-submissions": "Chat Submissions",
  "service-categories": "Service Categories",
  "training-categories": "Training Categories",
  profile: "Profile",
  chats: "Chats",
};

function capitalize(part) {
  return part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
}

function buildCrumbs(parts) {
  if (parts.length === 0) return [];

  const root = parts[0];
  const ent = entityConfig[root];
  const crumbs = [];

  if (ent) {
    if (parts.length === 1) {
      crumbs.push({ label: ent.list, path: null });
      return crumbs;
    }
    crumbs.push({ label: ent.parentLabel || ent.list, path: ent.parent || "/admin/" + root });
    const second = parts[1];
    if (createSlugs.has(second)) {
      crumbs.push({ label: ent.new, path: null });
    } else if (ent.subs && ent.subs[second]) {
      crumbs.push({ label: ent.subs[second], path: null });
    } else {
      crumbs.push({ label: ent.edit, path: null });
    }
    return crumbs;
  }

  if (singles[root]) {
    crumbs.push({ label: singles[root], path: null });
    return crumbs;
  }

  // Generic fallback
  return parts.map((p, i) => ({
    label: capitalize(p),
    path: i === parts.length - 1 ? null : "/admin/" + parts.slice(0, i + 1).join("/"),
  }));
}

export default function Breadcrumbs({ className = "" }) {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean).filter(p => p !== "admin");
  const crumbs = buildCrumbs(parts);

  if (crumbs.length === 0) {
    return (
    <nav className={`flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 min-w-0 ${className}`}>
        <span className="text-blue-600 font-medium">Dashboard</span>
        <FiChevronRight className="w-3 h-3 text-neutral-300" />
      </nav>
    );
  }

  return (
    <nav className={`flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 min-w-0 ${className}`}>
      <Link to="/admin" className="hover:text-neutral-700 transition-colors font-medium">Dashboard</Link>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            <FiChevronRight className="w-3 h-3 text-neutral-300" />
            {isLast || !c.path ? (
              <span className="text-blue-600 font-medium truncate max-w-[200px]">{c.label}</span>
            ) : (
              <Link to={c.path} className="hover:text-neutral-700 transition-colors truncate max-w-[150px] font-medium">{c.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
