#!/usr/bin/env node
// One-time import script — run after filling in USER_ID below
// Usage: node --env-file=.env.local scripts/import-contacts.js

const mongoose = require('mongoose');

// ⚠️  Paste your Firebase UID here (Firebase Console → Authentication → Users → click your user)
const USER_ID = '1slJLYTb6yOIa9CbuHU3iBfsiGr2';

if (USER_ID === 'REPLACE_WITH_YOUR_FIREBASE_UID') {
  console.error('Error: replace USER_ID in this script before running.');
  process.exit(1);
}

const ContactSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    type: String,
    status: String,
    businessName: String,
    notes: String,
    lastContactedAt: Date,
    followUpDate: Date,
    tags: [String],
    userId: String,
  },
  { timestamps: true }
);

const Contact = mongoose.model('Contact', ContactSchema);

const contacts = [
  // ── Past clients & booked from Shoots tab ─────────────────────────────────

  {
    name: 'Cheyenne & Josie',
    type: 'client',
    status: 'past_client',
    tags: ['Proposal'],
    lastContactedAt: new Date('2025-09-08'),
    notes: 'S-0001. Proposal shoot. Paid $225 via Zelle. Delivered: Josie & Cheyenne by Photos With Mina.',
    userId: USER_ID,
  },
  {
    name: 'Maddie',
    businessName: 'Share House',
    email: 'maddie@sharehousechs.com',
    type: 'client',
    status: 'past_client',
    tags: ['Branding', 'Event Venue'],
    lastContactedAt: new Date('2025-09-10'),
    notes: 'S-0002. Branding shoot. Paid $200 via Gift Card. Delivered: https://photoswithmina.pixieset.com/sharehouse/. Also contacted as event venue prospect (09/10/2025).',
    userId: USER_ID,
  },
  {
    name: 'Red Right Return',
    businessName: 'Red Right Return',
    type: 'client',
    status: 'past_client',
    tags: ['Event'],
    lastContactedAt: new Date('2025-09-11'),
    notes: 'S-0003. Event shoot. Paid $100 via Venmo. Delivered: https://photoswithmina.pixieset.com/redrightreturnwedding/',
    userId: USER_ID,
  },
  {
    name: 'Landon Kearney',
    type: 'client',
    status: 'past_client',
    tags: ['Graduation'],
    lastContactedAt: new Date('2025-12-07'),
    notes: 'S-0004. Graduation shoot. Paid $115 via Venmo ($75 base + $40 tip). Delivered: https://photoswithmina.pixieset.com/landongradphotos/',
    userId: USER_ID,
  },
  {
    name: 'Rachel',
    businessName: 'PH Clothing Co',
    type: 'client',
    status: 'past_client',
    tags: ['Branding'],
    lastContactedAt: new Date('2026-01-10'),
    notes: 'S-0005. Branding shoot. No payment recorded (trade/collab). Delivered: https://photoswithmina.pixieset.com/phclothingcoshoot/',
    userId: USER_ID,
  },
  {
    // Merged: 4 shoots (S-0006 Galentines, S-0007 Real Estate, S-0012 Branding, S-0015 upcoming Event)
    name: 'Leah Thompson',
    businessName: 'Opulent Properties LLC',
    type: 'client',
    status: 'booked',
    tags: ['Event', 'Real Estate', 'Branding'],
    lastContactedAt: new Date('2026-03-16'),
    followUpDate: new Date('2026-06-06'),
    notes: 'Multiple shoots: Galentines Event S-0006 $90 Venmo, Real Estate S-0007 $75 Venmo, Branding S-0012 $110 Venmo ($165 total that payment), Event S-0015 $200 Venmo paid. Upcoming shoot June 6 2026.',
    userId: USER_ID,
  },
  {
    name: 'Kyle Martin',
    businessName: 'Kilted Forge Studio',
    type: 'client',
    status: 'contacted',
    tags: ['Branding'],
    lastContactedAt: new Date('2026-02-07'),
    notes: 'S-0008. Branding shoot. No payment or delivery link recorded.',
    userId: USER_ID,
  },
  {
    name: 'Hermel Rosa',
    businessName: 'Postnet Printing',
    type: 'client',
    status: 'past_client',
    tags: ['Branding'],
    lastContactedAt: new Date('2026-01-24'),
    notes: 'S-0009. Branding shoot. No payment recorded (trade/collab). Delivered: https://photoswithmina.pixieset.com/postnetshoot/',
    userId: USER_ID,
  },
  {
    name: 'Ranata Brown',
    type: 'client',
    status: 'contacted',
    tags: ['Portrait'],
    lastContactedAt: new Date('2026-02-01'),
    notes: 'S-0010. Portrait shoot. No payment or delivery link recorded.',
    userId: USER_ID,
  },
  {
    name: 'Ashley Cody',
    businessName: 'Top Shelf Catering',
    type: 'client',
    status: 'contacted',
    tags: ['Event'],
    lastContactedAt: new Date('2026-02-13'),
    notes: 'S-0011. Event shoot. No payment or delivery link recorded.',
    userId: USER_ID,
  },
  {
    name: 'Tracey Bui',
    type: 'client',
    status: 'past_client',
    tags: ['Headshots'],
    lastContactedAt: new Date('2026-02-16'),
    notes: 'S-0013. Headshots. $75 charged. Payment status unclear in records.',
    userId: USER_ID,
  },
  {
    name: 'Chris Taylor',
    businessName: 'Ripple',
    type: 'client',
    status: 'past_client',
    tags: ['Branding'],
    lastContactedAt: new Date('2026-02-26'),
    notes: 'S-0014. Branding shoot. No payment recorded (trade/collab). Delivered: https://photoswithmina.pixieset.com/ripplesurfcobrandingshoot/',
    userId: USER_ID,
  },

  // ── Venue prospects from Outreach Dashboard tab ────────────────────────────

  {
    name: 'John',
    businessName: 'Pour House',
    email: 'john@pourhouse.com',
    type: 'prospect',
    status: 'contacted',
    tags: ['Event Venue'],
    lastContactedAt: new Date('2025-09-12'),
    followUpDate: new Date('2025-09-19'),
    userId: USER_ID,
  },
  {
    name: 'Tin Roof',
    businessName: 'Tin Roof',
    type: 'prospect',
    status: 'lead',
    tags: ['Event Venue'],
    lastContactedAt: new Date('2025-09-15'),
    userId: USER_ID,
  },
  {
    name: 'The Charleston Pour House',
    businessName: 'The Charleston Pour House',
    type: 'prospect',
    status: 'lead',
    tags: ['Event Venue'],
    lastContactedAt: new Date('2025-09-15'),
    userId: USER_ID,
  },
  {
    name: 'R Pub',
    businessName: 'R Pub',
    type: 'prospect',
    status: 'lead',
    tags: ['Event Venue'],
    lastContactedAt: new Date('2025-09-15'),
    userId: USER_ID,
  },
  {
    name: 'Burns Alley Tavern',
    businessName: 'Burns Alley Tavern',
    type: 'prospect',
    status: 'lead',
    tags: ['Event Venue'],
    lastContactedAt: new Date('2025-09-15'),
    notes: 'Use website portal to contact.',
    userId: USER_ID,
  },
  {
    name: 'Prohibition',
    businessName: 'Prohibition',
    email: 'info@prohibitioncharleston.com',
    type: 'prospect',
    status: 'contacted',
    tags: ['Event Venue'],
    lastContactedAt: new Date('2025-09-15'),
    followUpDate: new Date('2025-09-22'),
    userId: USER_ID,
  },
  {
    name: 'The Royal American',
    businessName: 'The Royal American',
    email: 'jk@theroyalamerican.com',
    type: 'prospect',
    status: 'contacted',
    tags: ['Event Venue'],
    lastContactedAt: new Date('2025-09-15'),
    followUpDate: new Date('2025-09-22'),
    userId: USER_ID,
  },
  {
    name: "Henry's on the Market",
    businessName: "Henry's on the Market",
    email: 'info@henrysonthemarket.com',
    type: 'prospect',
    status: 'contacted',
    tags: ['Event Venue'],
    lastContactedAt: new Date('2025-09-15'),
    followUpDate: new Date('2025-09-22'),
    userId: USER_ID,
  },
  {
    name: 'The Refinery',
    businessName: 'The Refinery',
    email: 'info@therefinerychs.com',
    type: 'prospect',
    status: 'contacted',
    tags: ['Event Venue'],
    lastContactedAt: new Date('2025-09-15'),
    followUpDate: new Date('2025-09-22'),
    userId: USER_ID,
  },
  {
    name: 'Windjammer',
    businessName: 'Windjammer',
    email: 'Mgt@windjammeriop.com',
    type: 'prospect',
    status: 'contacted',
    tags: ['Event Venue'],
    lastContactedAt: new Date('2025-09-15'),
    followUpDate: new Date('2025-09-22'),
    notes: 'Use website portal to contact.',
    userId: USER_ID,
  },
];

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI not found. Run with: node --env-file=.env.local scripts/import-contacts.js');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);

  console.log(`Inserting ${contacts.length} contacts...`);
  const result = await Contact.insertMany(contacts);
  console.log(`✓ Done — imported ${result.length} contacts.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  mongoose.disconnect();
  process.exit(1);
});
