import { NextApiRequest, NextApiResponse } from 'next';
import { removeAuthCookie, getAuthUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUser(req);
  if (user) {
    await logAudit('USER_LOGOUT', 'User', user.id, user.id);
  }

  removeAuthCookie(res);
  return res.status(200).json({ success: true });
}
