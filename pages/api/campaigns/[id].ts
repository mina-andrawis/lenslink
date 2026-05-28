import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import Campaign from '@/models/Campaign';
import Contact from '@/models/Contact';
import OutreachLog from '@/models/OutreachLog';
import { sendEmail } from '@/lib/resend';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req, res);
  if (!userId) return;

  await connectDB();
  const { id } = req.query;

  const campaign = await Campaign.findOne({ _id: id, userId });
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  if (req.method === 'GET') return res.status(200).json(campaign);

  if (req.method === 'PUT') {
    const updated = await Campaign.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    await campaign.deleteOne();
    return res.status(200).json({ success: true });
  }

  // POST = send campaign
  if (req.method === 'POST') {
    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Campaign has already been sent' });
    }

    const contacts = await Contact.find({ _id: { $in: campaign.recipients }, userId });
    if (!contacts.length) {
      return res.status(400).json({ error: 'No valid recipients found' });
    }

    await Campaign.findByIdAndUpdate(id, { status: 'sending' });

    let sent = 0;
    let failed = 0;

    for (const contact of contacts) {
      try {
        await sendEmail({
          to: contact.email,
          subject: campaign.subject,
          html: campaign.body.replace(/{{name}}/g, contact.name),
        });

        await OutreachLog.create({
          contactId: contact._id,
          campaignId: campaign._id,
          type: 'email',
          subject: campaign.subject,
          body: campaign.body,
          sentAt: new Date(),
          userId,
        });

        await Contact.findByIdAndUpdate(contact._id, { lastContactedAt: new Date() });
        sent++;
      } catch {
        failed++;
      }
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      id,
      {
        status: failed === contacts.length ? 'failed' : 'sent',
        sentAt: new Date(),
        stats: { total: contacts.length, sent, failed },
      },
      { new: true }
    );

    return res.status(200).json(updatedCampaign);
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
