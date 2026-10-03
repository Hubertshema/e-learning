import { verifyAccessToken } from '../utils/jwt.util.js';
import { sendError } from '../utils/response.util.js';
import { UserModel } from '../models/user.model.js';
import { cache } from '../config/cache.js';

/**
 * Authenticate JWT Access Token
 */
export async function authenticate(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query?.token) {
    token = req.query.token;
  } else if (req.cookies?.accessToken || req.cookies?.token) {
    token = req.cookies?.accessToken || req.cookies?.token;
  }

  if (!token) {
    return sendError(res, 'Authentication token missing or invalid', 401, 'UNAUTHORIZED');
  }

  try {
    const decoded = verifyAccessToken(token);
    
    // Check if session is the active one
    if (decoded.sessionId) {
      let activeSessionId = cache.get(`session_${decoded.id}`);
      if (!activeSessionId) {
        const user = await UserModel.findById(decoded.id);
        if (user && user.activeSessionId) {
          activeSessionId = user.activeSessionId;
          cache.set(`session_${decoded.id}`, activeSessionId, 7 * 24 * 60 * 60);
        }
      }
      
      if (activeSessionId && decoded.sessionId !== activeSessionId) {
        return sendError(res, 'Session expired due to login from another device', 401, 'SESSION_INVALIDATED');
      }
    }

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
export async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyAccessToken(token);
      let isValid = true;
      if (decoded.sessionId) {
        let activeSessionId = cache.get(`session_${decoded.id}`);
        if (!activeSessionId) {
          const user = await UserModel.findById(decoded.id);
          if (user && user.activeSessionId) {
            activeSessionId = user.activeSessionId;
            cache.set(`session_${decoded.id}`, activeSessionId, 7 * 24 * 60 * 60);
          }
        }
        if (activeSessionId && decoded.sessionId !== activeSessionId) {
          isValid = false;
        }
      }
      if (isValid) {
        req.user = decoded;
      } else {
        req.user = null;
      }
    } catch {
      req.user = null;
    }
  }
  next();
}
