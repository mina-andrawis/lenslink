#!/usr/bin/env node
// One-time import of shoot history from spreadsheet
// Usage: node --env-file=.env.local scripts/import-shoots.js

const mongoose = require('mongoose');

const USER_ID = '1slJLYTb6yOIa9CbuHU3iBfsiGr2';

const ShootSchema = new mongoose.Schema(
  {
    shootId: String,
    date: Date,
    contactName: String,
    companyName: String,
    type: String,
    contractSigned: { type: Boolean, default: null },
    shootDuration: Number,
    editingTime: Number,
    feeCharged: Number,
    paymentStatus: String,
    paymentMethod: String,
    paymentDate: Date,
    deliverByDate: Date,
    deliveryLink: String,
    notes: String,
    userId: String,
  },
  { timestamps: true }
);

const Shoot = mongoose.model('Shoot', ShootSchema);

const shoots = [
  {
    shootId: 'S-0001', date: new Date('2025-09-08'),
    contactName: 'Cheyenne & Josie', companyName: null,
    type: 'Proposal', contractSigned: true,
    shootDuration: 1, editingTime: 2, feeCharged: 225,
    paymentStatus: 'paid', paymentMethod: 'Zelle', paymentDate: new Date('2025-08-25'),
    deliverByDate: new Date('2025-09-15'),
    deliveryLink: null,
    notes: 'Josie & Cheyenne by Photos With Mina',
    userId: USER_ID,
  },
  {
    shootId: 'S-0002', date: new Date('2025-08-31'),
    contactName: 'Maddie', companyName: 'Share House',
    type: 'Branding', contractSigned: true,
    shootDuration: 2, editingTime: 4, feeCharged: 200,
    paymentStatus: 'paid', paymentMethod: 'Gift Card', paymentDate: new Date('2025-09-03'),
    deliverByDate: new Date('2025-09-07'),
    deliveryLink: 'https://photoswithmina.pixieset.com/sharehouse/',
    userId: USER_ID,
  },
  {
    shootId: 'S-0003', date: new Date('2025-09-11'),
    contactName: 'Red Right Return', companyName: 'Red Right Return',
    type: 'Event', contractSigned: null,
    shootDuration: 2.5, editingTime: 6, feeCharged: 100,
    paymentStatus: 'paid', paymentMethod: 'Venmo', paymentDate: new Date('2025-11-09'),
    deliverByDate: new Date('2025-11-16'),
    deliveryLink: 'https://photoswithmina.pixieset.com/redrightreturnwedding/',
    userId: USER_ID,
  },
  {
    shootId: 'S-0004', date: new Date('2025-12-07'),
    contactName: 'Landon Kearney', companyName: null,
    type: 'Graduation', contractSigned: true,
    shootDuration: 0.5, editingTime: 1, feeCharged: 115,
    paymentStatus: 'paid', paymentMethod: 'Venmo', paymentDate: new Date('2025-11-15'),
    deliverByDate: new Date('2025-12-14'),
    deliveryLink: 'https://photoswithmina.pixieset.com/landongradphotos/',
    notes: '$75 + $40 tip',
    userId: USER_ID,
  },
  {
    shootId: 'S-0005', date: new Date('2026-01-10'),
    contactName: 'Rachel', companyName: 'PH Clothing Co',
    type: 'Branding', contractSigned: null,
    shootDuration: 3, editingTime: 6, feeCharged: 0,
    paymentStatus: 'trade',
    deliverByDate: new Date('2026-01-17'),
    deliveryLink: 'https://photoswithmina.pixieset.com/phclothingcoshoot/',
    userId: USER_ID,
  },
  {
    shootId: 'S-0006', date: new Date('2026-02-07'),
    contactName: 'Leah Thompson', companyName: 'Galentines Party',
    type: 'Event', contractSigned: true,
    shootDuration: 1, editingTime: 2, feeCharged: 90,
    paymentStatus: 'paid', paymentMethod: 'Venmo', paymentDate: new Date('2026-01-23'),
    deliverByDate: new Date('2026-02-14'),
    deliveryLink: 'https://photoswithmina.pixieset.com/leahsgalentinesparty/',
    userId: USER_ID,
  },
  {
    shootId: 'S-0007', date: new Date('2026-02-15'),
    contactName: 'Leah Thompson', companyName: 'Opulent Properties LLC',
    type: 'Real Estate', contractSigned: true,
    shootDuration: 1, editingTime: 2, feeCharged: 75,
    paymentStatus: 'paid', paymentMethod: 'Venmo', paymentDate: new Date('2026-01-23'),
    deliverByDate: new Date('2026-02-15'),
    notes: '$165 total payment (combined with S-0006)',
    userId: USER_ID,
  },
  {
    shootId: 'S-0008', date: new Date('2026-02-07'),
    contactName: 'Kyle Martin', companyName: 'Kilted Forge Studio',
    type: 'Branding', contractSigned: true,
    shootDuration: 1, editingTime: 2, feeCharged: 0,
    paymentStatus: 'trade',
    deliverByDate: new Date('2026-02-07'),
    userId: USER_ID,
  },
  {
    shootId: 'S-0009', date: new Date('2026-01-24'),
    contactName: 'Hermel Rosa', companyName: 'Postnet Printing',
    type: 'Branding', contractSigned: true,
    shootDuration: 1, editingTime: 2, feeCharged: 0,
    paymentStatus: 'trade',
    deliverByDate: new Date('2026-01-31'),
    deliveryLink: 'https://photoswithmina.pixieset.com/postnetshoot/',
    userId: USER_ID,
  },
  {
    shootId: 'S-0010', date: new Date('2026-02-01'),
    contactName: 'Ranata Brown', companyName: null,
    type: 'Portrait', contractSigned: true,
    shootDuration: 1, editingTime: 2, feeCharged: 0,
    paymentStatus: 'unpaid',
    deliverByDate: new Date('2026-02-08'),
    userId: USER_ID,
  },
  {
    shootId: 'S-0011', date: new Date('2026-02-13'),
    contactName: 'Ashley Cody', companyName: 'Top Shelf Catering',
    type: 'Event', contractSigned: null,
    shootDuration: 1, editingTime: 2, feeCharged: 0,
    paymentStatus: 'unpaid',
    deliverByDate: new Date('2026-02-20'),
    userId: USER_ID,
  },
  {
    shootId: 'S-0012', date: new Date('2026-02-15'),
    contactName: 'Leah Thompson', companyName: 'Opulent Properties LLC',
    type: 'Branding', contractSigned: true,
    shootDuration: 0.75, editingTime: 1.5, feeCharged: 110,
    paymentStatus: 'paid', paymentMethod: 'Venmo', paymentDate: new Date('2026-02-11'),
    deliverByDate: new Date('2026-02-22'),
    userId: USER_ID,
  },
  {
    shootId: 'S-0013', date: new Date('2026-02-16'),
    contactName: 'Tracey Bui', companyName: null,
    type: 'Headshots', contractSigned: true,
    shootDuration: 0.5, editingTime: 1, feeCharged: 75,
    paymentStatus: 'paid',
    deliverByDate: new Date('2026-02-23'),
    userId: USER_ID,
  },
  {
    shootId: 'S-0014', date: new Date('2026-02-26'),
    contactName: 'Chris Taylor', companyName: 'Ripple',
    type: 'Branding', contractSigned: null,
    shootDuration: 2, editingTime: 2, feeCharged: 0,
    paymentStatus: 'trade',
    deliveryLink: 'https://photoswithmina.pixieset.com/ripplesurfcobrandingshoot/',
    userId: USER_ID,
  },
  {
    shootId: 'S-0015', date: new Date('2026-06-06'),
    contactName: 'Leah Thompson', companyName: null,
    type: 'Event', contractSigned: true,
    shootDuration: 2, feeCharged: 200,
    paymentStatus: 'paid', paymentMethod: 'Venmo', paymentDate: new Date('2026-03-16'),
    userId: USER_ID,
  },
];

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI not found. Run with: node --env-file=.env.local scripts/import-shoots.js');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);

  console.log(`Inserting ${shoots.length} shoots...`);
  const result = await Shoot.insertMany(shoots);
  console.log(`✓ Done — imported ${result.length} shoots.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  mongoose.disconnect();
  process.exit(1);
});
