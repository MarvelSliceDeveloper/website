import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('7d'),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  MS_CLIENT_ID: z.string(),
  MS_CLIENT_SECRET: z.string(),
  MS_TENANT_ID: z.string().default('common'),
  MS_REDIRECT_URI: z.string().url(),
  RAZORPAY_KEY_ID: z.string(),
  RAZORPAY_KEY_SECRET: z.string(),
  RAZORPAY_WEBHOOK_SECRET: z.string(),
  TOKEN_ENCRYPTION_KEY: z.string().min(32),
  API_URL: z.string().url(),
  WEB_URL: z.string().url(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
