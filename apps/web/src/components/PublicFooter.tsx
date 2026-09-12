"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconPhone, IconArrowUp, IconGlobe } from "@tabler/icons-react";

const SITE = "https://marvelslice.com";

const QUICK_LINKS = [
  { label: "Home", href: `${SITE}/` },
  { label: "About", href: `${SITE}/about` },
  { label: "Courses", href: `${SITE}/courses` },
  { label: "Services", href: `${SITE}/services` },
  { label: "Career", href: `${SITE}/career` },
  { label: "Contact", href: `${SITE}/contact` },
];

const COURSE_LINKS = [
  { label: "Software Learning", href: `${SITE}/courses` },
  { label: "Banking & Competitive Exams", href: `${SITE}/banking` },
  { label: "All Courses", href: `${SITE}/courses` },
];

const PHONES = ["+91 63809 57390", "+91 80882 18609"];

export default function PublicFooter() {
  const [showTop, setShowTop] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide the floating button while the footer is on screen so it never
  // covers footer/pagination content at the bottom of the page.
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-4">
          {/* Brand + contact */}
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <Link
              href={SITE}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Marvel Slice website"
              className="mb-4 flex items-center gap-2"
            >
              <Image
                src="/images/logo.svg"
                alt="Marvel Slice"
                width={44}
                height={44}
                className="h-11 w-auto shrink-0 object-contain"
              />
              <span className="text-xl font-extrabold tracking-tight">
                <span className="text-[#175cdd]">Marvel</span>{" "}
                <span className="text-[#f59e0b]">Slice</span>
              </span>
            </Link>
            <div className="flex flex-col items-center gap-2.5 text-sm text-gray-200 sm:items-start">
              {PHONES.map((num) => (
                <a
                  key={num}
                  href={`tel:${num.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 transition-colors hover:text-[#f59e0b]"
                >
                  <IconPhone size={16} className="shrink-0 text-[#f59e0b]" />
                  <span className="whitespace-nowrap">{num}</span>
                </a>
              ))}
              <a
                href={SITE}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-[#f59e0b]"
              >
                <IconGlobe size={16} className="shrink-0 text-[#f59e0b]" />
                <span>marvelslice.com</span>
              </a>
            </div>
          </div>

          {/* Quick links (landing site) */}
          <div className="text-center sm:text-left">
            <h4 className="mb-3 text-[15px] font-bold uppercase tracking-wider text-white sm:text-base">
              Quick Links
            </h4>
            <ul className="space-y-2 text-center sm:text-left">
              {QUICK_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block py-1 text-sm text-gray-200 transition-colors hover:text-[#f59e0b] sm:text-base"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses (landing site) */}
          <div className="text-center sm:text-left">
            <h4 className="mb-3 text-[15px] font-bold uppercase tracking-wider text-white sm:text-base">
              Courses
            </h4>
            <ul className="space-y-2 text-center sm:text-left">
              {COURSE_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block py-1 text-sm text-gray-200 transition-colors hover:text-[#f59e0b] sm:text-base"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="text-center sm:text-left">
            <h4 className="mb-3 text-[15px] font-bold uppercase tracking-wider text-white sm:text-base">
              Support
            </h4>
            <ul className="space-y-2 text-center sm:text-left">
              <li>
                <Link
                  href="/login"
                  className="inline-block py-1 text-sm text-gray-200 transition-colors hover:text-[#f59e0b] sm:text-base"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <a
                  href={`${SITE}/privacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1 text-sm text-gray-200 transition-colors hover:text-[#f59e0b] sm:text-base"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href={`${SITE}/terms`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1 text-sm text-gray-200 transition-colors hover:text-[#f59e0b] sm:text-base"
                >
                  Terms &amp; Conditions
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom orange bar (matches landing) */}
      <div className="bg-[#f59e0b] py-3.5 sm:py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs font-medium text-white sm:flex-row sm:px-6 sm:text-base lg:px-8">
          <span className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} Marvel Slice. All rights reserved.
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
            <a
              href={`${SITE}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Privacy Policy
            </a>
            <span className="text-white/60">|</span>
            <a
              href={`${SITE}/terms`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Terms &amp; Conditions
            </a>
          </div>
        </div>
      </div>

      {showTop && !footerVisible && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-24 right-4 z-50 cursor-pointer rounded-full bg-[#2551d9] p-2.5 text-white shadow-lg transition-colors hover:bg-blue-700 sm:bottom-6 sm:right-6"
        >
          <IconArrowUp size={20} />
        </button>
      )}
    </footer>
  );
}
