import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { oauth2Client, buildRawMessage } from '../config/gmail';
import { google } from 'googleapis';
import { UserStatus } from '@prisma/client';

const USER_LIST_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

async function sendUserStatusEmail(toEmail: string, toName: string, approved: boolean) {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { gmailCredential: true },
    });

    if (!adminUser?.gmailCredential) {
      console.log('Admin Gmail not connected — skipping status notification email.');
      return;
    }

    const { accessToken, refreshToken, expiresAt } = adminUser.gmailCredential;
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiresAt.getTime(),
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const subject = approved
      ? 'JobTracker: Your account has been approved!'
      : 'JobTracker: Your registration request was denied';
    const body = approved
      ? `Hi ${toName},\n\nYour JobTracker account has been approved. You can now log in and start using the app.\n\nBest regards,\nJobTracker`
      : `Hi ${toName},\n\nUnfortunately, your JobTracker registration request has been denied.\n\nBest regards,\nJobTracker`;

    const raw = buildRawMessage(
      adminUser.gmailCredential.gmailAddress,
      toEmail,
      subject,
      body
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
  } catch (err) {
    console.error('Failed to send user status email:', err);
  }
}

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const statusFilter = req.query.status as string | undefined;

  const where = statusFilter && Object.values(UserStatus).includes(statusFilter as UserStatus)
    ? { status: statusFilter as UserStatus }
    : {};

  const users = await prisma.user.findMany({
    where,
    select: USER_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  res.json(users);
});

export const approveUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');
  if (user.status === 'APPROVED') throw new AppError(400, 'User is already approved');

  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'APPROVED' },
    select: USER_LIST_SELECT,
  });

  // Notify user (fire-and-forget)
  sendUserStatusEmail(user.email, user.name, true);

  res.json(updated);
});

export const rejectUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');
  if (user.status === 'REJECTED') throw new AppError(400, 'User is already rejected');

  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'REJECTED' },
    select: USER_LIST_SELECT,
  });

  // Notify user (fire-and-forget)
  sendUserStatusEmail(user.email, user.name, false);

  res.json(updated);
});
