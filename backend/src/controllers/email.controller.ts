import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { emailQueue } from '../config/emailQueue';
import { AppError } from '../middleware/errorHandler';
import { oauth2Client, sendViaGmailApi } from '../config/gmail';
import { decrypt } from '../utils/crypto';
import type { ScheduleEmailInput, UpdateEmailInput, SendNowInput } from '../schemas/email.schema';

export const scheduleEmail = async (req: Request, res: Response): Promise<void> => {
  const data = req.body as ScheduleEmailInput;
  const userId = req.user!.id;

  // Verify Gmail is connected
  const cred = await prisma.userGmailCredential.findUnique({ where: { userId } });
  if (!cred) {
    throw new AppError(400, 'Gmail account not connected. Go to Settings to connect.');
  }

  // Verify application belongs to user
  const application = await prisma.application.findFirst({
    where: { id: data.applicationId, userId },
  });
  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  // Verify all contacts belong to user and have emails
  const contacts = await prisma.contact.findMany({
    where: { id: { in: data.contactIds }, userId },
  });
  if (contacts.length !== data.contactIds.length) {
    throw new AppError(400, 'One or more contacts not found');
  }
  const contactsWithEmail = contacts.filter((c) => c.email);
  if (contactsWithEmail.length === 0) {
    throw new AppError(400, 'Selected contacts have no email addresses');
  }

  const scheduledFor = data.scheduledFor as unknown as Date;
  const delay = scheduledFor.getTime() - Date.now();

  const record = await prisma.scheduledEmail.create({
    data: {
      userId,
      applicationId: data.applicationId,
      contactIds: data.contactIds,
      subject: data.subject,
      body: data.body,
      scheduledFor,
    },
  });

  const job = await emailQueue.add(
    'send-followup',
    { scheduledEmailId: record.id },
    { delay: Math.max(delay, 0), jobId: record.id, attempts: 1 }
  );

  await prisma.scheduledEmail.update({
    where: { id: record.id },
    data: { bullJobId: job.id },
  });

  res.status(201).json(record);
};

export const listEmails = async (req: Request, res: Response): Promise<void> => {
  const { applicationId } = req.query as { applicationId?: string };

  const emails = await prisma.scheduledEmail.findMany({
    where: {
      userId: req.user!.id,
      ...(applicationId ? { applicationId } : {}),
    },
    include: { application: { select: { company: true, role: true } } },
    orderBy: { scheduledFor: 'desc' },
  });

  res.json({ data: emails });
};

export const deleteEmail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const email = await prisma.scheduledEmail.findFirst({ where: { id, userId } });
  if (!email) throw new AppError(404, 'Scheduled email not found');

  if (email.status === 'PENDING' && email.bullJobId) {
    const job = await emailQueue.getJob(email.bullJobId);
    if (job) await job.remove();
  }

  await prisma.scheduledEmail.delete({ where: { id } });

  res.json({ message: 'Email deleted' });
};

export const updateEmail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const data = req.body as UpdateEmailInput;

  const email = await prisma.scheduledEmail.findFirst({ where: { id, userId } });
  if (!email) throw new AppError(404, 'Scheduled email not found');
  if (email.status !== 'PENDING') throw new AppError(400, 'Only pending emails can be edited');

  // Validate contacts belong to user and have emails
  const contacts = await prisma.contact.findMany({
    where: { id: { in: data.contactIds }, userId },
  });
  if (contacts.length !== data.contactIds.length) {
    throw new AppError(400, 'One or more contacts not found');
  }
  if (contacts.filter((c) => c.email).length === 0) {
    throw new AppError(400, 'Selected contacts have no email addresses');
  }

  // Remove old BullMQ job
  if (email.bullJobId) {
    const job = await emailQueue.getJob(email.bullJobId);
    if (job) await job.remove();
  }

  const scheduledFor = data.scheduledFor as unknown as Date;
  const delay = Math.max(scheduledFor.getTime() - Date.now(), 0);

  const updated = await prisma.scheduledEmail.update({
    where: { id },
    data: {
      contactIds: data.contactIds,
      subject: data.subject,
      body: data.body,
      scheduledFor,
      bullJobId: null,
    },
    include: { application: { select: { company: true, role: true } } },
  });

  const newJob = await emailQueue.add(
    'send-followup',
    { scheduledEmailId: id },
    { delay, jobId: `${id}-${Date.now()}`, attempts: 1 }
  );

  await prisma.scheduledEmail.update({ where: { id }, data: { bullJobId: newJob.id } });

  res.json({ ...updated, bullJobId: newJob.id });
};

export const sendNow = async (req: Request, res: Response): Promise<void> => {
  const data = req.body as SendNowInput;
  const userId = req.user!.id;

  const cred = await prisma.userGmailCredential.findUnique({ where: { userId } });
  if (!cred) throw new AppError(400, 'Gmail account not connected. Go to Settings to connect.');

  const application = await prisma.application.findFirst({
    where: { id: data.applicationId, userId },
  });
  if (!application) throw new AppError(404, 'Application not found');

  const contacts = await prisma.contact.findMany({
    where: { id: { in: data.contactIds }, userId },
  });
  if (contacts.length !== data.contactIds.length) throw new AppError(400, 'One or more contacts not found');

  const validContacts = contacts.filter((c) => c.email);
  if (validContacts.length === 0) throw new AppError(400, 'Selected contacts have no email addresses');

  const now = new Date();
  const record = await prisma.scheduledEmail.create({
    data: {
      userId,
      applicationId: data.applicationId,
      contactIds: data.contactIds,
      subject: data.subject,
      body: data.body,
      scheduledFor: now,
    },
  });

  try {
    oauth2Client.setCredentials({
      access_token: decrypt(cred.accessToken),
      refresh_token: decrypt(cred.refreshToken),
      expiry_date: cred.expiresAt.getTime(),
    });

    for (const contact of validContacts) {
      await sendViaGmailApi(
        cred.gmailAddress,
        contact.email!,
        data.subject,
        data.body.replace(/\[contact\.name\]/g, contact.name),
      );
    }

    const updated = await prisma.scheduledEmail.update({
      where: { id: record.id },
      data: { status: 'SENT', sentAt: now },
      include: { application: { select: { company: true, role: true } } },
    });

    res.status(201).json(updated);
  } catch (err) {
    await prisma.scheduledEmail.update({
      where: { id: record.id },
      data: { status: 'FAILED', failReason: (err as Error).message.slice(0, 1000) },
    });
    throw err;
  }
};
