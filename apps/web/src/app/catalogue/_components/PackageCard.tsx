"use client";

import Link from "next/link";
import type { CataloguePackage } from "@/lib/api-types";
import { IconSchool, IconBook, IconBriefcase } from "@tabler/icons-react";

interface PackageCardProps {
  pkg: CataloguePackage;
  bannerSize?: "sm" | "md" | "lg";
}

const bannerHeights = { sm: "h-40", md: "h-44", lg: "h-48" } as const;

export function PackageCard({ pkg, bannerSize = "lg" }: PackageCardProps) {
  const courseCount = pkg.courses?.length || 0;
  const hasPrice = pkg.price != null && pkg.price > 0;
  const isInternship = pkg.isInternship ?? false;
  const firstThumb = pkg.courses?.[0]?.course?.thumbnailUrl || null;
  const bannerH = bannerHeights[bannerSize] || bannerHeights.lg;

  return (
    <Link
      href={`/catalogue/${pkg.slug}`}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col"
    >
      <div className={`${bannerH} bg-gradient-to-br from-indigo-600 to-dark-navy flex items-center justify-center shrink-0 overflow-hidden relative`}>
        <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
          {firstThumb ? (
            <img src={firstThumb} alt={pkg.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white/15 text-4xl sm:text-5xl font-bold">{pkg.name?.charAt(0) || "P"}</span>
          )}
        </div>
        <span
          className={`absolute top-3 left-3 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs ${
            isInternship ? "bg-emerald-600/90" : "bg-purple-600/90"
          }`}
        >
          {isInternship ? "Internship" : "Package"}
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-bold text-dark-navy text-lg group-hover:text-primary transition-colors line-clamp-2">
          {pkg.name}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed mt-2 line-clamp-2 flex-1">
          {pkg.description || "Comprehensive multi-course learning package."}
        </p>

        <div className="flex flex-wrap gap-2 mt-3 mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <IconSchool size={12} />
            {courseCount} {courseCount === 1 ? "course" : "courses"}
          </span>
          {pkg.totalLessons != null && pkg.totalLessons > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              <IconBook size={12} />
              {pkg.totalLessons} lessons
            </span>
          )}
          {isInternship && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <IconBriefcase size={12} />
              Internship
            </span>
          )}
          {hasPrice ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              ₹{(pkg.price! / 100).toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Contact Us
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm mt-auto">
          <span className="text-xs text-muted-foreground">
            {pkg.batches?.length ? `${pkg.batches.length} active batches` : "Certificate included"}
          </span>
          <span className="text-sm font-semibold text-primary">
            {isInternship ? "Apply Now →" : "View Package →"}
          </span>
        </div>
      </div>
    </Link>
  );
}

