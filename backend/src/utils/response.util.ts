import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  pagination?: ApiResponse['pagination']
): Response {
  const body: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    data,
    ...(pagination && { pagination }),
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  code = 'BAD_REQUEST',
  statusCode = 400,
  details?: unknown
): Response {
  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
  return res.status(statusCode).json(body);
}
