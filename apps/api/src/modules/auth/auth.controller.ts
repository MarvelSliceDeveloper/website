import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authService, RegisterSchema, LoginSchema } from './auth.service';
import { ZodError } from 'zod';
import { prisma } from '../../utils/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';

export const authController = {
  // POST /api/auth/register — create a new user account
  async register(req: Request, res: Response) {
    try {
      const data = RegisterSchema.parse(req.body);
      const result = await authService.register(data);

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      return res.status(201).json(result);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(400).json({ error: (error as Error).message });
    }
  },

  // POST /api/auth/login — authenticate user and set cookie
  async login(req: Request, res: Response) {
    try {
      const data = LoginSchema.parse(req.body);
      const result = await authService.login(data);

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(401).json({ error: (error as Error).message });
    }
  },

  // POST /api/auth/logout — clear the auth cookie
  async logout(req: Request, res: Response) {
    res.clearCookie('accessToken');
    return res.status(200).json({ message: 'Logged out successfully' });
  },

  // GET /api/auth/me — return the currently authenticated user
  async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, name: true, email: true, role: true } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },

  // GET /api/auth/azure/status — check if Microsoft account is linked
  async azureAdStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { msUserId: true, msAccessToken: true },
      });

      const msClientId = !!process.env.MS_CLIENT_ID;
      const msClientSecret = !!process.env.MS_CLIENT_SECRET;
      const msRedirectUri = !!process.env.MS_REDIRECT_URI;

      const recentLogs = await prisma.graphApiLog.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
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
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },

  // GET /api/auth/azure/login — redirect to Microsoft OAuth consent page
  async azureAdLogin(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      // Ensure only ADMIN can link Microsoft account
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only administrators are allowed to link Microsoft accounts' });
      }

      const clientId = process.env.MS_CLIENT_ID;
      const redirectUri = process.env.MS_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        return res.status(500).json({ error: 'Microsoft Azure AD is not configured on the server' });
      }

      // Securely pass user ID in the state parameter
      const { encryptToken } = await import('../../utils/encryption');
      const state = encryptToken(req.user.userId);

      const scopes = [
        'openid', 'profile', 'email', 'offline_access',
        'Calendars.ReadWrite', 'OnlineMeetings.ReadWrite',
        'User.Read', 'OnlineMeetingRecording.Read.All'
      ].join(' ');

      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;

      return res.redirect(authUrl);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },

  // GET /api/auth/azure/callback — handle Microsoft OAuth redirect and exchange token
  async azureAdCallback(req: Request, res: Response) {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('[AzureOAuth] Microsoft callback error:', error, error_description);
      return res.status(400).json({ error: `Authentication failed: ${error_description || error}` });
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Code or state query parameter is missing' });
    }

    try {
      const { decryptToken, encryptToken } = await import('../../utils/encryption');

      let userId: string;
      try {
        userId = decryptToken(state as string);
      } catch {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied: Only admins are allowed to link Microsoft accounts' });
      }

      const clientId = process.env.MS_CLIENT_ID;
      const clientSecret = process.env.MS_CLIENT_SECRET;
      const redirectUri = process.env.MS_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return res.status(500).json({ error: 'Microsoft OAuth configuration is missing on the server' });
      }

      // Exchange authorization code for tokens
      const tokenUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;
      const scopes = [
        'openid', 'profile', 'email', 'offline_access',
        'Calendars.ReadWrite', 'OnlineMeetings.ReadWrite',
        'User.Read', 'OnlineMeetingRecording.Read.All'
      ].join(' ');

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId, client_secret: clientSecret,
          grant_type: 'authorization_code', code: code as string,
          redirect_uri: redirectUri, scope: scopes,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[AzureOAuth] Token exchange failed:', errText);
        return res.status(response.status).send(`Token exchange failed: ${response.statusText}`);
      }

      const tokenData = (await response.json()) as Record<string, string>;
      if (!tokenData.access_token || !tokenData.refresh_token) {
        return res.status(500).json({ error: 'Invalid token response received' });
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
      const { getMsUserProfile } = await import('../graph/graph.users');
      try {
        const msProfile = await getMsUserProfile(userId);
        if (msProfile?.id) {
          await prisma.user.update({
            where: { id: userId },
            data: { msUserId: msProfile.id },
          });
        }
      } catch (err: unknown) {
        console.error('[AzureOAuth] Failed to retrieve Microsoft user profile:', (err as Error).message);
      }

      const redirectDashboard = `${process.env.WEB_URL || 'http://localhost:3000'}/admin/dashboard`;
      return res.redirect(redirectDashboard);
    } catch (error: unknown) {
      console.error('[AzureOAuth] Fatal callback error:', error);
      return res.status(500).send(`Internal server error during authentication: ${(error as Error).message}`);
    }
  },

  // PATCH /api/auth/me/profile — update current user's name
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).json({ error: 'Name must be between 2 and 100 characters' });
      }

      const updated = await prisma.user.update({
        where: { id: req.user.userId },
        data: { name: name.trim() },
        select: { id: true, name: true, email: true, role: true },
      });

      return res.json({ user: updated });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },

  // PATCH /api/auth/me/password — change current user's password
  async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || typeof currentPassword !== 'string') {
        return res.status(400).json({ error: 'Current password is required' });
      }
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }

      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Check if user has a password set (might be SSO-only)
      if (!user.passwordHash) {
        return res.status(400).json({ error: 'Cannot change password. Account uses SSO authentication.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { passwordHash: hashedPassword },
      });

      return res.json({ message: 'Password changed successfully' });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error as Error).message });
    }
  },
};
