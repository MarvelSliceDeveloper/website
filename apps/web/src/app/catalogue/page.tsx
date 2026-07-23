import type { Metadata } from "next";
import { CataloguePageClient } from "./_components/CataloguePageClient";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Catalogue",
};

const API_URL = process.env.API_URL || "http://localhost:4000";

async function getPackages() {
  try {
    const res = await fetch(`${API_URL}/api/packages/public`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.packages || [];
  } catch {
    return [];
  }
}

export default async function CataloguePage() {
  const packages = await getPackages();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Course Packages
            </h1>
            <p className="mt-2 text-muted-foreground text-lg">
              Choose a package and start your learning journey today.
            </p>
          </div>

          <CataloguePageClient packages={packages} />
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
