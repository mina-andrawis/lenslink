import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import Contact from '@/models/Contact';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  await connectDB();

  if (req.method === 'GET') {
    const { status, type, search } = req.query;
    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
      ];
    }
    const contacts = await Contact.find(query).sort({ updatedAt: -1 });
    return res.status(200).json(contacts);
  }

  if (req.method === 'POST') {
    const contact = await Contact.create({ ...req.body, userId });
    return res.status(201).json(contact);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
