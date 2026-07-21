import { describe, it, expect, beforeAll } from "vitest";
import { encryptToken, decryptToken } from "../../utils/encryption";

// Set the encryption key before tests run
beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = "test-key-that-is-at-least-32-chars!!";
});

describe("encryptToken / decryptToken", () => {
  it("roundtrips a simple string", () => {
    const original = "hello-world-token-123";
    const encrypted = encryptToken(original);
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(original);
  });

  it("roundtrips an empty string", () => {
    const original = "";
    const encrypted = encryptToken(original);
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(original);
  });

  it("roundtrips a long JWT-like string", () => {
    const original = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjM0NSJ9.signature";
    const encrypted = encryptToken(original);
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext for the same input (random salt + IV)", () => {
    const original = "same-input";
    const enc1 = encryptToken(original);
    const enc2 = encryptToken(original);
    // Encrypted outputs should differ due to random salt/IV
    expect(enc1).not.toBe(enc2);
    // But both should decrypt to the same value
    expect(decryptToken(enc1)).toBe(original);
    expect(decryptToken(enc2)).toBe(original);
  });

  it("produces 4-part colon-separated format", () => {
    const encrypted = encryptToken("test");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(4);
  });

  it("throws on invalid format (wrong number of parts)", () => {
    expect(() => decryptToken("invalid")).toThrow(
      "Invalid encrypted data format",
    );
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encryptToken("test");
    const parts = encrypted.split(":");
    // Tamper with the encrypted data portion
    parts[3] = "0000" + parts[3].slice(4);
    const tampered = parts.join(":");
    expect(() => decryptToken(tampered)).toThrow();
  });

  it("throws when TOKEN_ENCRYPTION_KEY is too short", () => {
    const originalEnv = process.env.TOKEN_ENCRYPTION_KEY;
    process.env.TOKEN_ENCRYPTION_KEY = "short";
    expect(() => encryptToken("test")).toThrow(
      "TOKEN_ENCRYPTION_KEY must be at least 32 characters long",
    );
    process.env.TOKEN_ENCRYPTION_KEY = originalEnv;
  });
});
