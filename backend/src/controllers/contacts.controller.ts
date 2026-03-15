import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';

export const listContacts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const { applicationId, search } = req.query as {
    applicationId?: string;
    search?: string;
  };

  const where: Prisma.ContactWhereInput = {
    userId: req.user.id,
    ...(applicationId && { applicationId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const data = await prisma.contact.findMany({
    where,
    include: {
      application: {
        select: { id: true, company: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data });
});

export const createContact = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const { name, title, email, phone, linkedin, applicationId, notes } = req.body as {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    applicationId?: string;
    notes?: string;
  };

  // If applicationId provided, verify the application belongs to this user
  if (applicationId) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user.id },
    });
    if (!app) throw new AppError(404, 'Application not found');
  }

  const contact = await prisma.contact.create({
    data: {
      userId: req.user.id,
      name,
      title,
      email,
      phone,
      linkedin,
      applicationId,
      notes,
    },
    include: {
      application: {
        select: { id: true, company: true, role: true },
      },
    },
  });

  res.status(201).json(contact);
});

export const updateContact = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const { id } = req.params;

  const existing = await prisma.contact.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!existing) throw new AppError(404, 'Contact not found');

  const { name, title, email, phone, linkedin, applicationId, notes } = req.body as {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    applicationId?: string;
    notes?: string;
  };

  if (applicationId) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user.id },
    });
    if (!app) throw new AppError(404, 'Application not found');
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(title !== undefined && { title }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(linkedin !== undefined && { linkedin }),
      ...(applicationId !== undefined && { applicationId }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      application: {
        select: { id: true, company: true, role: true },
      },
    },
  });

  res.json(contact);
});

export const deleteContact = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const { id } = req.params;

  const existing = await prisma.contact.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!existing) throw new AppError(404, 'Contact not found');

  await prisma.contact.delete({ where: { id } });

  res.json({ message: 'Contact deleted' });
});
