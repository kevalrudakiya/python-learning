import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      const images = await prisma.image.findMany({
        where: isSuperAdmin ? {} : { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          sessions: {
            select: { id: true, status: true, publicSessionId: true },
          },
        },
      });
      return res.status(200).json({ images });
    } catch (err) {
      console.error('Fetch images error:', err);
      return res.status(500).json({ error: 'Failed to fetch images' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, campaign, recipientName, internalNotes, fileUrl, mimeType } = req.body;

      if (!title || !fileUrl) {
        return res.status(400).json({ error: 'Title and fileUrl are required' });
      }

      const image = await prisma.image.create({
        data: {
          userId: user.id,
          title,
          description: description || null,
          campaign: campaign || null,
          recipientName: recipientName || null,
          internalNotes: internalNotes || null,
          fileUrl,
          mimeType: mimeType || 'image/png',
        },
      });

      await logAudit('IMAGE_CREATED', 'Image', image.id, user.id, { title: image.title });

      return res.status(201).json({ image });
    } catch (err) {
      console.error('Create image error:', err);
      return res.status(500).json({ error: 'Failed to create image' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
