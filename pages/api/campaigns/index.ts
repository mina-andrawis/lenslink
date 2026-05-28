import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import Campaign from '@/models/Campaign';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  await connectDB();

  if (req.method === 'GET') {
    const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(campaigns);
  }

  if (req.method === 'POST') {
    const { recipients, ...rest } = req.body;
    const campaign = await Campaign.create({
      ...rest,
      recipients: recipients ?? [],
      userId,
      stats: { total: recipients?.length ?? 0, sent: 0, failed: 0 },
    });
    return res.status(201).json(campaign);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
