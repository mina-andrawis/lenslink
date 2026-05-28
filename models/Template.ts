import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  subject: string;
  body: string;
  category?: string;
  userId: string;
  createdAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    category: { type: String, trim: true },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

TemplateSchema.index({ userId: 1 });

const Template: Model<ITemplate> =
  mongoose.models.Template ?? mongoose.model<ITemplate>('Template', TemplateSchema);

export default Template;
