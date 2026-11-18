import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  if (req.method === 'GET') {
    try {
      const session = await prisma.trackingSession.findUnique({
        where: { id },
        include: {
          image: true,
          locationPoints: {
            orderBy: { timestamp: 'asc' },
          },
          consentLogs: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (!isSuperAdmin && session.userId !== user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Check auto-expiry
      if (new Date() > session.expiresAt && session.status !== 'EXPIRED' && session.status !== 'TRACKING_STOPPED') {
        const updated = await prisma.trackingSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED' },
          include: {
            image: true,
            locationPoints: { orderBy: { timestamp: 'asc' } },
            consentLogs: { orderBy: { createdAt: 'desc' } },
          },
        });
        return res.status(200).json({ session: updated });
      }

      return res.status(200).json({ session });
    } catch (err) {
      console.error('Get session error:', err);
      return res.status(500).json({ error: 'Failed to fetch session detail' });
    }
  }

  if (req.method === 'POST') {
    const { action } = req.body;
    try {
      const session = await prisma.trackingSession.findUnique({ where: { id } });
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (!isSuperAdmin && session.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });

      if (action === 'stop') {
        const updated = await prisma.trackingSession.update({
          where: { id },
          data: {
            status: 'TRACKING_STOPPED',
            trackingStoppedAt: new Date(),
          },
        });

        // Notify socket listeners
        if ((global as any).io) {
          (global as any).io.to(`session:${session.id}`).emit('tracking_stopped', { sessionId: session.id });
        }

        await logAudit('SESSION_STOPPED_BY_SENDER', 'TrackingSession', id, user.id);
        return res.status(200).json({ session: updated });
      }

      if (action === 'expire') {
        const updated = await prisma.trackingSession.update({
          where: { id },
          data: {
            status: 'EXPIRED',
            expiresAt: new Date(),
          },
        });
        await logAudit('SESSION_EXPIRED_BY_SENDER', 'TrackingSession', id, user.id);
        return res.status(200).json({ session: updated });
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (err) {
      console.error('Session update action error:', err);
      return res.status(500).json({ error: 'Action failed' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const session = await prisma.trackingSession.findUnique({ where: { id } });
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (!isSuperAdmin && session.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });

      await prisma.trackingSession.delete({ where: { id } });
      await logAudit('SESSION_DELETED', 'TrackingSession', id, user.id);

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Delete session error:', err);
      return res.status(500).json({ error: 'Delete session failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
