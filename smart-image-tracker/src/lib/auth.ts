import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { parse, serialize } from 'cookie';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'smart-tracker-super-secret-jwt-key-2026';
const TOKEN_COOKIE_NAME = 'st_auth_token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function setAuthCookie(res: NextApiResponse, token: string) {
  const cookie = serialize(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
  res.setHeader('Set-Cookie', cookie);
}

export function removeAuthCookie(res: NextApiResponse) {
  const cookie = serialize(TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  res.setHeader('Set-Cookie', cookie);
}

export async function getAuthUser(req: NextApiRequest) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[TOKEN_COOKIE_NAME];
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, mobile: true, role: true, status: true }
  });

  if (!user || user.status === 'DISABLED') return null;

  return user;
}
