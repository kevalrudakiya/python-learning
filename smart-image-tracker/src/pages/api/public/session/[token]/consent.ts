import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  const { action, userAgent } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' });
  }

  try {
    const session = await prisma.trackingSession.findUnique({
      where: { secureToken: token },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (new Date() > session.expiresAt) {
      return res.status(400).json({ error: 'SESSION_EXPIRED' });
    }

    if (action === 'allow') {
      const updated = await prisma.trackingSession.update({
        where: { id: session.id },
        data: {
          consentAt: new Date(),
          status: 'LOCATION_ALLOWED',
        },
      });

      await prisma.consentLog.create({
        data: {
          trackingSessionId: session.id,
          consentType: 'GEOLOCATION_LIVE',
          consentStatus: 'GRANTED',
          userAgent: userAgent || (req.headers['user-agent'] as string) || null,
        },
      });

      await logAudit('CONSENT_GRANTED', 'TrackingSession', session.id, undefined, {
        publicSessionId: session.publicSessionId,
      });

      return res.status(200).json({ status: updated.status, message: 'Consent recorded successfully' });
    }

    if (action === 'deny') {
      const updated = await prisma.trackingSession.update({
        where: { id: session.id },
        data: {
          status: 'LOCATION_DENIED',
        },
      });

      await prisma.consentLog.create({
        data: {
          trackingSessionId: session.id,
          consentType: 'GEOLOCATION_LIVE',
          consentStatus: 'DECLINED',
          userAgent: userAgent || (req.headers['user-agent'] as string) || null,
        },
      });

      await logAudit('CONSENT_DECLINED', 'TrackingSession', session.id, undefined, {
        publicSessionId: session.publicSessionId,
      });

      return res.status(200).json({ status: updated.status, message: 'Consent declined' });
    }

    return res.status(400).json({ error: 'Invalid consent action' });
  } catch (err) {
    console.error('Consent recording error:', err);
    return res.status(500).json({ error: 'Failed to record consent' });
  }
}
