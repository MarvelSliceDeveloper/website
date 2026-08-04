import { describe, it, expect } from "vitest";
import {
  addDays,
  getEffectiveDueDate,
  resolveEffectiveDueDate,
} from "../../services/due-date.service";

describe("addDays", () => {
  it("adds days to a date", () => {
    const result = addDays(new Date("2025-01-01T00:00:00Z"), 7);
    expect(result.toISOString()).toBe("2025-01-08T00:00:00.000Z");
  });

  it("adds 0 days (same date)", () => {
    const result = addDays(new Date("2025-01-01T00:00:00Z"), 0);
    expect(result.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  it("handles negative days", () => {
    const result = addDays(new Date("2025-01-10T00:00:00Z"), -3);
    expect(result.toISOString()).toBe("2025-01-07T00:00:00.000Z");
  });
});

describe("resolveEffectiveDueDate", () => {
  const enrollmentDate = new Date("2025-01-01T00:00:00Z");
  const absoluteDueDate = new Date("2025-06-01T00:00:00Z");

  it("returns enrollmentDate + 0 days when daysFromEnrollment is 0", () => {
    // This is the bug fix: 0 is a valid value meaning "due on enrollment day"
    const result = resolveEffectiveDueDate(
      absoluteDueDate,
      0,
      enrollmentDate,
    );
    expect(result).not.toBeNull();
    expect(result!.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  it("returns enrollmentDate + N days when daysFromEnrollment is positive", () => {
    const result = resolveEffectiveDueDate(
      absoluteDueDate,
      14,
      enrollmentDate,
    );
    expect(result).not.toBeNull();
    expect(result!.toISOString()).toBe("2025-01-15T00:00:00.000Z");
  });

  it("returns absoluteDueDate when daysFromEnrollment is null", () => {
    const result = resolveEffectiveDueDate(
      absoluteDueDate,
      null,
      enrollmentDate,
    );
    expect(result).toBe(absoluteDueDate);
  });

  it("returns absoluteDueDate when daysFromEnrollment is undefined", () => {
    const result = resolveEffectiveDueDate(
      absoluteDueDate,
      undefined,
      enrollmentDate,
    );
    expect(result).toBe(absoluteDueDate);
  });

  it("returns absoluteDueDate when enrollmentDate is null", () => {
    const result = resolveEffectiveDueDate(
      absoluteDueDate,
      14,
      null,
    );
    expect(result).toBe(absoluteDueDate);
  });

  it("returns absoluteDueDate (null) when no enrollment data is available", () => {
    const result = resolveEffectiveDueDate(null, null, null);
    expect(result).toBeNull();
  });

  it("returns extensionDate when provided (priority over everything)", () => {
    const extension = new Date("2025-03-01T00:00:00Z");
    const result = resolveEffectiveDueDate(
      absoluteDueDate,
      0,
      enrollmentDate,
      extension,
    );
    expect(result).toBe(extension);
  });
});

describe("getEffectiveDueDate", () => {
  const enrollmentDate = new Date("2025-01-01T00:00:00Z");
  const absoluteDueDate = new Date("2025-06-01T00:00:00Z");

  it("returns enrollmentDate + 0 days when daysFromEnrollment is 0", () => {
    const result = getEffectiveDueDate(
      enrollmentDate,
      0,
      absoluteDueDate,
    );
    expect(result.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  it("returns enrollmentDate + N days when daysFromEnrollment is positive", () => {
    const result = getEffectiveDueDate(
      enrollmentDate,
      14,
      absoluteDueDate,
    );
    expect(result.toISOString()).toBe("2025-01-15T00:00:00.000Z");
  });

  it("returns absoluteDueDate when daysFromEnrollment is null", () => {
    const result = getEffectiveDueDate(
      enrollmentDate,
      null,
      absoluteDueDate,
    );
    expect(result).toBe(absoluteDueDate);
  });

  it("returns absoluteDueDate when enrollmentDate is null", () => {
    const result = getEffectiveDueDate(
      null,
      14,
      absoluteDueDate,
    );
    expect(result).toBe(absoluteDueDate);
  });

  it("returns extensionDate when provided", () => {
    const extension = new Date("2025-03-01T00:00:00Z");
    const result = getEffectiveDueDate(
      enrollmentDate,
      0,
      absoluteDueDate,
      extension,
    );
    expect(result).toBe(extension);
  });
});
