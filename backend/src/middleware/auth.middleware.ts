import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { JwtPayload } from '../types/auth.types.js';
import { AppError } from './error.middleware.js';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('Authentication required. Please log in to continue.', 401, 'UNAUTHORIZED');
    }

    const decoded = jwt.verify(token, env.JWT.ACCESS_SECRET) as JwtPayload;

    if (decoded.status === 'SUSPENDED') {
      throw new AppError('Your account has been suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Access token expired. Please refresh your session.', 401, 'TOKEN_EXPIRED'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
    } else {
      next(error);
    }
  }
}

export { authorize } from './role.middleware.js';
