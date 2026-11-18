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
      let settings = await prisma.appSettings.findUnique({ where: { id: 'default' } });
      if (!settings) {
        settings = await prisma.appSettings.create({ data: { id: 'default' } });
      }
      return res.status(200).json({ settings });
    } catch (err) {
      console.error('Fetch settings error:', err);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'POST') {
    if (user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only Super Admin can update settings' });
    }

    try {
      const {
        defaultDurationMinutes,
        maxDurationMinutes,
        locationRetentionDays,
        imageRetentionDays,
        maxFileSizeMb,
        allowQrSharing,
        allowWhatsappSharing,
        enable2FA,
        mapProvider,
        privacyPolicyText,
      } = req.body;

      const updated = await prisma.appSettings.upsert({
        where: { id: 'default' },
        update: {
          defaultDurationMinutes: parseInt(defaultDurationMinutes || '60', 10),
          maxDurationMinutes: parseInt(maxDurationMinutes || '1440', 10),
          locationRetentionDays: parseInt(locationRetentionDays || '30', 10),
          imageRetentionDays: parseInt(imageRetentionDays || '90', 10),
          maxFileSizeMb: parseInt(maxFileSizeMb || '10', 10),
          allowQrSharing: Boolean(allowQrSharing),
          allowWhatsappSharing: Boolean(allowWhatsappSharing),
          enable2FA: Boolean(enable2FA),
          mapProvider: mapProvider || 'OpenStreetMap',
          privacyPolicyText: privacyPolicyText || '',
        },
        create: {
          id: 'default',
          defaultDurationMinutes: parseInt(defaultDurationMinutes || '60', 10),
          maxDurationMinutes: parseInt(maxDurationMinutes || '1440', 10),
          locationRetentionDays: parseInt(locationRetentionDays || '30', 10),
          imageRetentionDays: parseInt(imageRetentionDays || '90', 10),
          maxFileSizeMb: parseInt(maxFileSizeMb || '10', 10),
          allowQrSharing: Boolean(allowQrSharing),
          allowWhatsappSharing: Boolean(allowWhatsappSharing),
          enable2FA: Boolean(enable2FA),
          mapProvider: mapProvider || 'OpenStreetMap',
          privacyPolicyText: privacyPolicyText || '',
        },
      });

      await logAudit('SETTINGS_UPDATED', 'AppSettings', 'default', user.id);

      return res.status(200).json({ settings: updated, message: 'Settings saved successfully' });
    } catch (err) {
      console.error('Update settings error:', err);
      return res.status(500).json({ error: 'Failed to save settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
