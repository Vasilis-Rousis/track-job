import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { prisma } from '../config/db';
import { oauth2Client } from '../config/gmail';
import { getRedisConnection } from '../config/redis';
import { env } from '../config/env';

export function startEmailWorker() {
  const worker = new Worker(
    'scheduled-emails',
    async (job) => {
      const { scheduledEmailId } = job.data as { scheduledEmailId: string };

      const email = await prisma.scheduledEmail.findUnique({
        where: { id: scheduledEmailId },
        include: { application: true },
      });
      if (!email || email.status !== 'PENDING') return;

      const cred = await prisma.userGmailCredential.findUnique({
        where: { userId: email.userId },
      });
      if (!cred) throw new Error('Gmail not connected');

      // Refresh token if needed
      oauth2Client.setCredentials({
        access_token: cred.accessToken,
        refresh_token: cred.refreshToken,
        expiry_date: cred.expiresAt.getTime(),
      });

      const { token: freshAccessToken } = await oauth2Client.getAccessToken();
      const accessToken = freshAccessToken ?? cred.accessToken;

      if (freshAccessToken && freshAccessToken !== cred.accessToken) {
        await prisma.userGmailCredential.update({
          where: { userId: email.userId },
          data: {
            accessToken: freshAccessToken,
            expiresAt: new Date(Date.now() + 3600 * 1000),
          },
        });
      }

      const contacts = await prisma.contact.findMany({
        where: { id: { in: email.contactIds } },
      });

      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: cred.gmailAddress,
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          accessToken,
        },
      });

      for (const contact of contacts) {
        if (!contact.email) continue;
        await transport.sendMail({
          from: cred.gmailAddress,
          to: contact.email,
          subject: email.subject,
          text: email.body.replace(/\[contact\.name\]/g, contact.name),
        });
      }

      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    },
    { connection: getRedisConnection() }
  );

  worker.on('failed', async (job, err) => {
    if (!job) return;
    const { scheduledEmailId } = job.data as { scheduledEmailId: string };
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: { status: 'FAILED', failReason: err.message.slice(0, 1000) },
    }).catch(() => undefined);
  });

  return worker;
}
