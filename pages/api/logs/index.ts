import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import OutreachLog from '@/models/OutreachLog';
import Contact from '@/models/Contact';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  await connectDB();

  if (req.method === 'POST') {
    const { contactId, type, subject, body } = req.body;
    if (!contactId || !type) return res.status(400).json({ error: 'contactId and type are required' });

    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const log = await OutreachLog.create({ contactId, type, subject, body, sentAt: new Date(), userId });

    await Contact.findByIdAndUpdate(contactId, { lastContactedAt: new Date() });

    return res.status(201).json(log);
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
