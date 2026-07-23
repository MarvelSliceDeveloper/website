/**
 * Auth controller — handles registration, login, password management,
 * forgot/reset password flow, and OAuth callback (Microsoft Teams).
 *
 * All endpoints use Zod schema validation for request bodies.
 * Tokens are set as httpOnly cookies for XSS protection.
 */
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authService, RegisterSchema, LoginSchema } from "./auth.service";
import { prisma } from "../../utils/prisma";
import { handleControllerError } from "../../utils/errors";
import { AuthRequest } from "../../middleware/auth.middleware";
import { emailService } from "../../services/email.service";

/**
 * Parses a JWT expiry string (e.g. "7d", "15m", "1h") into milliseconds.
 *
 * @param expiry - Expiry string with unit suffix (d=days, h=hours, m=minutes)
 * @returns Duration in milliseconds, defaults to 7 days for invalid input
 */
export function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhm])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case "d":
      return num * 24 * 60 * 60 * 1000;
    case "h":
      return num * 60 * 60 * 1000;
    case "m":
      return num * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

const ACCESS_TOKEN_MAX_AGE = parseExpiryToMs(process.env.JWT_EXPIRY || "7d");

export const authController = {
  // POST /api/auth/register — create a new user account
  async register(req: Request, res: Response) {
    try {
      const data = RegisterSchema.parse(req.body);
      const result = await authService.register(data);

      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      return res.status(201).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // POST /api/auth/login — authenticate user and set cookie
  async login(req: Request, res: Response) {
    try {
      const data = LoginSchema.parse(req.body);
      const result = await authService.login(data);

      // Log successful login
      prisma.loginLog
        .create({
          data: {
            userId: result.user.userId,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            deviceInfo: (req.headers["sec-ch-ua-platform"] as string) || null,
          },
        })
        .catch((err) => console.error("[auth] Failed to log login:", err));

      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      return res.status(200).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // POST /api/auth/logout — clear the auth cookie
  async logout(req: Request, res: Response) {
    res.clearCookie("accessToken");
    return res.status(200).json({ message: "Logged out successfully" });
  },

  // GET /api/auth/me — return the currently authenticated user
  async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          mustChangePassword: true,
          onboardingComplete: true,
        },
      });
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ user });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/auth/azure/status — check if Microsoft account is linked
  async azureAdStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { msUserId: true, msAccessToken: true },
      });

      const msClientId = !!process.env.MS_CLIENT_ID;
      const msClientSecret = !!process.env.MS_CLIENT_SECRET;
      const msRedirectUri = !!process.env.MS_REDIRECT_URI;

      const recentLogs = await prisma.graphApiLog.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      return res.json({
        linked: !!(user?.msUserId && user?.msAccessToken),
        msUserId: user?.msUserId || null,
        envConfigured: msClientId && msClientSecret && msRedirectUri,
        env: {
          MS_CLIENT_ID: msClientId,
          MS_CLIENT_SECRET: msClientSecret,
          MS_REDIRECT_URI: msRedirectUri,
        },
        logs: recentLogs,
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/auth/azure/login — redirect to Microsoft OAuth consent page
  async azureAdLogin(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      // Ensure only ADMIN can link Microsoft account
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      if (!user || user.role !== "SUPER_ADMIN") {
        return res.status(403).json({
          error: "Only Super Admin is allowed to link Microsoft accounts",
        });
      }

      const clientId = process.env.MS_CLIENT_ID;
      const redirectUri = process.env.MS_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        return res.status(500).json({
          error: "Microsoft Azure AD is not configured on the server",
        });
      }

      // Securely pass user ID in the state parameter
      const { encryptToken } = await import("../../utils/encryption");
      const state = encryptToken(req.user.userId);

      const scopes = [
        "openid",
        "profile",
        "email",
        "offline_access",
        "Calendars.ReadWrite",
        "OnlineMeetings.ReadWrite",
        "User.Read",
        "OnlineMeetingRecording.Read.All",
      ].join(" ");

      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;

      return res.redirect(authUrl);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/auth/azure/callback — handle Microsoft OAuth redirect and exchange token
  async azureAdCallback(req: Request, res: Response) {
    const { code, state, error, error_description } = req.query;

    if (error) {
      (req as any).log?.error?.(
        "[AzureOAuth] Microsoft callback error: %s %s",
        error,
        error_description,
      );
      return res.status(400).json({
        error: `Authentication failed: ${error_description || error}`,
      });
    }

    if (!code || !state) {
      return res
        .status(400)
        .json({ error: "Code or state query parameter is missing" });
    }

    try {
      const { decryptToken, encryptToken } =
        await import("../../utils/encryption");

      let userId: string;
      try {
        userId = decryptToken(state as string);
      } catch {
        return res.status(400).json({ error: "Invalid state parameter" });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.role !== "SUPER_ADMIN") {
        return res.status(403).json({
          error:
            "Access denied: Only Super Admin is allowed to link Microsoft accounts",
        });
      }

      const clientId = process.env.MS_CLIENT_ID;
      const clientSecret = process.env.MS_CLIENT_SECRET;
      const redirectUri = process.env.MS_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return res.status(500).json({
          error: "Microsoft OAuth configuration is missing on the server",
        });
      }

      // Exchange authorization code for tokens
      const tokenUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;
      const scopes = [
        "openid",
        "profile",
        "email",
        "offline_access",
        "Calendars.ReadWrite",
        "OnlineMeetings.ReadWrite",
        "User.Read",
        "OnlineMeetingRecording.Read.All",
      ].join(" ");

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: redirectUri,
          scope: scopes,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        (req as any).log?.error?.("[AzureOAuth] Token exchange failed: %s", errText);
        return res
          .status(response.status)
          .send(`Token exchange failed: ${response.statusText}`);
      }

      const tokenData = (await response.json()) as Record<string, string>;
      if (!tokenData.access_token || !tokenData.refresh_token) {
        return res
          .status(500)
          .json({ error: "Invalid token response received" });
      }

      // Update access & refresh tokens on user
      await prisma.user.update({
        where: { id: userId },
        data: {
          msAccessToken: encryptToken(tokenData.access_token),
          msRefreshToken: encryptToken(tokenData.refresh_token),
        },
      });

      // Query Microsoft Graph /me to resolve the msUserId
      const { getMsUserProfile } = await import("../graph/graph.users");
      try {
        const msProfile = await getMsUserProfile(userId);
        if (msProfile?.id) {
          await prisma.user.update({
            where: { id: userId },
            data: { msUserId: msProfile.id },
          });
        }
      } catch (err: unknown) {
        (req as any).log?.error?.(
          "[AzureOAuth] Failed to retrieve Microsoft user profile: %s",
          (err as Error).message,
        );
      }

      // Log consent
      prisma.consentLog
        .create({
          data: {
            userId,
            type: "MICROSOFT",
            action: "GRANTED",
            details: { scope: scopes },
          },
        })
        .catch((err) => console.error("[auth] Failed to log consent:", err));

      const redirectDashboard = `${process.env.WEB_URL || "http://localhost:3000"}/admin/dashboard`;
      return res.redirect(redirectDashboard);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // PATCH /api/auth/me/profile — update current user's name
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { name } = req.body;
      if (
        !name ||
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 100
      ) {
        return res
          .status(400)
          .json({ error: "Name must be between 2 and 100 characters" });
      }

      const updated = await prisma.user.update({
        where: { id: req.user.userId },
        data: { name: name.trim() },
        select: { id: true, name: true, email: true, role: true },
      });

      return res.json({ user: updated });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // PATCH /api/auth/me/password — change current user's password
  async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || typeof currentPassword !== "string") {
        return res.status(400).json({ error: "Current password is required" });
      }
      if (
        !newPassword ||
        typeof newPassword !== "string" ||
        newPassword.length < 8
      ) {
        return res
          .status(400)
          .json({ error: "New password must be at least 8 characters" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      // Check if user has a password set (might be SSO-only)
      if (!user.passwordHash) {
        return res.status(400).json({
          error: "Cannot change password. Account uses SSO authentication.",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { passwordHash: hashedPassword, mustChangePassword: false },
      });

      const tokens = authService.generateTokens({
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        mustChangePassword: false,
        sessionTimeoutMin: user.sessionTimeoutMin,
      });

      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      return res.json({
        message: "Password changed successfully",
        user: tokens.user,
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // POST /api/auth/me/set-password — set initial password (mustChangePassword flow)
  async setPassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { newPassword } = req.body;

      if (
        !newPassword ||
        typeof newPassword !== "string" ||
        newPassword.length < 8
      ) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }
      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({
          error: "Password must contain at least one uppercase letter",
        });
      }
      if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({
          error: "Password must contain at least one lowercase letter",
        });
      }
      if (!/\d/.test(newPassword)) {
        return res
          .status(400)
          .json({ error: "Password must contain at least one number" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      if (!user.mustChangePassword) {
        return res.status(400).json({
          error: "Password already set. Use the settings page to change it.",
        });
      }

      if (!user.passwordHash) {
        return res.status(400).json({
          error: "Cannot set password. Account uses SSO authentication.",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { passwordHash: hashedPassword, mustChangePassword: false },
      });

      const tokens = authService.generateTokens({
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        mustChangePassword: false,
        sessionTimeoutMin: user.sessionTimeoutMin,
      });

      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      return res.json({
        message: "Password set successfully",
        user: tokens.user,
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // POST /api/auth/forgot-password — send reset link by email
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      // Always return success to avoid email enumeration
      if (!user || !user.passwordHash) {
        return res.json({
          message: "If the account exists, a reset link has been sent.",
        });
      }

      const resetToken = jwt.sign(
        { userId: user.id, purpose: "password-reset" },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" },
      );

      const resetLink = `${process.env.WEB_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

      emailService
        .sendResetPasswordEmail({
          name: user.name,
          email: user.email,
          resetLink,
        })
        .catch((err) =>
          console.error("[auth] Failed to send reset email:", err),
        );

      return res.json({
        message: "If the account exists, a reset link has been sent.",
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // POST /api/auth/reset-password — reset password with token
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Reset token is required" });
      }
      if (
        !newPassword ||
        typeof newPassword !== "string" ||
        newPassword.length < 8
      ) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }
      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({
          error: "Password must contain at least one uppercase letter",
        });
      }
      if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({
          error: "Password must contain at least one lowercase letter",
        });
      }
      if (!/\d/.test(newPassword)) {
        return res
          .status(400)
          .json({ error: "Password must contain at least one number" });
      }

      let payload: { userId: string; purpose: string };
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
          purpose: string;
        };
        if (payload.purpose !== "password-reset") {
          return res.status(400).json({ error: "Invalid reset token" });
        }
      } catch {
        return res
          .status(400)
          .json({ error: "Reset token is invalid or has expired" });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user || !user.passwordHash) {
        return res.status(400).json({ error: "User not found" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword, mustChangePassword: false },
      });

      return res.json({
        message: "Password reset successfully. You can now log in.",
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
