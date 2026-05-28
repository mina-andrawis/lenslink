import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShoot extends Document {
  shootId: string;
  date: Date;
  contactName: string;
  companyName?: string;
  type: string;
  contractSigned?: boolean | null;
  shootDuration?: number;
  editingTime?: number;
  feeCharged?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentDate?: Date;
  deliverByDate?: Date;
  deliveryLink?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShootSchema = new Schema<IShoot>(
  {
    shootId: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    contactName: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    type: {
      type: String,
      enum: ['Proposal', 'Branding', 'Event', 'Graduation', 'Real Estate', 'Family Photoshoot', 'Portrait', 'Headshots'],
      required: true,
    },
    contractSigned: { type: Boolean, default: null },
    shootDuration: { type: Number },
    editingTime: { type: Number },
    feeCharged: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['paid', 'unpaid', 'pending', 'trade'], default: 'unpaid' },
    paymentMethod: { type: String, trim: true },
    paymentDate: { type: Date },
    deliverByDate: { type: Date },
    deliveryLink: { type: String, trim: true },
    notes: { type: String },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

ShootSchema.index({ userId: 1, date: -1 });
ShootSchema.index({ userId: 1, type: 1 });

const Shoot: Model<IShoot> =
  mongoose.models.Shoot ?? mongoose.model<IShoot>('Shoot', ShootSchema);

export default Shoot;
