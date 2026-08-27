import type { Request, Response } from "express";
import { generateSecret, generateURI, verify as verifyOtp } from "otplib";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../utils/prisma";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import { authService } from "./auth.service";
import { parseExpiryToMs } from "./auth.controller";

const ACCESS_TOKEN_MAX_AGE = parseExpiryToMs(process.env.JWT_EXPIRY || "7d");

export const twoFactorController = {
  async setup(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const existing = await prisma.twoFactorAuth.findUnique({
        where: { userId },
      });
      if (existing?.verifiedAt) {
        return res
          .status(400)
          .json({ error: "Two-factor authentication is already enabled" });
      }

      const secret = generateSecret();
      const uri = generateURI({
        label: user.email,
        issuer: "MarvelSlice LMS",
        secret,
      });

      await prisma.twoFactorAuth.upsert({
        where: { userId },
        create: { userId, secret },
        update: { secret },
      });

      return res.json({ secret, uri });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async verify(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { code } = req.body;

      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Verification code is required" });
      }

      const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
        where: { userId },
      });
      if (!twoFactorAuth) {
        return res
          .status(400)
          .json({ error: "2FA not set up. Please call /setup first." });
      }
      if (twoFactorAuth.verifiedAt) {
        return res.status(400).json({ error: "2FA is already verified" });
      }

      const result = await verifyOtp({
        secret: twoFactorAuth.secret,
        token: code,
      });
      if (!result.valid) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      const backupCodes: string[] = [];
      for (let i = 0; i < 5; i++) {
        backupCodes.push(crypto.randomBytes(8).toString("hex").slice(0, 10));
      }

      const hashedBackupCodes = await Promise.all(
        backupCodes.map((c) => bcrypt.hash(c, 10)),
      );

      await prisma.twoFactorAuth.update({
        where: { userId },
        data: {
          verifiedAt: new Date(),
          backupCodes: hashedBackupCodes,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      });

      return res.json({ backupCodes });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async disable(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { password } = req.body;

      if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "Password is required" });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: "User not found" });

      if (!user.passwordHash) {
        return res.status(400).json({
          error: "Cannot disable 2FA. Account uses SSO authentication.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: "Password is incorrect" });
      }

      await prisma.twoFactorAuth.delete({ where: { userId } });
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false },
      });

      return res.json({ message: "Two-factor authentication disabled" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async status(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorEnabled: true },
      });
      const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
        where: { userId },
        select: { verifiedAt: true },
      });

      return res.json({
        enabled: user?.twoFactorEnabled ?? false,
        verifiedAt: twoFactorAuth?.verifiedAt ?? null,
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async challenge(req: Request, res: Response) {
    try {
      const { tempToken, code, rememberMe } = req.body;

      if (!tempToken || typeof tempToken !== "string") {
        return res.status(400).json({ error: "Temporary token is required" });
      }
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Verification code is required" });
      }

      let payload: { userId: string; purpose: string };
      try {
        payload = jwt.verify(tempToken, process.env.JWT_SECRET!, {
          algorithms: ["HS256"],
        }) as { userId: string; purpose: string };
      } catch {
        return res
          .status(401)
          .json({ error: "Invalid or expired temporary token" });
      }

      if (payload.purpose !== "2fa-challenge") {
        return res.status(401).json({ error: "Invalid token purpose" });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
        where: { userId: payload.userId },
      });
      if (!twoFactorAuth || !twoFactorAuth.verifiedAt) {
        return res
          .status(400)
          .json({ error: "2FA is not enabled for this user" });
      }

      const otpResult = await verifyOtp({
        secret: twoFactorAuth.secret,
        token: code,
      });
      let isValid = otpResult.valid;

      if (!isValid && Array.isArray(twoFactorAuth.backupCodes)) {
        const backupCodes = twoFactorAuth.backupCodes as string[];
        for (let i = 0; i < backupCodes.length; i++) {
          const match = await bcrypt.compare(code, backupCodes[i]);
          if (match) {
            isValid = true;
            const updatedCodes = [...backupCodes];
            updatedCodes.splice(i, 1);
            await prisma.twoFactorAuth.update({
              where: { userId: payload.userId },
              data: { backupCodes: updatedCodes },
            });
            break;
          }
        }
      }

      if (!isValid) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      const tokens = await authService.generateTokens({
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        mustChangePassword: user.mustChangePassword,
        onboardingComplete: user.onboardingComplete,
        sessionTimeoutMin: user.sessionTimeoutMin,
      });

      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        ...(rememberMe ? { maxAge: ACCESS_TOKEN_MAX_AGE } : {}),
      });

      return res.json({ token: tokens.accessToken, user: tokens.user });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
