import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function handleControllerError(
  err: unknown,
  logger?: { error: (msg: string, ...args: unknown[]) => void },
): { statusCode: number; body: Record<string, unknown> } {
  if (err instanceof ZodError) {
    const firstMessage = err.errors[0]?.message || "Validation error";
    const field = err.errors[0]?.path?.join(".");
    const message = field ? `${field}: ${firstMessage}` : firstMessage;
    return { statusCode: 400, body: { error: message } };
  }

  if (err instanceof AppError) {
    return { statusCode: err.statusCode, body: { error: err.message } };
  }

  const message = getErrorMessage(err);
  if (logger) {
    logger.error(`[controller] ${message}`);
  }
  return { statusCode: 500, body: { error: message } };
}
