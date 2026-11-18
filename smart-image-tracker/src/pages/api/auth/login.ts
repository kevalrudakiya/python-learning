import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { loginIdentifier, password } = req.body;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: 'Email/Mobile and password are required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: loginIdentifier }, { mobile: loginIdentifier }],
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({ error: 'Account has been disabled. Please contact admin.' });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, token);

    await logAudit('USER_LOGIN', 'User', user.id, user.id, { email: user.email, role: user.role });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
