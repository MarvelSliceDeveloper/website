import Link from "next/link";
import { PackageDetailClient } from "./_components/PackageDetailClient";
import type { PackageDetail } from "@/lib/api-types";

function courseToPackageDetail(course: any): PackageDetail {
  const modules = course.modules || [];
  let totalLessons = 0;
  let totalQuizzes = 0;
  let totalAssignments = 0;
  let totalPracticals = 0;
  for (const m of modules) {
    totalLessons += m.lessons?.length ?? 0;
    totalQuizzes += m.quizzes?.length ?? 0;
    totalAssignments += m.assignments?.length ?? 0;
    totalPracticals += m.practicals?.length ?? 0;
  }
  return {
    id: course.id,
    name: course.title,
    slug: course.slug,
    description: course.description ?? null,
    price: course.price ?? null,
    status: course.status ?? "PUBLISHED",
    createdAt: course.createdAt ?? new Date().toISOString(),
    updatedAt: course.updatedAt ?? new Date().toISOString(),
    isInternship: false,
    courses: [
      {
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description ?? null,
          thumbnailUrl: course.thumbnailUrl ?? null,
          learningObjectives: course.learningObjectives ?? null,
          modules: modules.map((m: any) => ({
            id: m.id,
            title: m.title,
            order: m.order ?? 0,
          })),
        },
      },
    ],
    batches: [],
    _count: { enrollments: 0 },
    totalLessons,
    totalQuizzes,
    totalAssignments,
    totalPracticals,
    // marker to indicate this package is derived from a single course
    // used by PackageDetailClient to switch checkout to course flow
    _derivedCourseId: course.id,
  } as PackageDetail & { _derivedCourseId?: string };
}

async function getPackage(slug: string): Promise<PackageDetail | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
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

async function getCatalogueCourse(slug: string): Promise<any | null> {
  try {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const res = await fetch(`${apiUrl}/api/courses/catalogue/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.course ?? null;
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
  const course = await getCatalogueCourse(slug);
  if (course) {
    const derived = courseToPackageDetail(course);
    return <PackageDetailClient pkg={derived} />;
  }
  const pkg = await getPackage(slug);

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Not found
          </h1>
          <p className="text-muted-foreground mb-4">
            The course or package you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/catalogue" className="text-sm text-primary hover:underline">
            &larr; Back to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  return <PackageDetailClient pkg={pkg} />;
}
