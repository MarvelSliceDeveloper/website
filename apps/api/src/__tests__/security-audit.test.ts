import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { paymentService } from "../modules/payments/payment.service";
import { isCustomDump } from "../modules/admin/backup/backup.service";
import { ALLOWED_ANSWER_EXTENSIONS } from "../modules/assignments/assignment.upload";
import { AppError } from "../utils/errors";

describe("Security Audit & Vulnerability Regressions", () => {
  describe("1. Pre-Auth Account Takeover Prevention (Guest Checkout)", () => {
    it("rejects guest checkout for existing registered email with 409", async () => {
      // admin@lms.local is a seeded user in the database
      await expect(
        paymentService.createGuestUser(
          "Attacker Attempt",
          "admin@lms.local",
          "+1234567890",
        ),
      ).rejects.toThrowError(AppError);

      try {
        await paymentService.createGuestUser(
          "Attacker Attempt",
          "admin@lms.local",
          "+1234567890",
        );
        expect.unreachable("Should have thrown 409");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.statusCode).toBe(409);
        expect(appErr.message).toContain(
          "An account with this email already exists",
        );
      }
    });

    it("rejects guest checkout case-insensitively for existing email", async () => {
      try {
        await paymentService.createGuestUser(
          "Attacker Attempt",
          "ADMIN@LMS.LOCAL",
        );
        expect.unreachable("Should have thrown 409");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(409);
      }
    });
  });

  describe("2. Assignment Upload Stored XSS & Extension Whitelist", () => {
    it("allows only safe file extensions for answer submissions", () => {
      const dangerousExtensions = [
        ".html",
        ".htm",
        ".svg",
        ".exe",
        ".bat",
        ".sh",
        ".php",
        ".js",
        ".jsx",
        ".ts",
      ];
      for (const ext of dangerousExtensions) {
        expect(ALLOWED_ANSWER_EXTENSIONS.has(ext)).toBe(false);
      }

      const safeExtensions = [
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".doc",
        ".docx",
        ".zip",
        ".txt",
      ];
      for (const ext of safeExtensions) {
        expect(ALLOWED_ANSWER_EXTENSIONS.has(ext)).toBe(true);
      }
    });
  });

  describe("3. Backup Restore Format & Magic Byte Detection", () => {
    it("identifies custom pg_dump by original filename .dump", () => {
      expect(
        isCustomDump("/tmp/multer_upload_3a8c17b", "mydb-backup.dump"),
      ).toBe(true);
    });

    it("identifies plain SQL dump by original filename .sql", () => {
      const tempSql = path.join(os.tmpdir(), `test-${Date.now()}.sql`);
      fs.writeFileSync(tempSql, "SELECT 1;\n");
      try {
        expect(isCustomDump(tempSql, "mydb-backup.sql")).toBe(false);
      } finally {
        fs.unlinkSync(tempSql);
      }
    });

    it("identifies custom pg_dump by PGDMP magic bytes even without extension", () => {
      const tempDump = path.join(os.tmpdir(), `test-magic-${Date.now()}`);
      // PGDMP in ascii followed by binary data
      const buf = Buffer.from([0x50, 0x47, 0x44, 0x4d, 0x50, 0x01, 0x00]);
      fs.writeFileSync(tempDump, buf);
      try {
        expect(isCustomDump(tempDump)).toBe(true);
      } finally {
        fs.unlinkSync(tempDump);
      }
    });

    it("returns false for non-PGDMP file without .dump extension", () => {
      const tempTxt = path.join(os.tmpdir(), `test-plain-${Date.now()}`);
      fs.writeFileSync(tempTxt, "Hello world this is not a dump");
      try {
        expect(isCustomDump(tempTxt)).toBe(false);
      } finally {
        fs.unlinkSync(tempTxt);
      }
    });
  });
});
