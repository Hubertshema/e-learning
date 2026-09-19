import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response.util.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Custom Application Error
  if (err instanceof AppError) {
    return sendError(res, err.message, err.code, err.statusCode, err.details);
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    const messageDetails = formattedErrors.map((e) => `${e.field ? `${e.field}: ` : ''}${e.message}`).join('; ');
    return sendError(
      res,
      `Validation failed: ${messageDetails}`,
      'VALIDATION_ERROR',
      422,
      formattedErrors
    );
  }

  // Prisma Database Known Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      return sendError(res, `A record with this ${target} already exists.`, 'DUPLICATE_RESOURCE', 409);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'The requested record could not be found.', 'NOT_FOUND', 404);
    }
    return sendError(res, 'A database error occurred. Please try again.', 'DATABASE_ERROR', 500);
  }

  // Fallback Internal Server Error
  console.error('💥 Unhandled Exception:', err);
  return sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred on the server.'
      : err.message || 'Internal Server Error',
    'INTERNAL_SERVER_ERROR',
    500
  );
}
