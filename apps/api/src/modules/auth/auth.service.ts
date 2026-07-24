/**
 * Auth service — handles user registration, login, and JWT token generation.
 *
 * Passwords are hashed with bcrypt (12 rounds). JWT tokens include userId,
 * role, email, and optional sessionTimeoutMin claim for per-user timeouts.
 *
 * Registration requires name (2-100 chars), valid email, and a strong
 * password (8+ chars, uppercase, lowercase, digit).
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/prisma";
import { z } from "zod";
import { AppError } from "../../utils/errors";
import { UserRole } from "@lms/types";
import { emailService } from "../../services/email.service";

const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing required environment variable: JWT_SECRET");
  }
  return secret;
}

/** Zod schema for user registration — enforces name length, email format, and password strength */
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

/** Zod schema for user login — requires valid email and password string */
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

    if (existingUser) throw new AppError(409, "Email already registered");

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

    return this.generateTokens({ ...user, name: user.name });
  },

  async login(data: z.infer<typeof LoginSchema>) {
    const { email, password } = data;

    // Use case-insensitive lookup so logins are resilient to email casing
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
    });

    if (!user || !user.passwordHash)
      throw new AppError(401, "Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new AppError(401, "Invalid credentials");

    if (user.isSuspended) {
      throw new AppError(
        403,
        "Account is pending approval. Please contact support.",
      );
    }

    return this.generateTokens({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      mustChangePassword: user.mustChangePassword,
      onboardingComplete: user.onboardingComplete,
      sessionTimeoutMin: user.sessionTimeoutMin,
    });
  },

  // Generate JWT access token for a user
  generateTokens(user: {
    id: string;
    role: string;
    email: string;
    name: string;
    mustChangePassword?: boolean;
    onboardingComplete?: boolean;
    sessionTimeoutMin?: number;
  }) {
    const payload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      sessionTimeoutMin: user.sessionTimeoutMin ?? 480,
    };

    const accessToken = jwt.sign(payload, getJwtSecret(), {
      expiresIn: JWT_EXPIRY as any,
    });

    return {
      accessToken,
      user: {
        ...payload,
        name: user.name,
        mustChangePassword: user.mustChangePassword ?? false,
        onboardingComplete: user.onboardingComplete ?? false,
      },
    };
  },
};
