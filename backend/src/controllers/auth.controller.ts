import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { TOKEN_COOKIE, type JwtPayload } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { blacklistToken } from '../utils/tokenBlacklist';
import { randomUUID } from 'crypto';
import { oauth2Client, buildRawMessage } from '../config/gmail';
import { google } from 'googleapis';
import { decrypt } from '../utils/crypto';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

async function notifyAdminOfRegistration(userName: string, userEmail: string) {
  if (!env.ADMIN_EMAIL) return;

  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { gmailCredential: true },
    });

    if (!adminUser?.gmailCredential) {
      console.log('Admin Gmail not connected — skipping registration notification email.');
      return;
    }

    const { accessToken, refreshToken, expiresAt } = adminUser.gmailCredential;
    oauth2Client.setCredentials({
      access_token: decrypt(accessToken),
      refresh_token: decrypt(refreshToken),
      expiry_date: expiresAt.getTime(),
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const raw = buildRawMessage(
      adminUser.gmailCredential.gmailAddress,
      env.ADMIN_EMAIL,
      `JobTracker: New registration from ${userName}`,
      `A new user has registered and is awaiting your approval.\n\nName: ${userName}\nEmail: ${userEmail}\n\nLog in to the admin dashboard to approve or reject this request.`
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    console.log(`Registration notification sent to ${env.ADMIN_EMAIL}`);
  } catch (err) {
    console.error('Failed to send registration notification email:', err);
  }
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body as {
    email: string;
    password: string;
    name: string;
  };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash, name },
  });

  // Send notification to admin (fire-and-forget)
  notifyAdminOfRegistration(name, email);

  res.status(201).json({ message: 'Account created. Awaiting admin approval.' });
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

  if (user.status === 'PENDING') {
    throw new AppError(403, 'Your account is pending admin approval.');
  }

  if (user.status === 'REJECTED') {
    throw new AppError(403, 'Your registration request was denied.');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name, role: user.role, jti: randomUUID() },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Blacklist the current token so it can't be reused
  const payload = (req as any).tokenPayload as JwtPayload | undefined;
  if (payload?.jti) {
    await blacklistToken(payload.jti, payload.exp);
  }

  res.cookie(TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 0,
    path: '/',
  });
  res.json({ message: 'Logged out' });
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

  // Blacklist the current token so the user must re-login
  const payload = (req as any).tokenPayload as JwtPayload | undefined;
  if (payload?.jti) {
    await blacklistToken(payload.jti, payload.exp);
  }

  res.cookie(TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 0,
    path: '/',
  });

  res.json({ message: 'Password updated successfully' });
});
