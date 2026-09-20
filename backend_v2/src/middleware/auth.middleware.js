import { verifyAccessToken } from '../utils/jwt.util.js';
import { sendError } from '../utils/response.util.js';

/**
 * Authenticate JWT Access Token
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication token missing or invalid', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token has expired', 401, 'TOKEN_EXPIRED');
    }
    return sendError(res, 'Invalid authentication token', 401, 'INVALID_TOKEN');
  }
}

/**
 * Authorize specific user roles
 * @param  {...string} roles - e.g. 'SUPERADMIN', 'TEACHER', 'STUDENT'
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return sendError(res, 'Access denied: insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
}

/**
 * Optional Authentication (attach user if token present, don't reject if not)
 */
export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyAccessToken(token);
    } catch {
      req.user = null;
    }
  }
  next();
}
