import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaign extends Document {
  name: string;
  subject: string;
  body: string;
  recipients: string[];
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sentAt?: Date;
  userId: string;
  stats: { total: number; sent: number; failed: number };
  createdAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    recipients: [{ type: String }],
    status: {
      type: String,
      enum: ['draft', 'sending', 'sent', 'failed'],
      default: 'draft',
    },
    sentAt: { type: Date },
    userId: { type: String, required: true },
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

CampaignSchema.index({ userId: 1 });

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign ?? mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
