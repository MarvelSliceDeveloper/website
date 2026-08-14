"use client";

import { useRouter } from "next/navigation";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import {
  IconFileDescription,
  IconRefresh,
  IconPlus,
} from "@tabler/icons-react";

type QuizOption = { id: string; optionText: string; isCorrect: boolean };
type QuizQuestion = {
  id: string;
  text: string;
  marks: number;
  orderIndex: number;
  options: QuizOption[];
};
type QuizTemplate = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  questions: QuizQuestion[];
  createdAt: string;
};

export default function QuizTemplatesPage() {
  usePageTitle("Quiz Templates");
  const router = useRouter();

  const templatesQuery = useApiQuery<{ templates: QuizTemplate[] }>(
    ["admin", "quiz-templates"],
    "/api/admin/quiz-templates",
  );
  const templates = templatesQuery.data?.templates ?? [];
  const loading = templatesQuery.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Library
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconFileDescription size={28} className="text-primary-hover" />
            Quiz Templates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Predefined quiz templates. Attach to courses during creation.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/quiz-templates/new")}
          className="btn-primary text-xs py-2 flex items-center gap-1.5"
        >
          <IconPlus size={14} /> Add Template
        </button>
      </div>

      <button
        onClick={() => void templatesQuery.refetch()}
        className="btn-secondary text-xs py-2 flex items-center gap-1.5"
      >
        <IconRefresh size={14} /> Refresh
      </button>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          No quiz templates yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/admin/quiz-templates/${t.id}`)}
              className="glass-card p-5 border border-border/80 cursor-pointer hover:border-primary/30 transition-colors"
            >
              <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {t.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted">
                <span>{t.questions.length} questions</span>
                {t.category && (
                  <>
                    <span>·</span>
                    <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {t.category}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
