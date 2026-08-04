import { describe, it, expect } from "vitest";
import {
  CreateBatchSchema,
  UpdateBatchSchema,
} from "../../modules/batches/batch.service";

describe("CreateBatchSchema", () => {
  const valid = {
    courseId: "course-123",
    instructorId: "inst-123",
    name: "React Batch 2024",
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-06-30T23:59:59.000Z",
  };

  it("accepts valid batch data with courseId", () => {
    expect(CreateBatchSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts valid batch data with packageId", () => {
    expect(
      CreateBatchSchema.safeParse({
        ...valid,
        courseId: undefined,
        packageId: "pkg-123",
      }).success,
    ).toBe(true);
  });

  it("rejects when neither courseId nor packageId provided", () => {
    const result = CreateBatchSchema.safeParse({
      ...valid,
      courseId: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty instructorId", () => {
    expect(
      CreateBatchSchema.safeParse({ ...valid, instructorId: "" }).success,
    ).toBe(false);
  });

  it("rejects name shorter than 3 chars", () => {
    expect(CreateBatchSchema.safeParse({ ...valid, name: "AB" }).success).toBe(
      false,
    );
  });

  it("rejects invalid startDate", () => {
    expect(
      CreateBatchSchema.safeParse({
        ...valid,
        startDate: "not-a-date",
      }).success,
    ).toBe(false);
  });

  it("accepts optional maxStudents", () => {
    expect(
      CreateBatchSchema.safeParse({ ...valid, maxStudents: 30 }).success,
    ).toBe(true);
  });

  it("rejects non-integer maxStudents", () => {
    expect(
      CreateBatchSchema.safeParse({ ...valid, maxStudents: 1.5 }).success,
    ).toBe(false);
  });
});

describe("UpdateBatchSchema", () => {
  it("accepts partial updates", () => {
    expect(UpdateBatchSchema.safeParse({ name: "New Name" }).success).toBe(
      true,
    );
  });

  it("accepts empty update", () => {
    expect(UpdateBatchSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid status enum", () => {
    expect(UpdateBatchSchema.safeParse({ status: "ACTIVE" }).success).toBe(
      true,
    );
    expect(UpdateBatchSchema.safeParse({ status: "COMPLETED" }).success).toBe(
      true,
    );
  });

  it("rejects invalid status", () => {
    expect(UpdateBatchSchema.safeParse({ status: "INVALID" }).success).toBe(
      false,
    );
  });

  it("accepts nullable maxStudents", () => {
    expect(UpdateBatchSchema.safeParse({ maxStudents: null }).success).toBe(
      true,
    );
  });
});
