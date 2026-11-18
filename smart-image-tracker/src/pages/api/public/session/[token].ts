import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid session token' });
  }

  try {
    const session = await prisma.trackingSession.findUnique({
      where: { secureToken: token },
      include: {
        image: {
          select: { title: true, description: true, fileUrl: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Tracking session not found or invalid link' });
    }

    const now = new Date();
    const isExpired = now > session.expiresAt || session.status === 'EXPIRED';

    if (isExpired && session.status !== 'EXPIRED') {
      await prisma.trackingSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
      session.status = 'EXPIRED';
    }

    // Log first link open if not opened yet
    if (!session.openedAt) {
      await prisma.trackingSession.update({
        where: { id: session.id },
        data: {
          openedAt: now,
          status: session.status === 'CREATED' ? 'CONSENT_PENDING' : session.status,
        },
      });
      await logAudit('LINK_OPENED', 'TrackingSession', session.id, undefined, {
        publicSessionId: session.publicSessionId,
      });
    }

    return res.status(200).json({
      session: {
        id: session.id,
        publicSessionId: session.publicSessionId,
        recipientLabel: session.recipientLabel,
        purpose: session.purpose,
        durationMinutes: session.durationMinutes,
        status: isExpired ? 'EXPIRED' : session.status,
        openedAt: session.openedAt || now,
        consentAt: session.consentAt,
        trackingStartedAt: session.trackingStartedAt,
        expiresAt: session.expiresAt,
        senderName: session.user.name,
        image: session.image,
      },
    });
  } catch (err) {
    console.error('Public session error:', err);
    return res.status(500).json({ error: 'Failed to load tracking session' });
  }
}
