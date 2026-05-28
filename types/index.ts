export type ContactStatus =
  | 'lead'
  | 'contacted'
  | 'proposal_sent'
  | 'booked'
  | 'past_client'
  | 'not_interested';

export type ContactType = 'prospect' | 'client';

export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  type: ContactType;
  status: ContactStatus;
  businessName?: string;
  notes?: string;
  lastContactedAt?: string;
  followUpDate?: string;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  _id: string;
  name: string;
  subject: string;
  body: string;
  category?: string;
  userId: string;
  createdAt: string;
}

export type CampaignStatus = 'draft' | 'sending' | 'sent' | 'failed';

export interface Campaign {
  _id: string;
  name: string;
  subject: string;
  body: string;
  recipients: string[];
  status: CampaignStatus;
  sentAt?: string;
  userId: string;
  createdAt: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
  };
}

export interface OutreachLog {
  _id: string;
  contactId: string;
  campaignId?: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  subject?: string;
  body?: string;
  sentAt: string;
  userId: string;
}

export const PIPELINE_STAGES: { key: ContactStatus; label: string; color: string }[] = [
  { key: 'lead', label: 'Lead', color: 'bg-slate-100 text-slate-700' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: 'bg-amber-100 text-amber-700' },
  { key: 'booked', label: 'Booked', color: 'bg-green-100 text-green-700' },
  { key: 'past_client', label: 'Past Client', color: 'bg-purple-100 text-purple-700' },
  { key: 'not_interested', label: 'Not Interested', color: 'bg-red-100 text-red-700' },
];
