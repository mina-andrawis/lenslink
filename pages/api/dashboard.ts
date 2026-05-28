import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import { getUserId } from '@/lib/auth-middleware';
import Contact from '@/models/Contact';
import Campaign from '@/models/Campaign';
import OutreachLog from '@/models/OutreachLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const userId = await getUserId(req, res);
  if (!userId) return;

  await connectDB();

  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const [
    totalContacts,
    statusCounts,
    overdueFollowups,
    upcomingFollowups,
    recentCampaigns,
    recentLogs,
  ] = await Promise.all([
    Contact.countDocuments({ userId }),
    Contact.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Contact.find({ userId, followUpDate: { $lt: now }, status: { $nin: ['past_client', 'not_interested'] } })
      .sort({ followUpDate: 1 })
      .limit(5),
    Contact.find({ userId, followUpDate: { $gte: now, $lte: sevenDaysFromNow }, status: { $nin: ['past_client', 'not_interested'] } })
      .sort({ followUpDate: 1 })
      .limit(5),
    Campaign.find({ userId }).sort({ createdAt: -1 }).limit(3),
    OutreachLog.find({ userId }).sort({ sentAt: -1 }).limit(10).populate('contactId', 'name email'),
  ]);

  const statusMap: Record<string, number> = {};
  for (const s of statusCounts) statusMap[s._id] = s.count;

  return res.status(200).json({
    totalContacts,
    statusMap,
    overdueFollowups,
    upcomingFollowups,
    recentCampaigns,
    recentLogs,
  });
}
