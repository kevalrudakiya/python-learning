import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid session token' });
  }

  try {
    const session = await prisma.trackingSession.findUnique({
      where: { secureToken: token },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updated = await prisma.trackingSession.update({
      where: { id: session.id },
      data: {
        status: 'TRACKING_STOPPED',
        trackingStoppedAt: new Date(),
      },
    });

    await prisma.consentLog.create({
      data: {
        trackingSessionId: session.id,
        consentType: 'GEOLOCATION_LIVE',
        consentStatus: 'REVOKED',
        userAgent: (req.headers['user-agent'] as string) || null,
      },
    });

    if ((global as any).io) {
      (global as any).io.to(`session:${session.id}`).emit('tracking_stopped', { sessionId: session.id });
    }

    await logAudit('LOCATION_STOPPED_BY_RECIPIENT', 'TrackingSession', session.id, undefined, {
      publicSessionId: session.publicSessionId,
    });

    return res.status(200).json({ success: true, status: updated.status });
  } catch (err) {
    console.error('Recipient stop location error:', err);
    return res.status(500).json({ error: 'Failed to stop tracking' });
  }
}
