import { env } from '../config/env.js';
import { sendError } from '../utils/response.util.js';

/**
 * Global Express Error Handler
 */
export function errorHandler(err, _req, res, _next) {
  console.error('💥 Unhandled Application Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected internal server error occurred';

  const details = env.NODE_ENV === 'development' ? { stack: err.stack } : null;

  return sendError(res, message, statusCode, code, details);
}
