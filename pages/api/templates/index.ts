import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import Template from '@/models/Template';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  await connectDB();

  if (req.method === 'GET') {
    const templates = await Template.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(templates);
  }

  if (req.method === 'POST') {
    const template = await Template.create({ ...req.body, userId });
    return res.status(201).json(template);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
