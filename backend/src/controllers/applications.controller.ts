import { Request, Response } from 'express';
import { Prisma, Status } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  parsePagination,
  buildPaginationMeta,
} from '../utils/pagination';

type SortOption = 'appliedAt_desc' | 'appliedAt_asc' | 'company_asc' | 'updatedAt_desc';

function buildOrderBy(sort: SortOption): Prisma.ApplicationOrderByWithRelationInput {
  switch (sort) {
    case 'appliedAt_asc':
      return { appliedAt: 'asc' };
    case 'company_asc':
      return { company: 'asc' };
    case 'updatedAt_desc':
      return { updatedAt: 'desc' };
    case 'appliedAt_desc':
    default:
      return { appliedAt: 'desc' };
  }
}

export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const {
    status,
    search,
    sort = 'appliedAt_desc',
    page,
    limit,
  } = req.query as {
    status?: Status;
    search?: string;
    sort?: SortOption;
    page?: string;
    limit?: string;
  };

  const { skip, take, page: pageNum, limit: limitNum } = parsePagination({ page, limit });

  const where: Prisma.ApplicationWhereInput = {
    userId: req.user.id,
    ...(status && { status }),
    ...(search && {
      OR: [
        { company: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: buildOrderBy(sort),
      skip,
      take,
    }),
    prisma.application.count({ where }),
  ]);

  res.json({
    data,
    pagination: buildPaginationMeta(total, pageNum, limitNum),
  });
});

export const createApplication = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const {
    company,
    role,
    location,
    jobUrl,
    status = 'APPLIED',
    salary,
    notes,
    appliedAt,
    followUpAt,
  } = req.body as {
    company: string;
    role: string;
    location?: string;
    jobUrl?: string;
    status?: Status;
    salary?: string;
    notes?: string;
    appliedAt?: Date;
    followUpAt?: Date;
  };

  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.application.create({
      data: {
        userId: req.user!.id,
        company,
        role,
        location,
        jobUrl,
        status,
        salary,
        notes,
        ...(appliedAt && { appliedAt }),
        ...(followUpAt && { followUpAt }),
      },
      include: { statusHistory: true },
    });

    await tx.statusHistory.create({
      data: {
        applicationId: app.id,
        fromStatus: null,
        toStatus: status,
      },
    });

    return app;
  });

  res.status(201).json(application);
});

export const getApplication = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const { id } = req.params;

  const application = await prisma.application.findFirst({
    where: { id, userId: req.user.id },
    include: {
      statusHistory: { orderBy: { changedAt: 'desc' } },
      contacts: true,
    },
  });

  if (!application) throw new AppError(404, 'Application not found');

  res.json(application);
});

export const updateApplication = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const { id } = req.params;

  const existing = await prisma.application.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!existing) throw new AppError(404, 'Application not found');

  const {
    company,
    role,
    location,
    jobUrl,
    status,
    salary,
    notes,
    appliedAt,
    followUpAt,
  } = req.body as {
    company?: string;
    role?: string;
    location?: string;
    jobUrl?: string;
    status?: Status;
    salary?: string;
    notes?: string;
    appliedAt?: Date;
    followUpAt?: Date;
  };

  const updated = await prisma.$transaction(async (tx) => {
    const app = await tx.application.update({
      where: { id },
      data: {
        ...(company !== undefined && { company }),
        ...(role !== undefined && { role }),
        ...(location !== undefined && { location }),
        ...(jobUrl !== undefined && { jobUrl }),
        ...(status !== undefined && { status }),
        ...(salary !== undefined && { salary }),
        ...(notes !== undefined && { notes }),
        ...(appliedAt !== undefined && { appliedAt }),
        ...(followUpAt !== undefined && { followUpAt }),
      },
      include: {
        statusHistory: { orderBy: { changedAt: 'desc' } },
        contacts: true,
      },
    });

    if (status && status !== existing.status) {
      await tx.statusHistory.create({
        data: {
          applicationId: id,
          fromStatus: existing.status,
          toStatus: status,
        },
      });
    }

    return app;
  });

  res.json(updated);
});

export const deleteApplication = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');

  const { id } = req.params;

  const existing = await prisma.application.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!existing) throw new AppError(404, 'Application not found');

  await prisma.application.delete({ where: { id } });

  res.json({ message: 'Application deleted' });
});
