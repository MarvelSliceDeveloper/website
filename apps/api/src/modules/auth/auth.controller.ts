import { Request, Response } from 'express';
import { authService, RegisterSchema, LoginSchema } from './auth.service';
import { ZodError } from 'zod';
import { prisma } from '../../utils/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const data = RegisterSchema.parse(req.body);
      const result = await authService.register(data);

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(400).json({ error: error.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      // DEBUG: log incoming body to help diagnose "Invalid credentials" from browser requests
      // Remove or guard this in production
      // eslint-disable-next-line no-console
      console.debug('[auth] login body:', typeof req.body === 'object' ? JSON.stringify(req.body) : req.body);
      const data = LoginSchema.parse(req.body);
      const result = await authService.login(data);

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(401).json({ error: error.message });
    }
  },

  async logout(req: Request, res: Response) {
    res.clearCookie('accessToken');
    return res.status(200).json({ message: 'Logged out successfully' });
  }
  ,

  async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, name: true, email: true, role: true } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
};
