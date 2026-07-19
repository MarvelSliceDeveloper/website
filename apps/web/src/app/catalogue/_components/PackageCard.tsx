"use client";

import type { CataloguePackage } from "@/lib/api-types";

interface PackageCardProps {
  pkg: CataloguePackage;
  onBuyNow: (pkg: CataloguePackage) => void;
}

export function PackageCard({ pkg, onBuyNow }: PackageCardProps) {
  const courseCount = pkg.courses?.length || 0;
  const batchCount = pkg.batches?.length || 0;
  const hasPrice = pkg.price != null && pkg.price > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col transition-colors hover:border-border-hover hover:bg-card-hover">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
        </div>

        {pkg.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {pkg.description}
          </p>
        )}

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>
              {courseCount} {courseCount === 1 ? "course" : "courses"}
            </span>
          </div>

          {batchCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>
                {batchCount} {batchCount === 1 ? "batch" : "batches"} available
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          {hasPrice ? (
            <span className="text-2xl font-bold text-foreground">
              ₹{(pkg.price! / 100).toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="text-sm text-muted">Contact for pricing</span>
          )}
        </div>

        <button
          onClick={() => onBuyNow(pkg)}
          className="px-5 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
          disabled={!hasPrice}
        >
          {hasPrice ? "Buy Now" : "Contact Us"}
        </button>
      </div>
    </div>
  );
}
