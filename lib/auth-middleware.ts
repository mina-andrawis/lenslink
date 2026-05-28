import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from './firebase-admin';

export async function getUserId(req: NextApiRequest, res: NextApiResponse): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}
