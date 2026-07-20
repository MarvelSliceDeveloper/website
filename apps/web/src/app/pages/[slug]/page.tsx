"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import PublicFooter from "@/components/PublicFooter";
import BrandLogo from "@/components/BrandLogo";

interface StaticPage {
  title: string;
  slug: string;
  content: string;
}

export default function StaticPageViewer() {
  const params = useParams();
  const slug = params?.slug as string;
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    let active = true;
    api
      .get<{ page: StaticPage }>(`/api/pages/by-slug/${slug}`)
      .then((res) => {
        if (active && res?.page) setPage(res.page);
        else if (active) setError("Page not found");
      })
      .catch(() => {
        if (active) setError("Page not found");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or isn&apos;t published.
          </p>
          <Link
            href="/"
            className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go Home
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <BrandLogo size="sm" />
          <nav className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link
              href="/catalogue"
              className="transition-colors hover:text-foreground"
            >
              Catalogue
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="mb-8 text-3xl font-bold text-foreground">
            {page.title}
          </h1>
          <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}
