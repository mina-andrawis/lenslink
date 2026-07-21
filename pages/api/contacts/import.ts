import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import Contact from '@/models/Contact';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await connectDB();

  const { contacts } = req.body;
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: 'contacts array is required' });
  }

  const docs = contacts.map((c: Record<string, unknown>) => ({ ...c, userId }));
  const result = await Contact.insertMany(docs, { ordered: false });
  return res.status(201).json({ inserted: result.length });
}
