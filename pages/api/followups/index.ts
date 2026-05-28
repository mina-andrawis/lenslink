import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import Contact from '@/models/Contact';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  await connectDB();

  if (req.method === 'GET') {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const overdue = await Contact.find({
      userId,
      followUpDate: { $lt: now },
      status: { $nin: ['past_client', 'not_interested'] },
    }).sort({ followUpDate: 1 });

    const upcoming = await Contact.find({
      userId,
      followUpDate: { $gte: now, $lte: sevenDaysFromNow },
      status: { $nin: ['past_client', 'not_interested'] },
    }).sort({ followUpDate: 1 });

    return res.status(200).json({ overdue, upcoming });
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
