"use client";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const bannerHeights = { sm: "h-40", md: "h-44", lg: "h-48" } as const;

export function CourseCard({
  course,
  bannerSize = "lg",
}: {
  course: any;
  bannerSize?: "sm" | "md" | "lg";
}) {
  const qc = useQueryClient();
  const bannerH = bannerHeights[bannerSize] || bannerHeights.lg;
  const handlePrefetch = () => {
    if (course?.slug) {
      qc.prefetchQuery({
        queryKey: ["catalogue", "course", course.slug],
        queryFn: () => api.get(`/api/courses/catalogue/${course.slug}`),
      });
    }
  };
  const img = course.coverImageUrl || course.thumbnailUrl;
  return (
    <Link
      href={`/catalogue/${course.slug}`}
      onMouseEnter={handlePrefetch}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col"
    >
      <div className={`${bannerH} bg-gradient-to-br from-primary to-dark-navy flex items-center justify-center shrink-0 overflow-hidden`}>
        <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
          {img ? (
            <img src={img} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white/15 text-4xl sm:text-5xl font-bold">{course.title?.charAt(0)}</span>
          )}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-bold text-dark-navy text-lg group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mt-2 line-clamp-2 flex-1">{course.description}</p>
        <div className="flex flex-wrap gap-2 mt-3 mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {course.duration || "—"}
          </span>
          {course.categoryRelation?.name && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {course.categoryRelation.name}
            </span>
          )}
          {course.price != null && course.price > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              ₹{(course.price / 100).toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Enquiry</span>
          )}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm mt-auto">
          <span className="text-xs text-muted-foreground">{course._count?.modules ?? 0} modules</span>
          <span className="text-sm font-semibold text-primary">View Course →</span>
        </div>
      </div>
    </Link>
  );
}
