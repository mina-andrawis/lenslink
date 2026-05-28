import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import Template from '@/models/Template';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  await connectDB();
  const { id } = req.query;

  const template = await Template.findOne({ _id: id, userId });
  if (!template) return res.status(404).json({ error: 'Template not found' });

  if (req.method === 'GET') return res.status(200).json(template);

  if (req.method === 'PUT') {
    const updated = await Template.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    await template.deleteOne();
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
