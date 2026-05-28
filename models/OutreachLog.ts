import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOutreachLog extends Document {
  contactId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  type: 'email' | 'call' | 'meeting' | 'note';
  subject?: string;
  body?: string;
  sentAt: Date;
  userId: string;
}

const OutreachLogSchema = new Schema<IOutreachLog>(
  {
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    type: { type: String, enum: ['email', 'call', 'meeting', 'note'], required: true },
    subject: { type: String },
    body: { type: String },
    sentAt: { type: Date, default: Date.now },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

OutreachLogSchema.index({ contactId: 1 });
OutreachLogSchema.index({ userId: 1, sentAt: -1 });

const OutreachLog: Model<IOutreachLog> =
  mongoose.models.OutreachLog ?? mongoose.model<IOutreachLog>('OutreachLog', OutreachLogSchema);

export default OutreachLog;
