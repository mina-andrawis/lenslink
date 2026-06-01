export interface PricingRate {
  shootType: string;
  hourlyRate: number;
  rateLabel?: string;  // overrides "$X/hr" display when set (e.g. flat fees)
  deliveryCap: string;
  notes: string;
}

export interface PricingPillar {
  name: string;
  description: string;
  rates: PricingRate[];
}

export const PRICING_PILLARS: PricingPillar[] = [
  {
    name: 'Couples & Weddings',
    description: 'Milestone moments, beautifully documented.',
    rates: [
      { shootType: 'Proposal',  hourlyRate: 250, deliveryCap: '20–30 total images', notes: 'Private setups, scouting assistance, and curated fast delivery.' },
      { shootType: 'Couples',   hourlyRate: 125, deliveryCap: '20–30 images/hr',    notes: 'On-location couple portraits and engagement sessions.' },
      { shootType: 'Wedding',   hourlyRate: 250, deliveryCap: '40–50 images/hr',    notes: 'Intimate weddings and elopements. Full or partial day. Minimum 4-hour booking.' },
    ],
  },
  {
    name: 'Portraits & Creative Branding',
    description: 'Editorial work for individuals and growing brands.',
    rates: [
      { shootType: 'Portraits & Headshots', hourlyRate: 175, deliveryCap: '10–15 images/hr', notes: 'Corporate headshots, creative profiles, and editorial portraits.' },
      { shootType: 'Branding',              hourlyRate: 175, deliveryCap: '10–20 images/hr', notes: 'Environmental portraiture for local creators and small businesses.' },
      { shootType: 'Graduation',            hourlyRate: 150, deliveryCap: '15–20 images/hr', notes: 'Individual senior portraits on campus. 30-min session blocks.' },
    ],
  },
  {
    name: 'Events & Live Music',
    description: 'High-energy coverage for every occasion.',
    rates: [
      { shootType: 'Events & Live Music', hourlyRate: 150, deliveryCap: '25–35 images/hr', notes: 'Parties, corporate gatherings, festivals, and local music coverage.' },
    ],
  },
  {
    name: 'Commercial & Real Estate',
    description: 'Clean, professional listing and property photography.',
    rates: [
      { shootType: 'Real Estate', hourlyRate: 100, rateLabel: '$100 flat', deliveryCap: '20+ final frames', notes: 'Flat baseline for listings up to 2,000 sq ft. Standard residential and rental properties.' },
    ],
  },
];

// Maps Shoot model types to PricingRate.shootType values
export const SHOOT_TYPE_TO_PRICING: Record<string, string> = {
  Proposal:        'Proposal',
  Couples:         'Couples',
  Wedding:         'Wedding',
  Portrait:        'Portraits & Headshots',
  Headshots:       'Portraits & Headshots',
  Branding:        'Branding',
  Graduation:      'Graduation',
  Event:           'Events & Live Music',
  'Real Estate':   'Real Estate',
};
