import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import Shoot from '@/models/Shoot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  await connectDB();

  if (req.method === 'GET') {
    const { type } = req.query;
    const query: Record<string, unknown> = { userId };
    if (type) query.type = type;
    const shoots = await Shoot.find(query).sort({ date: -1 });
    return res.status(200).json(shoots);
  }

  if (req.method === 'POST') {
    const shoot = await Shoot.create({ ...req.body, userId });
    return res.status(201).json(shoot);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
