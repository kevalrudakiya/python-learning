import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { generateQRCodeDataUrl } from '@/lib/qr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      const sessions = await prisma.trackingSession.findMany({
        where: isSuperAdmin ? {} : { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          image: {
            select: { title: true, fileUrl: true },
          },
          locationPoints: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });
      return res.status(200).json({ sessions });
    } catch (err) {
      console.error('Fetch sessions error:', err);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { imageId, recipientLabel, purpose, durationMinutes } = req.body;

      if (!imageId || !recipientLabel) {
        return res.status(400).json({ error: 'imageId and recipientLabel are required' });
      }

      const duration = parseInt(durationMinutes || '60', 10);
      const expiresAt = new Date(Date.now() + duration * 60 * 1000);

      // Generate cryptographically secure random session ID & token
      const randomShort = crypto.randomBytes(3).toString('hex').toUpperCase();
      const publicSessionId = `LOC-${randomShort}`;
      const randomTokenHex = crypto.randomBytes(16).toString('hex');
      const secureToken = `${randomShort}-${randomTokenHex}`;

      const session = await prisma.trackingSession.create({
        data: {
          userId: user.id,
          imageId,
          publicSessionId,
          secureToken,
          recipientLabel,
          purpose: purpose || null,
          durationMinutes: duration,
          status: 'CREATED',
          expiresAt,
        },
        include: {
          image: true,
        },
      });

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host || 'localhost:3000';
      const shareUrl = `${protocol}://${host}/s/${secureToken}`;

      const qrCodeDataUrl = await generateQRCodeDataUrl(shareUrl);

      await logAudit('SESSION_CREATED', 'TrackingSession', session.id, user.id, {
        publicSessionId,
        recipientLabel,
        durationMinutes: duration,
      });

      return res.status(201).json({
        session,
        shareUrl,
        qrCodeDataUrl,
      });
    } catch (err) {
      console.error('Create tracking session error:', err);
      return res.status(500).json({ error: 'Failed to create tracking session' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
