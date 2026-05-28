import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import Contact from '@/models/Contact';
import OutreachLog from '@/models/OutreachLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  await connectDB();
  const { id } = req.query;

  const contact = await Contact.findOne({ _id: id, userId });
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  if (req.method === 'GET') {
    const logs = await OutreachLog.find({ contactId: id }).sort({ sentAt: -1 }).limit(50);
    return res.status(200).json({ contact, logs });
  }

  if (req.method === 'PUT') {
    const updated = await Contact.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    await contact.deleteOne();
    await OutreachLog.deleteMany({ contactId: id });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
