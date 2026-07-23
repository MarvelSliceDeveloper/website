/**
 * AES-256-GCM encryption/decryption utilities for sensitive tokens.
 *
 * Uses random salt (64 bytes) + random IV (16 bytes) per encryption call,
 * so the same plaintext produces different ciphertext each time.
 * Format: salt:iv:authTag:encryptedData (all hex-encoded except authTag).
 *
 * Requires TOKEN_ENCRYPTION_KEY env var (minimum 32 characters).
 */
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derives an AES-256 key from the environment secret using scrypt.
 *
 * @param salt - Random salt bytes for key derivation
 * @returns 32-byte derived key
 * @throws Error if TOKEN_ENCRYPTION_KEY is missing or too short
 */
function getKey(salt: Buffer): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be at least 32 characters long");
  }
  return crypto.scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param text - The plaintext to encrypt
 * @returns Colon-separated string: salt:iv:authTag:encryptedData
 */
export function encryptToken(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  // Format: salt:iv:authTag:encryptedData
  return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string back to plaintext.
 *
 * @param encryptedData - The colon-separated encrypted string from encryptToken()
 * @returns The original plaintext
 * @throws Error if format is invalid or decryption fails (tampered data, wrong key)
 */
export function decryptToken(encryptedData: string): string {
  const parts = encryptedData.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted data format");
  }

  const salt = Buffer.from(parts[0], "hex");
  const iv = Buffer.from(parts[1], "hex");
  const authTag = Buffer.from(parts[2], "hex");
  const encryptedText = parts[3];

  const key = getKey(salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
