import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/prisma";
import { z } from "zod";
import { UserRole } from "@lms/types";
import { emailService } from "../../services/email.service";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_secret_min_32_chars_long!";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "15m";

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authService = {
  async register(data: z.infer<typeof RegisterSchema>) {
    const { name, email, password } = data;

    // Normalize email to lower-case for consistent storage
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) throw new Error("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: hashedPassword,
      },
    });

    emailService
      .sendWelcomeEmail({ name, email: normalizedEmail })
      .catch((err) => {
        console.error("[auth] Failed to send welcome email:", err);
      });

    return this.generateTokens(user);
  },

  async login(data: z.infer<typeof LoginSchema>) {
    const { email, password } = data;

    // Use case-insensitive lookup so logins are resilient to email casing
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
    });

    if (!user || !user.passwordHash) throw new Error("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new Error("Invalid credentials");

    return this.generateTokens(user);
  },

  // Generate JWT access + refresh tokens for a user
  generateTokens(user: { id: string; role: string; email: string }) {
    const payload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRY as any,
    });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d" as any,
    });

    return { accessToken, refreshToken, user: payload };
  },
};
