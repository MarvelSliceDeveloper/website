import { FiBriefcase } from "react-icons/fi";
import { useState, useEffect, useCallback } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { FiHome, FiFile, FiBookOpen, FiGrid, FiChevronDown, FiChevronLeft, FiChevronRight, FiFileText, FiLayers, FiInbox, FiMenu, FiSettings, FiMessageCircle, FiServer, FiZap, FiX, FiBarChart2, FiPlusCircle, FiClock, FiDownload, FiClipboard, FiMail, FiMessageSquare, FiTag, FiImage, FiUsers, FiUser, FiHelpCircle, FiTarget, FiStar, FiInfo, FiCalendar, FiBell, FiCheckCircle, FiAward } from "react-icons/fi";
import { useSiteSettings } from "../../hooks/useSupabase";

const navGroups = [
  { label: "Dashboard", icon: FiHome, items: [{ to: "/admin", label: "Dashboard", icon: FiHome }] },
  {
    label: "All Pages", icon: FiFile,
    items: [
      { to: "/admin/home", label: "Home", icon: FiHome, catchSubRoutes: true },
      { to: "/admin/about-page", label: "About", icon: FiUser },
      { to: "/admin/services-page", label: "Services", icon: FiServer },
      { to: "/admin/career-page", label: "Career", icon: FiBriefcase },
      { to: "/admin/blog-page", label: "Blog", icon: FiFileText },
      { to: "/admin/contact-page", label: "Contact", icon: FiMail },
      { to: "/admin/terms-policy", label: "Terms & Conditions", icon: FiFileText },
      { to: "/admin/privacy-policy", label: "Privacy Policy", icon: FiFileText },
    ],
  },
  { label: "Chat", icon: FiMessageCircle, items: [
    { to: "/admin/chats?tab=live", label: "Live Chat", icon: FiMessageCircle },
    { to: "/admin/chats?tab=history", label: "Chat History", icon: FiClock }
    ]},
  {
    label: "Jobs", icon: FiBriefcase, items: [
      { to: "/admin/jobs/new", label: "Add Job", icon: FiPlusCircle },
      { to: "/admin/jobs", label: "View Jobs", icon: FiBriefcase, catchSubRoutes: true, siblingRoutes: ["/admin/jobs/new"] },
      { to: "/admin/internships/new", label: "Add Intern", icon: FiPlusCircle },
      { to: "/admin/internships", label: "View Internships", icon: FiClock, catchSubRoutes: true, siblingRoutes: ["/admin/internships/new"] }
    ],
  },
  { label: "Submissions", icon: FiInbox, items: [
    { to: "/admin/career-submissions", label: "Career Submissions", icon: FiBriefcase },
    { to: "/admin/career-contact-submissions", label: "Career Enquiry", icon: FiMail },
    { to: "/admin/brochure-downloads", label: "Brochure Downloads", icon: FiDownload },
    { to: "/admin/form-submissions", label: "Form Submissions", icon: FiClipboard },
    { to: "/admin/newsletter-subscribers", label: "Newsletter Subscribers", icon: FiMail },
    { to: "/admin/contact-submissions", label: "Contact Submissions", icon: FiMessageSquare },
    { to: "/admin/about-submissions", label: "About Submissions", icon: FiInfo },
    { to: "/admin/upcoming-class-submissions", label: "Upcoming Class Registrations", icon: FiCalendar },
    { to: "/admin/course-interests", label: "Course Enquiries", icon: FiMessageSquare },
    { to: "/admin/banking-enquiries", label: "Banking Enquiries", icon: FiCheckCircle },
    { to: "/admin/upcoming-course-interests", label: "Upcoming Course Interests", icon: FiBell },
    { to: "/admin/chat-submissions", label: "Chat Submissions", icon: FiMessageCircle },
    { to: "/admin/courses/reports", label: "Reports", icon: FiBarChart2 }
    ]},
  {
    label: "Courses", icon: FiBookOpen, items: [
      { label: "Software Learning", children: [
        { to: "/admin/courses/wizard?category=Software%20Learning", label: "Add Course", icon: FiPlusCircle },
        { to: "/admin/courses?category=Software%20Learning", label: "View Courses", icon: FiBookOpen }
      ]},
      { label: "Competitive Exam", children: [
        { to: "/admin/courses/wizard?category=Competitive%20Exam", label: "Add Course", icon: FiPlusCircle },
        { to: "/admin/courses?category=Competitive%20Exam", label: "View Courses", icon: FiBookOpen }
      ]},
      { label: "Tags", children: [
        { to: "/admin/tags/add", label: "Add Tag", icon: FiPlusCircle },
        { to: "/admin/tags", label: "View Tags", icon: FiTag }
      ]},
      { label: "Upcoming Classes", children: [
        { to: "/admin/upcoming-courses/new", label: "Add", icon: FiPlusCircle },
        { to: "/admin/upcoming-courses", label: "View", icon: FiCalendar, catchSubRoutes: true, siblingRoutes: ["/admin/upcoming-courses/new"] }
      ]},
      { to: "/admin/courses/brochure", label: "Brochure", icon: FiFileText },
    ],
  },
  {
    label: "Testimonials", icon: FiStar, items: [
      { to: "/admin/testimonials/new", label: "Add", icon: FiPlusCircle },
      { to: "/admin/testimonials", label: "View", icon: FiStar, catchSubRoutes: true, siblingRoutes: ["/admin/testimonials/new"] }
    ],
  },
  {
    label: "Banking Testimonial", icon: FiAward, items: [
      { to: "/admin/banking-testimonials/new", label: "Add", icon: FiPlusCircle },
      { to: "/admin/banking-testimonials", label: "View", icon: FiAward, catchSubRoutes: true, siblingRoutes: ["/admin/banking-testimonials/new"] }
    ],
  },
  {
    label: "Blog", icon: FiFileText, items: [
      { to: "/admin/blog/new", label: "Add Blog", icon: FiPlusCircle },
      { to: "/admin/blog", label: "View Posts", icon: FiFileText, catchSubRoutes: true, siblingRoutes: ["/admin/blog/categories", "/admin/blog/new"] },
      { to: "/admin/blog/categories", label: "Categories", icon: FiGrid }
    ],
  },
  { label: "Menu", icon: FiMenu, items: [
    { label: "Software Learning", children: [
      { to: "/admin/nav-menu?section=Software%20Learning&tab=add", label: "Add Menu", icon: FiPlusCircle },
      { to: "/admin/nav-menu?section=Software%20Learning&tab=view", label: "View Menu", icon: FiMenu }
    ]},
    { label: "Competitive Exam", children: [
      { to: "/admin/nav-menu?section=Competitive%20Exam&tab=add", label: "Add Menu", icon: FiPlusCircle },
      { to: "/admin/nav-menu?section=Competitive%20Exam&tab=view", label: "View Menu", icon: FiMenu }
    ]},
    { label: "Services", children: [
      { to: "/admin/nav-menu?section=Services&tab=add", label: "Add Menu", icon: FiPlusCircle },
      { to: "/admin/nav-menu?section=Services&tab=view", label: "View Menu", icon: FiMenu }
    ]}
    ]},
  { label: "Uploads", icon: FiLayers, items: [
    { to: "/admin/media", label: "Media Library", icon: FiImage }
    ]},
  { label: "Settings", icon: FiSettings, items: [
    { to: "/admin/site-settings?section=general", label: "Site Settings", icon: FiSettings },
    { to: "/admin/admin-users", label: "Admin Users", icon: FiUsers }
    ]}
    ];

function isActive(pathname, item) {
  const fullPath = pathname.split("?")[0] || "/";
  const fullSearch = pathname.includes("?") ? pathname.split("?").slice(1).join("?") : "";
  const itemPath = (item.to.split("?")[0].replace(/\/$/, "") || "/");
  const itemSearch = item.to.includes("?") ? item.to.split("?").slice(1).join("?") : "";

  if (fullPath.replace(/\/$/, "") === itemPath) {
    if (!fullSearch && !itemSearch) return true;
    if (fullSearch && itemSearch) {
      const fullParams = new URLSearchParams(fullSearch);
      const itemParams = new URLSearchParams(itemSearch);
      let match = true;
      for (const [key, val] of itemParams.entries()) {
        if (fullParams.get(key) !== val) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
  }

  if (item.catchSubRoutes && fullPath.replace(/\/$/, "").startsWith(itemPath + "/")) {
    const nextSeg = fullPath.replace(/\/$/, "").slice(itemPath.length + 1).split("/")[0];
    if (item.siblingRoutes) {
      for (const sib of item.siblingRoutes) {
        if (sib.split("/").filter(Boolean).pop() === nextSeg) return false;
      }
    }
    return true;
  }

  return false;
}

const STORAGE_KEY = 'admin_sidebar_groups';
const activeLabelStyle = {
  color: '#ffffff',
};

function loadGroupState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveGroupState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function useGroupOpen(pathname) {
  const [groupState, setGroupState] = useState(() => {
    const saved = loadGroupState();
    const idx = navGroups.findIndex((g) =>
      g.items.some((item) => {
        if (item.to) return isActive(pathname, item);
        if (item.children) return item.children.some((c) => isActive(pathname, c));
        return false;
      })
    );
    const next = {};
      navGroups.forEach((_, i) => { next[String(i)] = false; });
      if (idx >= 0) next[String(idx)] = true;
      else if (saved) {
        const firstOpen = Object.keys(saved).find((k) => saved[k]);
        if (firstOpen) next[firstOpen] = true;
      }
    saveGroupState(next);
    return next;
  });

  useEffect(() => {
    const idx = navGroups.findIndex((g) =>
      g.items.some((item) => {
        if (item.to) return isActive(pathname, item);
        if (item.children) return item.children.some((c) => isActive(pathname, c));
        return false;
      })
    );
    setGroupState((prev) => {
      if (idx >= 0 && prev[String(idx)]) return prev;
      const next = {};
      navGroups.forEach((_, i) => { next[String(i)] = false; });
      if (idx >= 0) next[String(idx)] = true;
      saveGroupState(next);
      return next;
    });
  }, [pathname]);

  const toggleGroup = useCallback((idx) => {
    setGroupState((prev) => {
      const key = String(idx);
      const currentlyOpen = prev[key];
      const next = {};
      navGroups.forEach((_, i) => { next[String(i)] = false; });
      if (!currentlyOpen) next[key] = true;
      saveGroupState(next);
      return next;
    });
  }, []);

  const isOpen = useCallback((idx) => !!groupState[String(idx)], [groupState]);

  return [isOpen, toggleGroup];
}

// Shared animated wrapper for collapsible submenus.
// grid-rows-[0fr]->[1fr] animates height without needing a fixed max-height,
// so it works regardless of how many items a group has.
function Collapsible({ open, children }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function NestedNavGroup({ item, pathname, onNavigate, isAccordionOpen, onToggleAccordion }) {
  const hasControlledOpen = isAccordionOpen !== undefined;
  const [localOpen, setLocalOpen] = useState(() => item.children.some((c) => isActive(pathname, c)));
  useEffect(() => {
    if (item.children.some((c) => isActive(pathname, c))) {
      if (hasControlledOpen) {
        if (!isAccordionOpen) onToggleAccordion?.();
      } else {
        setLocalOpen(true);
      }
    }
  }, [pathname, item.children]);

  const open = hasControlledOpen ? isAccordionOpen : localOpen;
  const handleToggle = () => {
    if (hasControlledOpen) {
      onToggleAccordion?.();
    } else {
      setLocalOpen((p) => !p);
    }
  };

  const iconColor = '#707897';

  const hasActiveChild = item.children.some((c) => isActive(pathname, c));

  return (
    <div>
      <button
        onClick={handleToggle}
        className={`cursor-pointer w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
          hasActiveChild ? "" : "text-[#939AB3] hover:text-white hover:bg-white/5 hover:translate-x-0.5"
        }`}
        style={hasActiveChild ? { color: '#ffffff' } : undefined}
      >
        <FiChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${open ? "" : "-rotate-90"}`}
          style={{ color: iconColor }}
        />
        <span className="truncate" style={hasActiveChild ? activeLabelStyle : undefined}>{item.label}</span>
      </button>
      <Collapsible open={open}>
        <div className="ml-3 pl-2 mt-0.5 mb-1 space-y-0.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
              {item.children.map((child) => {
            const act = isActive(pathname, child);
            const ItemIcon = child.icon;
            return (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={onNavigate}
                end
                className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                  act ? "" : "text-[#939AB3] hover:text-white hover:bg-white/5 hover:translate-x-0.5"
                }`}
                      style={act ? { color: '#ffffff' } : undefined}
              >
                {ItemIcon && <ItemIcon className="w-3.5 h-3.5 shrink-0" style={{ color: '#707897' }} />}
                      <span className="truncate" style={act ? activeLabelStyle : undefined}>{child.label}</span>
              </NavLink>
            );
          })}
        </div>
      </Collapsible>
    </div>
  );
}

function SidebarNav({ group, idx, pathname, isOpen, onToggle, onNavigate }) {
  const [activeNested, setActiveNested] = useState(() => {
    const activeIdx = group.items.findIndex(item =>
      item.children && item.children.some(c => isActive(pathname, c))
    );
    return activeIdx >= 0 ? activeIdx : null;
  });

  const Icon = group.icon;
  const groupActive = group.items.some((item) => {
    if (item.to) return isActive(pathname, item);
    if (item.children) return item.children.some((c) => isActive(pathname, c));
    return false;
  });
  const opened = isOpen(idx);
  const iconColor = '#64748b';
  const groupIconColor = iconColor;

  if (group.items.length === 1 && group.items[0].to) {
    return (
      <NavLink
        to={group.items[0].to}
        end
        onClick={onNavigate}
        className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all duration-200 ${
          groupActive ? "font-semibold" : "text-[#939AB3] hover:text-white hover:bg-white/5 hover:translate-x-0.5"
        }`}
          style={groupActive ? { color: '#ffffff' } : undefined}
      >
        <Icon
          className="w-4 h-4 shrink-0 transition-colors duration-200"
          style={{ color: groupIconColor }}
        />
          <span className="truncate" style={groupActive ? activeLabelStyle : undefined}>{group.label}</span>
      </NavLink>
    );
  }

  if (group.parentTo) {
    return (
      <>
        <div className="flex items-center rounded-md overflow-hidden">
          <NavLink
            to={group.parentTo}
            end
            onClick={onNavigate}
            className={`cursor-pointer flex-1 flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all duration-200 ${
              groupActive ? "font-semibold" : "text-[#939AB3] hover:text-white hover:bg-white/5"
            }`}
            style={groupActive ? { color: '#ffffff' } : undefined}
          >
            <Icon
              className="w-4 h-4 shrink-0 transition-colors duration-200"
              style={{ color: groupIconColor }}
            />
            <span className="truncate" style={groupActive ? activeLabelStyle : undefined}>{group.label}</span>
          </NavLink>
          <button
            onClick={() => onToggle(idx)}
            className="cursor-pointer p-2 mr-1 rounded-md transition-all duration-200 hover:bg-white/5"
            style={{ color: iconColor }}
          >
            <FiChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${opened ? '' : '-rotate-90'}`}
            />
          </button>
        </div>
        <Collapsible open={opened}>
          <div className="ml-2 pl-2 mt-0.5 space-y-0.5">
            {group.items.map((item, itemIdx) => {
              if (item.children) return (
                <NestedNavGroup
                  key={item.label}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  isAccordionOpen={activeNested === itemIdx}
                  onToggleAccordion={() => setActiveNested(prev => prev === itemIdx ? null : itemIdx)}
                />
              );
              const act = isActive(pathname, item);
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                    act ? "font-semibold" : "text-[#939AB3] hover:text-white hover:bg-white/5 hover:translate-x-0.5"
                  }`}
                      style={act ? { color: '#ffffff' } : undefined}
                >
                  {ItemIcon && <ItemIcon className="w-3.5 h-3.5 shrink-0" style={{ color: '#707897' }} />}
                      <span className="truncate" style={act ? activeLabelStyle : undefined}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </Collapsible>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => onToggle(idx)}
        className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all duration-200 ${
          groupActive ? "font-semibold" : "text-[#939AB3] hover:text-white hover:bg-white/5"
        }`}
        style={groupActive ? { color: '#ffffff' } : undefined}
      >
        <Icon
          className="w-4 h-4 shrink-0 transition-colors duration-200"
          style={{ color: groupIconColor }}
        />
        <span className="flex-1 text-left truncate" style={groupActive ? activeLabelStyle : undefined}>{group.label}</span>
        <FiChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${opened ? '' : '-rotate-90'}`}
          style={{ color: iconColor }}
        />
      </button>
      <Collapsible open={opened}>
        <div className="ml-2 pl-2 mt-0.5 space-y-0.5">
          {group.items.map((item, itemIdx) => {
            if (item.children) return (
              <NestedNavGroup
                key={item.label}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
                isAccordionOpen={activeNested === itemIdx}
                onToggleAccordion={() => setActiveNested(prev => prev === itemIdx ? null : itemIdx)}
              />
            );
            const act = isActive(pathname, item);
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                  act ? "font-semibold" : "text-[#939AB3] hover:text-white hover:bg-white/5 hover:translate-x-0.5"
                }`}
                      style={act ? { color: '#ffffff' } : undefined}
              >
                {ItemIcon && <ItemIcon className="w-3.5 h-3.5 shrink-0" style={{ color: '#707897' }} />}
                      <span className="truncate" style={act ? activeLabelStyle : undefined}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </Collapsible>
    </>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { pathname, search } = useLocation();
  const fullPath = pathname + search;
  const [isOpen, toggleGroup] = useGroupOpen(fullPath);
  const { data: settings } = useSiteSettings();

  const content = (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(to bottom, #0C1028, #0A0E20)' }}>
      <div className="flex items-center justify-between h-14 shrink-0 px-4 border-b border-gray-200" style={{ background: 'white' }}>
        <NavLink to="/admin" onClick={onMobileClose} className="flex items-center gap-2.5 min-w-0 group">
          <img src={settings?.logo_url || settings?.logo || "/apple-touch-icon.png"} alt="Marvel Slice Logo" className="w-8 h-8 object-contain rounded-md shrink-0 transition-transform duration-200 group-hover:scale-105" />
          <div className="min-w-0">
            <span className="text-sm font-bold block leading-tight text-dark-navy">Marvel <span className="text-brand-orange">Slice</span></span>
            <span className="text-[10px] font-medium text-neutral-500">Management Portal</span>
          </div>
        </NavLink>
        <button
          onClick={onMobileClose}
          aria-label="Close sidebar"
          className="lg:hidden p-1.5 rounded-md transition-all duration-200 hover:bg-black/5 active:scale-90"
          style={{ color: '#707897' }}
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto admin-scrollbar py-3 px-2 space-y-0.5 admin-scrollbar">
        {navGroups.map((group, idx) => (
          <SidebarNav key={group.label} group={group} idx={idx} pathname={fullPath} isOpen={isOpen} onToggle={toggleGroup} onNavigate={onMobileClose} />
        ))}
      </nav>

      <div className="px-4 py-3 shrink-0 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md transition-colors duration-200 hover:bg-white/[0.08]" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 shadow-sm" style={{ background: 'linear-gradient(to bottom right, rgba(91,80,236,0.4), rgba(91,80,236,0.05))', color: '#5B50EC' }}>M</div>
          <div className="min-w-0">
            <p className="text-xs font-medium" style={{ color: '#939AB3' }}>Marvel Slice v1.0</p>
            <p className="text-[10px]" style={{ color: '#707897' }}>Admin Panel</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 h-screen overflow-hidden shadow-elevated transition-all duration-300" style={{ background: 'linear-gradient(to bottom, #0C1028, #0A0E20)' }}>{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer animate-[fadeIn_0.2s_ease-in-out]"
            onClick={onMobileClose}
          />
          <aside
            className="fixed left-0 top-0 h-full w-[min(84vw,340px)] shadow-elevated z-50 overflow-hidden animate-[slideIn_0.25s_ease-out]"
            style={{ background: 'linear-gradient(to bottom, #0C1028, #0A0E20)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Sidebar navigation"
          >
            {content}
          </aside>
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}

function HierarchicalMobileNav({ onMobileClose, pathname }) {
  const [navStack, setNavStack] = useState([{ title: 'Marvel Slice Admin', items: navGroups }]);

  const currentLevel = navStack[navStack.length - 1];
  const canGoBack = navStack.length > 1;

  function handleGoBack() {
    if (canGoBack) {
      setNavStack(prev => prev.slice(0, -1));
    }
  }

  function handleItemClick(item) {
    const subItems = item.items || item.children;
    if (subItems && subItems.length > 0) {
      setNavStack(prev => [...prev, { title: item.label, items: subItems }]);
    }
  }

  return (
    <div className="flex flex-col h-full text-white" style={{ background: 'linear-gradient(to bottom, #0C1028, #0A0E20)' }}>
      <div className="flex items-center justify-between h-14 px-4 border-b border-white/10 shrink-0">
        {canGoBack ? (
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-brand-orange transition-colors min-h-[44px] cursor-pointer"
          >
            <FiChevronLeft className="w-5 h-5 text-brand-orange" />
            <span className="truncate max-w-[190px]">{currentLevel.title}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-orange to-amber-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              M
            </div>
            <span className="text-base font-extrabold text-white tracking-wide">
              Marvel <span className="text-brand-orange">Slice</span>
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onMobileClose}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10"
          aria-label="Close menu"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto admin-scrollbar py-3 px-3 space-y-1">
        {currentLevel.items.map((item, idx) => {
          const subItems = item.items || item.children;
          const hasSub = subItems && subItems.length > 0;
          const Icon = item.icon || FiFile;

          if (hasSub) {
            return (
              <button
                key={item.label || idx}
                type="button"
                onClick={() => handleItemClick(item)}
                className="w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {Icon && <Icon className="w-4 h-4 text-brand-orange shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-neutral-400 group-hover:text-white">
                  <span className="text-xs text-neutral-400 font-mono">({subItems.length})</span>
                  <FiChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          }

          const active = item.to ? isActive(pathname, item) : false;

          return (
            <NavLink
              key={item.to || item.label || idx}
              to={item.to || '#'}
              onClick={onMobileClose}
              className={`flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'text-neutral-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {Icon && <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-neutral-400'}`} />}
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="px-4 py-3 shrink-0 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="w-6 h-6 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center text-[10px] font-extrabold shrink-0">
            M
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">Marvel Slice Admin</p>
            <p className="text-[10px] text-neutral-400">v1.0 Mobile Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
