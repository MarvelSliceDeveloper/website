"use client";

import type { CataloguePackage } from "@/lib/api-types";
import { PackageCard } from "./PackageCard";

interface CataloguePageClientProps {
  packages: CataloguePackage[];
}

export function CataloguePageClient({ packages }: CataloguePageClientProps) {
  if (!packages || packages.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">
          No packages available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} />
      ))}
    </div>
  );
}
