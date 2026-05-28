import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserSettings extends Document {
  userId: string;
  writingStyle: string;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: String, required: true, unique: true },
    writingStyle: { type: String, default: '' },
  },
  { timestamps: true }
);

const UserSettings: Model<IUserSettings> =
  mongoose.models.UserSettings ?? mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);

export default UserSettings;
