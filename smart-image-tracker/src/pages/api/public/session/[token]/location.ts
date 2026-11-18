import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  const { latitude, longitude, accuracy, speed, heading } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid session token' });
  }

  if (latitude === undefined || longitude === undefined || accuracy === undefined) {
    return res.status(400).json({ error: 'latitude, longitude, and accuracy are required' });
  }

  try {
    const session = await prisma.trackingSession.findUnique({
      where: { secureToken: token },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const now = new Date();
    if (now > session.expiresAt || session.status === 'EXPIRED') {
      if (session.status !== 'EXPIRED') {
        await prisma.trackingSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED' },
        });
      }
      return res.status(400).json({ error: 'SESSION_EXPIRED' });
    }

    if (session.status === 'TRACKING_STOPPED') {
      return res.status(400).json({ error: 'TRACKING_STOPPED' });
    }

    if (session.status === 'LOCATION_DENIED') {
      return res.status(403).json({ error: 'LOCATION_DENIED' });
    }

    // Save location point
    const point = await prisma.locationPoint.create({
      data: {
        trackingSessionId: session.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: parseFloat(accuracy),
        speed: speed !== undefined && speed !== null ? parseFloat(speed) : null,
        heading: heading !== undefined && heading !== null ? parseFloat(heading) : null,
        timestamp: now,
      },
    });

    // First position updates tracking status to active
    const isFirstPoint = !session.trackingStartedAt;
    await prisma.trackingSession.update({
      where: { id: session.id },
      data: {
        status: 'TRACKING_ACTIVE',
        trackingStartedAt: session.trackingStartedAt || now,
      },
    });

    if (isFirstPoint) {
      await logAudit('LOCATION_TRACKING_STARTED', 'TrackingSession', session.id, undefined, {
        publicSessionId: session.publicSessionId,
      });
    }

    // Broadcast live location to Socket.IO room
    if ((global as any).io) {
      (global as any).io.to(`session:${session.id}`).emit('location_broadcast', {
        id: point.id,
        latitude: point.latitude,
        longitude: point.longitude,
        accuracy: point.accuracy,
        speed: point.speed,
        heading: point.heading,
        timestamp: point.timestamp,
      });
    }

    return res.status(200).json({ success: true, timestamp: point.timestamp });
  } catch (err) {
    console.error('Record location error:', err);
    return res.status(500).json({ error: 'Failed to record location' });
  }
}
