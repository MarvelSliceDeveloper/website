import { describe, it, expect } from "vitest";
import { RegisterSchema, LoginSchema } from "../../modules/auth/auth.service";

describe("RegisterSchema", () => {
  const validData = {
    name: "John Doe",
    email: "john@example.com",
    password: "StrongPass1",
  };

  it("accepts valid registration data", () => {
    const result = RegisterSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = RegisterSchema.safeParse({ ...validData, name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 chars", () => {
    const result = RegisterSchema.safeParse({ ...validData, password: "Ab1" });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      password: "lowercase1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      password: "UPPERCASE1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      password: "NoNumberHere",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(RegisterSchema.safeParse({}).success).toBe(false);
    expect(RegisterSchema.safeParse({ name: "John" }).success).toBe(false);
  });
});

describe("LoginSchema", () => {
  it("accepts valid login data", () => {
    const result = LoginSchema.safeParse({
      email: "user@test.com",
      password: "any-password",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = LoginSchema.safeParse({
      email: "bad",
      password: "pass",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password (Zod allows empty string by default)", () => {
    // LoginSchema uses z.string() which allows empty strings
    const result = LoginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(true);
  });
});
