import { Request, Response } from 'express';
import { Status } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';

const ALL_STATUSES: Status[] = [
  'WISHLIST',
  'APPLIED',
  'PHONE_SCREEN',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
];

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const userId = req.user.id;

  const [statusCounts, recentActivity, total] = await Promise.all([
    prisma.application.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.statusHistory.findMany({
      where: {
        application: { userId },
      },
      orderBy: { changedAt: 'desc' },
      take: 5,
      include: {
        application: {
          select: { company: true, role: true },
        },
      },
    }),
    prisma.application.count({ where: { userId } }),
  ]);

  // Build byStatus map with 0 defaults for missing statuses
  const byStatus = ALL_STATUSES.reduce<Record<Status, number>>((acc, s) => {
    acc[s] = 0;
    return acc;
  }, {} as Record<Status, number>);

  for (const { status, _count } of statusCounts) {
    byStatus[status] = _count._all;
  }

  // responseRate = apps that reached PHONE_SCREEN or beyond / apps that were APPLIED or beyond
  const appliedOrBeyond =
    byStatus.APPLIED +
    byStatus.PHONE_SCREEN +
    byStatus.INTERVIEW +
    byStatus.OFFER +
    byStatus.REJECTED +
    byStatus.WITHDRAWN;

  const respondedOrBeyond =
    byStatus.PHONE_SCREEN +
    byStatus.INTERVIEW +
    byStatus.OFFER +
    byStatus.REJECTED;

  const responseRate =
    appliedOrBeyond > 0
      ? Math.round((respondedOrBeyond / appliedOrBeyond) * 1000) / 10
      : 0;

  const offerRate =
    appliedOrBeyond > 0
      ? Math.round((byStatus.OFFER / appliedOrBeyond) * 1000) / 10
      : 0;

  res.json({
    total,
    byStatus,
    responseRate,
    offerRate,
    recentActivity,
  });
});
