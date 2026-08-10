import { z } from "zod";

// Shared password rules — single source of truth for both API validation and
// frontend form requirements. 8+ chars with uppercase, lowercase, digit.
export const passwordSchema = z
  .string()
  .min(8)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  );

export const emailSchema = z.string().email();

/** Zod schema for user registration — enforces name length, email format, and password strength */
export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
});

/** Zod schema for user login — requires valid email and password string */
export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string(),
  rememberMe: z.boolean().optional(),
});

/** Zod schema for changing an existing password (requires the current one) */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

/** Zod schema for setting the initial password (mustChangePassword flow) */
export const SetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

/** Zod schema for requesting a password reset link */
export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

/** Zod schema for completing a password reset with a token */
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
