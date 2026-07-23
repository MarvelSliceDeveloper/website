import { describe, it, expect } from "vitest";
import { generateSlug } from "../../modules/courses/course.service";

describe("generateSlug", () => {
  it("lowercases the title", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(generateSlug("one two three")).toBe("one-two-three");
  });

  it("removes special characters", () => {
    expect(generateSlug("React & Node.js!")).toBe("react-nodejs");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("a   b")).toBe("a-b");
  });

  it("trims leading and trailing hyphens", () => {
    expect(generateSlug(" hello world ")).toBe("hello-world");
  });

  it("handles underscores as spaces", () => {
    expect(generateSlug("hello_world")).toBe("hello-world");
  });

  it("handles single word", () => {
    expect(generateSlug("Python")).toBe("python");
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });

  it("handles complex title with mixed characters", () => {
    expect(generateSlug("C++ for Beginners! (2024 Edition)")).toBe(
      "c-for-beginners-2024-edition",
    );
  });
});
