import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email: string;
  phone?: string;
  type: 'prospect' | 'client' | 'photographer';
  status: 'lead' | 'contacted' | 'proposal_sent' | 'booked' | 'past_client' | 'not_interested';
  businessName?: string;
  instagram?: string;
  website?: string;
  specialty?: string;
  city?: string;
  notes?: string;
  lastContactedAt?: Date;
  followUpDate?: Date;
  eventDate?: Date;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    type: { type: String, enum: ['prospect', 'client', 'photographer'], default: 'prospect' },
    status: {
      type: String,
      enum: ['lead', 'contacted', 'proposal_sent', 'booked', 'past_client', 'not_interested'],
      default: 'lead',
    },
    businessName: { type: String, trim: true },
    instagram: { type: String, trim: true },
    website: { type: String, trim: true },
    specialty: { type: String, trim: true },
    city: { type: String, trim: true },
    notes: { type: String },
    lastContactedAt: { type: Date },
    followUpDate: { type: Date },
    eventDate: { type: Date },
    tags: [{ type: String }],
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

ContactSchema.index({ userId: 1, status: 1 });
ContactSchema.index({ userId: 1, followUpDate: 1 });

const Contact: Model<IContact> =
  mongoose.models.Contact ?? mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;
