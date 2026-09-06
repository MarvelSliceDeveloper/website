"use client";

import Link from "next/link";
import {
  IconClock,
  IconBook,
  IconSchool,
  IconArrowRight,
  IconCertificate,
  IconBriefcase,
} from "@tabler/icons-react";

export interface UnifiedCatalogueItem {
  id: string;
  type: "course" | "package";
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  coverImageUrl?: string | null;
  duration?: string | null;
  category?: string | null;
  price: number | null;
  modulesCount?: number;
  courseCount?: number;
  lessonsCount?: number;
  quizzesCount?: number;
  isInternship?: boolean;
  batchesCount?: number;
}

interface CatalogueListItemProps {
  item: UnifiedCatalogueItem;
}

export function CatalogueListItem({ item }: CatalogueListItemProps) {
  const isPackage = item.type === "package";
  const isInternship = item.isInternship ?? false;
  const img = item.coverImageUrl || item.thumbnailUrl;
  const hasPrice = item.price != null && item.price > 0;

  return (
    <Link
      href={`/catalogue/${item.slug}`}
      className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-primary/40 hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-200"
    >
      {/* Thumbnail Banner */}
      <div className="w-full sm:w-44 h-32 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-[#0f172a] flex items-center justify-center relative">
        {img ? (
          <img
            src={img}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-white/20 text-3xl sm:text-4xl font-extrabold">
            {item.title?.charAt(0) || "M"}
          </span>
        )}

        {/* Badge Overlay on Image */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isPackage ? (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white shadow-xs ${
                isInternship ? "bg-emerald-600" : "bg-purple-600"
              }`}
            >
              {isInternship ? "Internship" : "Package"}
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
              Course
            </span>
          )}
        </div>
      </div>

      {/* Main Details */}
      <div className="flex-1 min-w-0">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {item.category && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {item.category}
            </span>
          )}
          {isInternship && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <IconBriefcase size={12} />
              Internship Program
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-primary transition-colors line-clamp-1">
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
          {item.duration && (
            <span className="inline-flex items-center gap-1">
              <IconClock size={14} className="text-slate-400" />
              {item.duration}
            </span>
          )}
          {!isPackage && item.modulesCount != null && item.modulesCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <IconBook size={14} className="text-slate-400" />
              {item.modulesCount} {item.modulesCount === 1 ? "module" : "modules"}
            </span>
          )}
          {isPackage && item.courseCount != null && (
            <span className="inline-flex items-center gap-1">
              <IconSchool size={14} className="text-slate-400" />
              {item.courseCount} {item.courseCount === 1 ? "course" : "courses"}
            </span>
          )}
          {isPackage && item.lessonsCount != null && item.lessonsCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <IconBook size={14} className="text-slate-400" />
              {item.lessonsCount} lessons
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-slate-400">
            <IconCertificate size={14} />
            Certificate included
          </span>
        </div>
      </div>

      {/* Price & CTA */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0 gap-2 sm:min-w-[140px]">
        <div>
          {hasPrice ? (
            <span className="text-xl font-extrabold text-emerald-600">
              ₹{(item.price! / 100).toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {isInternship ? "Apply Now" : "Enquiry"}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
          {isPackage ? (isInternship ? "Apply Now" : "View Package") : "View Course"}
          <IconArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}
