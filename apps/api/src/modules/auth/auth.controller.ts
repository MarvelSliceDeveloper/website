import { Request, Response } from 'express';
import { authService, RegisterSchema, LoginSchema } from './auth.service';
import { ZodError } from 'zod';

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
};
