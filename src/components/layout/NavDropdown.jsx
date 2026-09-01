import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { useNavChildren } from "../../hooks/useSupabase";

function hasChildren(item) {
  return (item.children && item.children.length > 0) || hasNavChildren(item);
}

function hasNavChildren(item) {
  return item._navChildren && item._navChildren.length > 0;
}

function isItemOrSubtreeActive(item, currentPath, parentParam, resolvedChildren) {
  if (!currentPath) return false;

  // 1. Direct path match
  if (item.path) {
    if (currentPath === item.path) return true;
    if (item.path !== '/' && currentPath.startsWith(item.path + '/')) return true;
  }

  const label = item.label || '';
  const labelSlug = label.toLowerCase().replace(/\s+/g, '-');

  // 2. Query param match (e.g. ?parent=software-learning or ?parent=competitive-exam)
  if (parentParam && (parentParam === labelSlug || (parentParam === 'sl' && labelSlug === 'software-learning') || (parentParam === 'ce' && labelSlug === 'competitive-exam'))) {
    return true;
  }

  // 3. Category & Course route matching for Software Learning
  if (label === 'Software Learning') {
    const isCompetitive = currentPath === '/banking' || currentPath.startsWith('/banking') || currentPath.includes('competitive-exam') || currentPath.startsWith('/courses/ce/') || parentParam === 'competitive-exam' || parentParam === 'ce';
    if (!isCompetitive && (
      currentPath.startsWith('/courses') ||
      currentPath.startsWith('/software-learning')
    )) {
      return true;
    }
  }

  // 4. Competitive Exam matching
  if (label === 'Competitive Exam') {
    if (currentPath === '/banking' || currentPath.startsWith('/banking') || currentPath.includes('competitive-exam') || currentPath.startsWith('/courses/ce/') || parentParam === 'competitive-exam' || parentParam === 'ce') {
      return true;
    }
  }

  // 5. Services matching (e.g. /services, /services/:slug)
  if (label === 'Services') {
    if (currentPath === '/services' || currentPath.startsWith('/services/')) {
      return true;
    }
  }

  // 6. Blog matching (e.g. /blog, /blog/:slug)
  if (label === 'Blog') {
    if (currentPath === '/blog' || currentPath.startsWith('/blog/')) {
      return true;
    }
  }

  // 7. Career matching (e.g. /career, /career/:id)
  if (label === 'Career') {
    if (currentPath === '/career' || currentPath.startsWith('/career/')) {
      return true;
    }
  }

  // 8. Contact matching
  if (label === 'Contact') {
    if (currentPath === '/contact' || currentPath.startsWith('/contact/')) {
      return true;
    }
  }

  // 9. About matching
  if (label === 'About') {
    if (currentPath === '/about' || currentPath.startsWith('/about/')) {
      return true;
    }
  }

  // 10. Check if any resolved children match
  function checkChildren(childrenList) {
    if (!childrenList || !Array.isArray(childrenList)) return false;
    return childrenList.some(child => {
      if (child.path && (currentPath === child.path || (child.path !== '/' && currentPath.startsWith(child.path + '/')))) {
        return true;
      }
      if (child.children && checkChildren(child.children)) return true;
      if (child._navChildren && checkChildren(child._navChildren)) return true;
      return false;
    });
  }

  if (resolvedChildren && checkChildren(resolvedChildren)) return true;

  return false;
}

function DesktopNavItem({
  item,
  depth,
  isOpen,
  onOpen,
  onClose,
  onItemClick,
  closeDelay: cd,
  currentPath,
}) {
  const containerRef = useRef(null);
  const closeTimer = useRef(null);
  const location = useLocation();
  const path = currentPath || location.pathname;
  const [searchParams] = useSearchParams();
  const parentParam = searchParams.get("parent");

  const { data: navChildren } = useNavChildren(
    depth === 0 && !item.path ? item.label : null,
  );

  const resolvedChildren =
    item.children || item._navChildren || navChildren || [];
  const hasSub = resolvedChildren.length > 0;

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => onClose(), cd);
  }, [onClose, cd]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function handleKeyDown(e) {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll(
      '[role="menuitem"]:not([data-hidden])',
    );
    const currentIndex = Array.from(items).indexOf(document.activeElement);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        items[(currentIndex + 1) % items.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
        break;
      case "ArrowRight":
        e.preventDefault();
        if (hasSub && depth > 0) {
          onOpen();
          requestAnimationFrame(() => {
            container
              .querySelector(':scope > [data-submenu] [role="menuitem"]')
              ?.focus();
          });
        }
        break;
      case "ArrowLeft":
      case "Escape":
        e.preventDefault();
        onClose();
        container
          .closest("[data-menu-item]")
          ?.querySelector('[role="menuitem"]')
          ?.focus();
        break;
    }
  }

  if (!hasSub) {
    const isActive = isItemOrSubtreeActive(item, path, parentParam, null);
    return (
      <Link
        to={item.path || "#"}
        role="menuitem"
        className={`block pl-[17px] pr-5 py-2.5 text-sm whitespace-nowrap transition-all duration-200 ease-out border-l-[3px] ${
          isActive
            ? "border-brand-blue text-brand-blue font-semibold"
            : "border-transparent text-gray-600 hover:border-brand-blue/50 hover:text-brand-blue"
        }`}
        onClick={onItemClick}
        tabIndex={0}
      >
        {item.label}
      </Link>
    );
  }

  if (depth === 0) {
    const hasActiveChild = isItemOrSubtreeActive(item, path, parentParam, resolvedChildren);

    return (
      <div
        ref={containerRef}
        data-menu-item
        className="relative"
        onMouseEnter={() => {
          cancelClose();
          onOpen();
        }}
        onMouseLeave={scheduleClose}
        onKeyDown={handleKeyDown}
      >
        <button
          role="menuitem"
          aria-haspopup="true"
          aria-expanded={isOpen}
          className={`group flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap rounded-t-md transition-all duration-200 ease-out cursor-pointer ${
              isOpen || hasActiveChild
              ? "text-brand-blue font-semibold"
              : "text-gray-500 hover:text-brand-blue"
          }`}
          onClick={() => (isOpen ? onClose() : onOpen())}
        >
          <span className="relative inline-block pb-[3px]">
            <span className={`transition-all duration-300 ease-in-out ${
                isOpen || hasActiveChild
                ? "text-brand-blue"
                : ""
            }`}>{item.label}</span>
            <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-brand-blue rounded-full origin-left transition-transform duration-300 ease-in-out ${
                isOpen || hasActiveChild ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`} />
          </span>
          <FiChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
               className="absolute left-0 top-full mt-1.5 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-lg border border-gray-100 py-3 z-50 min-w-[240px]"
              role="menu"
              data-submenu
            >
              <SubmenuItems
                items={resolvedChildren}
                depth={1}
                currentPath={path}
                onItemClick={onItemClick}
                closeDelay={cd}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-menu-item
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        onOpen();
      }}
      onMouseLeave={scheduleClose}
      onKeyDown={handleKeyDown}
    >
      <button
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={isOpen}
          className={`group w-full flex items-center justify-between gap-3 pl-[17px] pr-5 py-2.5 text-sm whitespace-nowrap transition-all duration-200 ease-out cursor-pointer border-l-[3px] ${
            isOpen
              ? "border-brand-blue text-brand-blue font-semibold"
              : "border-transparent text-gray-700 hover:border-brand-blue/50 hover:text-brand-blue"
          }`}
        onClick={() => (isOpen ? onClose() : onOpen())}
      >
        <span>{item.label}</span>
        <FiChevronRight
          className={`w-3.5 h-3.5 shrink-0 transition-all duration-200 ease-out ${isOpen ? "translate-x-0.5" : "group-hover:translate-x-0.5"}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-full top-0 ml-1.5 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-lg border border-gray-100 py-3 z-50 min-w-[240px]"
            role="menu"
            data-submenu
          >
            <SubmenuItems
              items={resolvedChildren}
              depth={depth + 1}
              currentPath={currentPath}
              onItemClick={onItemClick}
              closeDelay={cd}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubmenuItems({ items, depth, currentPath, onItemClick, closeDelay }) {
  const [openIdx, setOpenIdx] = useState(null);
  const openTimer = useRef(null);

  const handleOpen = useCallback((idx) => {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setOpenIdx(idx), 0);
  }, []);

  const handleClose = useCallback((idx) => {
    setOpenIdx((prev) => (prev === idx ? null : prev));
  }, []);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
    };
  }, []);

  return items.map((child, idx) => {
    const childItem = (
      <DesktopNavItem
        key={idx}
        item={child}
        depth={depth}
        isOpen={openIdx === idx}
        onOpen={() => handleOpen(idx)}
        onClose={() => handleClose(idx)}
        onItemClick={onItemClick}
        closeDelay={closeDelay}
        currentPath={currentPath}
      />
    );

    if (depth === 1) {
      return (
        <div
          key={idx}
          className={
            child.children || child._navChildren ? "" : "min-w-[200px]"
          }
        >
          {childItem}
        </div>
      );
    }
    return childItem;
  });
}

export default function NavDropdown({
  items,
  currentPath,
  onItemClick,
  closeDelay = 150,
}) {
  const [openIdx, setOpenIdx] = useState(null);
  const openTimer = useRef(null);
  const [searchParams] = useSearchParams();
  const parentParam = searchParams.get("parent");

  const handleOpen = useCallback((idx) => {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setOpenIdx(idx), 0);
  }, []);

  const handleClose = useCallback((idx) => {
    setOpenIdx((prev) => (prev === idx ? null : prev));
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && openIdx !== null) setOpenIdx(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openIdx]);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
    };
  }, []);

  const location = useLocation();
  const path = currentPath || location.pathname;

  return (
    <nav role="menubar" className="flex items-center gap-0.5">
      {items.map((item, idx) => {
        const hasChildrenFromNav = !item.path && item.label;
        if (!item.path && !hasChildrenFromNav) {
          return null;
        }
        const isActive = isItemOrSubtreeActive(item, path, parentParam, item.children);
        return item.path ? (
          <Link
            key={idx}
            to={item.path}
            role="menuitem"
            className={`group relative px-3 py-2 text-sm font-medium whitespace-nowrap rounded-t-md transition-all duration-200 ease-out ${
              isActive
                ? "text-brand-blue"
                : "text-gray-500 hover:text-brand-blue"
            }`}
            onClick={onItemClick}
          >
            <span className="relative inline-block pb-[3px]">
              <span className={isActive ? "text-brand-blue font-semibold" : ""}>{item.label}</span>
              <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-brand-blue rounded-full origin-left transition-transform duration-300 ease-in-out ${
                isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`} />
            </span>
          </Link>
        ) : (
          <DesktopNavItem
            key={idx}
            item={item}
            depth={0}
            currentPath={path}
            isOpen={openIdx === idx}
            onOpen={() => handleOpen(idx)}
            onClose={() => handleClose(idx)}
            onItemClick={onItemClick}
            closeDelay={closeDelay}
          />
        );
      })}
    </nav>
  );
}

/* ==================================================================
   MOBILE
   ================================================================== */

function MobileNavItem({
  item,
  depth = 0,
  currentPath,
  onItemClick,
  isOpen,
  onToggle,
}) {
  const location = useLocation();
  const path = currentPath || location.pathname;
  const [searchParams] = useSearchParams();
  const parentParam = searchParams.get("parent");
  const { data: navChildren } = useNavChildren(
    depth === 0 && !item.path ? item.label : null,
  );
  const resolvedChildren =
    item.children || item._navChildren || navChildren || [];
  const hasSub = resolvedChildren.length > 0;
  const [childOpenIdx, setChildOpenIdx] = useState(null);

  if (!hasSub) {
    const isActive = isItemOrSubtreeActive(item, path, parentParam, null);

    return (
      <Link
        to={item.path || "#"}
        className={`block pl-[17px] pr-5 py-3 text-sm font-medium transition-all duration-200 border-l-[3px] ${
          isActive
            ? "border-brand-blue text-brand-blue font-semibold"
            : "border-transparent text-gray-600 hover:border-brand-blue/50 hover:text-brand-blue"
        }`}
        onClick={onItemClick}
      >
        {item.label}
      </Link>
    );
  }

  const hasActiveChild = isItemOrSubtreeActive(item, path, parentParam, resolvedChildren);

  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between pl-[17px] pr-5 py-3 text-sm font-medium transition-all duration-200 cursor-pointer border-l-[3px] ${
          depth === 0
            ? isOpen || hasActiveChild
              ? "border-brand-blue text-brand-blue font-semibold"
              : "border-transparent text-gray-600 hover:border-brand-blue/50 hover:text-brand-blue"
            : "border-transparent text-gray-600 hover:border-brand-blue/50 hover:text-brand-blue"
        }`}
      >
        <span>{item.label}</span>
        <FiChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="mobile-sub"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className={`py-1 ${depth === 0 ? "pl-6" : "pl-4"} border-l border-gray-100 ml-5`}
            >
              {resolvedChildren.map((child, idx) => (
                <MobileNavItem
                  key={idx}
                  item={child}
                  depth={depth + 1}
                  currentPath={path}
                  onItemClick={onItemClick}
                  isOpen={childOpenIdx === idx}
                  onToggle={() =>
                    setChildOpenIdx(childOpenIdx === idx ? null : idx)
                  }
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileNav({ items, currentPath, onItemClick }) {
  const [openIdx, setOpenIdx] = useState(null);
  const location = useLocation();
  const path = currentPath || location.pathname;
  return (
    <div className="px-2 py-4 space-y-1 max-h-[calc(100vh-6rem)] overflow-y-auto">
      {items.map((item, idx) => (
        <MobileNavItem
          key={idx}
          item={item}
          depth={0}
          currentPath={path}
          onItemClick={onItemClick}
          isOpen={openIdx === idx}
          onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
        />
      ))}
    </div>
  );
}
