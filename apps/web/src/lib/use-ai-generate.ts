"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type AIGenerationType =
  | "COURSE_OUTLINE"
  | "COURSE_TITLE"
  | "MODULES"
  | "QUIZ"
  | "ASSIGNMENT"
  | "LESSON_DESCRIPTION"
  | "NOTIFICATION";

export type AIModuleContext = {
  title: string;
  description?: string;
};

export interface AIContext {
  courseTitle?: string;
  courseDescription?: string;
  moduleTitle?: string;
  moduleDescription?: string;
  lessonTitle?: string;
  modules?: AIModuleContext[];
  difficulty?: string;
  questionCount?: number;
}

interface AIGenerateResponse<T> {
  type: string;
  data: T;
  model: string;
}

export function useAIGenerate<T>() {
  return useMutation({
    mutationFn: ({
      type,
      prompt,
      context,
    }: {
      type: AIGenerationType;
      prompt: string;
      context?: AIContext;
    }) =>
      api.post<AIGenerateResponse<T>>("/api/admin/ai/generate", {
        type,
        prompt,
        ...(context ? { context } : {}),
      }),
  });
}
