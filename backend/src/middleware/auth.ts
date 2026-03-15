import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'No token provided'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { id: payload.userId, email: payload.email, name: payload.name, role: payload.role };
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
