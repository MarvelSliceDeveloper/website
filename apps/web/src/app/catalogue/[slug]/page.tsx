import Link from "next/link";
import SinglePaymentPage from "./_components/SinglePaymentPage";
import type { PackageDetail } from "@/lib/api-types";

function resolveApiBase(): string {
  // API_URL in production includes the "/api" suffix
  // (see .env.production.example), while NEXT_PUBLIC_API_URL does not.
  // Normalize so callers can safely append "/api/..." without doubling it.
  const raw =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  return raw.replace(/\/api\/?$/, "").replace(/\/+$/, "");
}

async function getPackage(slug: string): Promise<PackageDetail | null> {
  try {
    const apiUrl = resolveApiBase();
    const res = await fetch(`${apiUrl}/api/packages/public/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.package ?? null;
  } catch {
    return null;
  }
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pkg = await getPackage(slug);

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Not found
          </h1>
          <p className="text-muted-foreground mb-4">
            The package you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/catalogue" className="text-sm text-primary hover:underline">
            &larr; Back to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  return <SinglePaymentPage pkg={pkg} />;
}
