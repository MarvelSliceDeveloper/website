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
  tenantSlug: z.string(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  tenantSlug: z.string(),
});

export const authService = {
  async register(data: z.infer<typeof RegisterSchema>) {
    const { name, email, password, tenantSlug } = data;

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) throw new Error('Tenant not found');

    const existingUser = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } }
    });

    if (existingUser) throw new Error('Email already registered in this tenant');

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tenantId: tenant.id,
      }
    });

    return this.generateTokens(user);
  },

  async login(data: z.infer<typeof LoginSchema>) {
    const { email, password, tenantSlug } = data;

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) throw new Error('Invalid credentials');

    const user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } }
    });

    if (!user || !user.password) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    return this.generateTokens(user);
  },

  generateTokens(user: any) {
    const payload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken, user: payload };
  }
};
