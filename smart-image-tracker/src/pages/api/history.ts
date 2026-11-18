import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { calculateTotalRouteDistance } from '@/lib/geo';

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

    // Apply data retention policy
    const settings = await prisma.appSettings.findUnique({ where: { id: 'default' } });
    const retentionDays = settings?.locationRetentionDays || 30;
    const retentionCutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // Delete location points older than retention cutoff
    await prisma.locationPoint.deleteMany({
      where: {
        timestamp: { lt: retentionCutoff },
      },
    });

    const sessions = await prisma.trackingSession.findMany({
      where: userFilter,
      orderBy: { createdAt: 'desc' },
      include: {
        image: {
          select: { title: true, fileUrl: true },
        },
        locationPoints: {
          orderBy: { timestamp: 'asc' },
          select: { latitude: true, longitude: true, accuracy: true, timestamp: true },
        },
        consentLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const historyItems = sessions.map((s) => {
      const distanceKm = calculateTotalRouteDistance(s.locationPoints);
      const firstPoint = s.locationPoints[0]?.timestamp;
      const lastPoint = s.locationPoints[s.locationPoints.length - 1]?.timestamp;
      const durationSeconds =
        firstPoint && lastPoint ? (new Date(lastPoint).getTime() - new Date(firstPoint).getTime()) / 1000 : 0;

      return {
        id: s.id,
        publicSessionId: s.publicSessionId,
        recipientLabel: s.recipientLabel,
        purpose: s.purpose,
        status: s.status,
        createdAt: s.createdAt,
        openedAt: s.openedAt,
        consentAt: s.consentAt,
        trackingStartedAt: s.trackingStartedAt,
        trackingStoppedAt: s.trackingStoppedAt,
        expiresAt: s.expiresAt,
        imageTitle: s.image.title,
        imageFileUrl: s.image.fileUrl,
        pointCount: s.locationPoints.length,
        distanceKm,
        durationSeconds,
        consentStatus: s.consentLogs[0]?.consentStatus || 'NONE',
      };
    });

    return res.status(200).json({ history: historyItems, retentionDays });
  } catch (err) {
    console.error('History API error:', err);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
}
