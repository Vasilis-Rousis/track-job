import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { isTokenBlacklisted } from '../utils/tokenBlacklist';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  jti: string;
  iat: number;
  exp: number;
}

export const TOKEN_COOKIE = 'token';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  // Read token from httpOnly cookie first, then fall back to Authorization header
  let token: string | undefined = req.cookies?.[TOKEN_COOKIE];
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return next(new AppError(401, 'No token provided'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Check if this token has been revoked
    if (payload.jti && await isTokenBlacklisted(payload.jti)) {
      return next(new AppError(401, 'Token has been revoked'));
    }

    req.user = { id: payload.userId, email: payload.email, name: payload.name, role: payload.role };
    (req as any).tokenPayload = payload;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
};

export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'ADMIN') {
    return next(new AppError(403, 'Admin access required'));
  }
  next();
};
