import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma';
import { z } from 'zod';
import { UserRole } from '@lms/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_min_32_chars_long!';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authService = {
  async register(data: z.infer<typeof RegisterSchema>) {
    const { name, email, password } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

    return this.generateTokens(user);
  },

  async login(data: z.infer<typeof LoginSchema>) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    return this.generateTokens(user);
  },

  generateTokens(user: any) {
    const payload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken, user: payload };
  }
};
