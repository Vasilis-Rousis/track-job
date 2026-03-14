import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} as const;

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body as {
    email: string;
    password: string;
    name: string;
  };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: USER_SELECT,
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  res.status(201).json({ token, user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findUnique({ where: { email } });

  // Always hash even if user not found to prevent timing attacks
  const hash = user?.passwordHash ?? '$2a$10$invalidhashfortimingattackprevention';
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: USER_SELECT,
  });

  if (!user) throw new AppError(404, 'User not found');
  res.json(user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const { name } = req.body as { name: string };

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name },
    select: USER_SELECT,
  });

  res.json(user);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new AppError(404, 'User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError(400, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash },
  });

  res.json({ message: 'Password updated successfully' });
});
