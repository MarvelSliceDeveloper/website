import { describe, it, expect } from "vitest";
import {
  CreateCourseSchema,
  UpdateCourseSchema,
} from "../../modules/courses/course.service";
import {
  CreateQuizSchema,
  UpdateQuizSchema,
} from "../../modules/courses/quiz.service";

describe("CreateCourseSchema", () => {
  const valid = {
    title: "Introduction to React",
    description: "A comprehensive guide to building modern web apps with React",
  };

  it("accepts valid course data", () => {
    expect(CreateCourseSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = CreateCourseSchema.safeParse({
      ...valid,
      category: "Web Development",
      tags: ["react", "javascript"],
      learningObjectives: ["Learn components", "Learn hooks"],
      thumbnailUrl: "https://example.com/thumb.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects title shorter than 3 chars", () => {
    expect(
      CreateCourseSchema.safeParse({ ...valid, title: "Re" }).success,
    ).toBe(false);
  });

  it("rejects description shorter than 10 chars", () => {
    expect(
      CreateCourseSchema.safeParse({ ...valid, description: "Short" }).success,
    ).toBe(false);
  });

  it("rejects invalid thumbnailUrl", () => {
    expect(
      CreateCourseSchema.safeParse({
        ...valid,
        thumbnailUrl: "not-a-url",
      }).success,
    ).toBe(false);
  });
});

describe("UpdateCourseSchema", () => {
  it("accepts partial updates", () => {
    expect(UpdateCourseSchema.safeParse({ title: "New Title" }).success).toBe(
      true,
    );
  });

  it("accepts empty object (no fields to update)", () => {
    expect(UpdateCourseSchema.safeParse({}).success).toBe(true);
  });

  it("accepts nullable fields", () => {
    expect(
      UpdateCourseSchema.safeParse({
        category: null,
        thumbnailUrl: null,
      }).success,
    ).toBe(true);
  });
});

describe("CreateQuizSchema", () => {
  const valid = {
    title: "Module 1 Quiz",
    questions: [
      {
        text: "What is React?",
        options: [
          { label: "A library", isCorrect: true },
          { label: "A framework", isCorrect: false },
        ],
      },
    ],
  };

  it("accepts valid quiz data", () => {
    expect(CreateQuizSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects title shorter than 2 chars", () => {
    expect(CreateQuizSchema.safeParse({ ...valid, title: "Q" }).success).toBe(
      false,
    );
  });

  it("rejects empty questions array", () => {
    expect(
      CreateQuizSchema.safeParse({ ...valid, questions: [] }).success,
    ).toBe(false);
  });

  it("rejects question with fewer than 2 options", () => {
    expect(
      CreateQuizSchema.safeParse({
        ...valid,
        questions: [
          {
            text: "Q1",
            options: [{ label: "Only one", isCorrect: true }],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects question with empty text", () => {
    expect(
      CreateQuizSchema.safeParse({
        ...valid,
        questions: [
          {
            text: "",
            options: [
              { label: "A", isCorrect: true },
              { label: "B", isCorrect: false },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("UpdateQuizSchema", () => {
  it("accepts partial update (title only)", () => {
    expect(UpdateQuizSchema.safeParse({ title: "Updated Title" }).success).toBe(
      true,
    );
  });

  it("accepts empty update", () => {
    expect(UpdateQuizSchema.safeParse({}).success).toBe(true);
  });

  it("accepts nullable dueDate", () => {
    expect(UpdateQuizSchema.safeParse({ dueDate: null }).success).toBe(true);
  });
});
