import { Request, Response, NextFunction } from 'express';
import { RoleType } from '../types/auth.types.js';
import { AppError } from './error.middleware.js';

export function authorize(...allowedRoles: RoleType[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden. Required role(s): ${allowedRoles.join(', ')}`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
