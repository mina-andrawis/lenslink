import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserId } from '@/lib/auth-middleware';
import { connectDB } from '@/lib/mongodb';
import UserSettings from '@/models/UserSettings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  await connectDB();

  if (req.method === 'GET') {
    const settings = await UserSettings.findOne({ userId }).lean();
    return res.status(200).json({ writingStyle: (settings as any)?.writingStyle ?? '' });
  }

  if (req.method === 'PUT') {
    const { writingStyle } = req.body as { writingStyle: string };
    await UserSettings.findOneAndUpdate(
      { userId },
      { writingStyle },
      { upsert: true, new: true }
    );
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
