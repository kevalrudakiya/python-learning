import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const userFilter = isSuperAdmin ? {} : { userId: user.id };

    // Auto-update expired sessions
    const now = new Date();
    await prisma.trackingSession.updateMany({
      where: {
        ...userFilter,
        expiresAt: { lt: now },
        status: { notIn: ['EXPIRED', 'TRACKING_STOPPED'] },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    const totalImages = await prisma.image.count({ where: userFilter });
    const activeShareSessions = await prisma.trackingSession.count({
      where: {
        ...userFilter,
        status: { in: ['CREATED', 'OPENED', 'CONSENT_PENDING', 'LOCATION_ALLOWED', 'TRACKING_ACTIVE'] },
        expiresAt: { gt: now },
      },
    });
    const currentlySharingLocation = await prisma.trackingSession.count({
      where: {
        ...userFilter,
        status: 'TRACKING_ACTIVE',
        expiresAt: { gt: now },
      },
    });
    const expiredSessions = await prisma.trackingSession.count({
      where: {
        ...userFilter,
        status: 'EXPIRED',
      },
    });
    const locationSharingStopped = await prisma.trackingSession.count({
      where: {
        ...userFilter,
        status: 'TRACKING_STOPPED',
      },
    });
    const totalLinkOpens = await prisma.trackingSession.count({
      where: {
        ...userFilter,
        openedAt: { not: null },
      },
    });

    const recentSessions = await prisma.trackingSession.findMany({
      where: userFilter,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        image: {
          select: { title: true, fileUrl: true },
        },
        locationPoints: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { timestamp: true, latitude: true, longitude: true, accuracy: true },
        },
      },
    });

    return res.status(200).json({
      stats: {
        totalImages,
        activeShareSessions,
        currentlySharingLocation,
        expiredSessions,
        locationSharingStopped,
        totalLinkOpens,
      },
      recentSessions,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
