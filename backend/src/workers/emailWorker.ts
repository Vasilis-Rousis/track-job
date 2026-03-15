import { Worker } from 'bullmq';
import { prisma } from '../config/db';
import { oauth2Client, sendViaGmailApi } from '../config/gmail';
import { getRedisConnection } from '../config/redis';

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

      // Set credentials — googleapis handles token refresh internally
      oauth2Client.setCredentials({
        access_token: cred.accessToken,
        refresh_token: cred.refreshToken,
        expiry_date: cred.expiresAt.getTime(),
      });

      const contacts = await prisma.contact.findMany({
        where: { id: { in: email.contactIds } },
      });

      const validContacts = contacts.filter((c) => c.email);
      if (validContacts.length === 0) {
        throw new Error('No valid recipients — all contacts missing email addresses');
      }

      for (const contact of validContacts) {
        await sendViaGmailApi(
          cred.gmailAddress,
          contact.email!,
          email.subject,
          email.body.replace(/\[contact\.name\]/g, contact.name),
        );
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
