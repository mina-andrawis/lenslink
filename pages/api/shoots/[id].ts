import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import Shoot from '@/models/Shoot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  const { id } = req.query;
  await connectDB();

  const shoot = await Shoot.findOne({ _id: id, userId });
  if (!shoot) return res.status(404).json({ error: 'Shoot not found' });

  if (req.method === 'GET') {
    return res.status(200).json(shoot);
  }

  if (req.method === 'PUT') {
    const updated = await Shoot.findOneAndUpdate(
      { _id: id, userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    await Shoot.deleteOne({ _id: id, userId });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
