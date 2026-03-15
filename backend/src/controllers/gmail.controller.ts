import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { oauth2Client, GMAIL_SCOPES } from '../config/gmail';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { encrypt } from '../utils/crypto';

interface StatePayload {
  userId: string;
}

export const getAuthUrl = async (req: Request, res: Response): Promise<void> => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new AppError(503, 'Gmail integration is not configured');
  }

  const state = jwt.sign({ userId: req.user!.id }, env.JWT_SECRET, {
    expiresIn: '10m',
  } as jwt.SignOptions);

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GMAIL_SCOPES,
    state,
  });

  res.json({ url });
};

export const handleCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state) {
    res.redirect(`${env.FRONTEND_URL}/settings?gmail=error`);
    return;
  }

  let userId: string;
  try {
    const payload = jwt.verify(state, env.JWT_SECRET) as StatePayload;
    userId = payload.userId;
  } catch {
    res.redirect(`${env.FRONTEND_URL}/settings?gmail=error`);
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Decode id_token to get Gmail address
    let gmailAddress = '';
    if (tokens.id_token) {
      const decoded = jwt.decode(tokens.id_token) as { email?: string } | null;
      gmailAddress = decoded?.email ?? '';
    }

    const encryptedAccess = encrypt(tokens.access_token ?? '');
    const encryptedRefresh = tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined;

    await prisma.userGmailCredential.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh ?? encrypt(''),
        expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
        gmailAddress,
      },
      update: {
        accessToken: encryptedAccess,
        ...(encryptedRefresh ? { refreshToken: encryptedRefresh } : {}),
        expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
        gmailAddress,
      },
    });

    res.redirect(`${env.FRONTEND_URL}/settings?gmail=connected`);
  } catch {
    res.redirect(`${env.FRONTEND_URL}/settings?gmail=error`);
  }
};

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  const cred = await prisma.userGmailCredential.findUnique({
    where: { userId: req.user!.id },
    select: { gmailAddress: true },
  });
  res.json({ connected: !!cred, email: cred?.gmailAddress ?? null });
};

export const disconnect = async (req: Request, res: Response): Promise<void> => {
  await prisma.userGmailCredential.deleteMany({
    where: { userId: req.user!.id },
  });
  res.json({ message: 'Gmail disconnected' });
};
