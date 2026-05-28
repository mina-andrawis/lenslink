export interface PricingRate {
  shootType: string;
  hourlyRate: number;
  deliveryCap: string;
  notes: string;
}

export interface PricingTier {
  name: string;
  trigger: string;
  rates: PricingRate[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Current Operational Rates',
    trigger: 'Active now — baseline rates',
    rates: [
      { shootType: 'Proposal',           hourlyRate: 225, deliveryCap: '20–30 images/hr', notes: 'Individual couples & private engagement setups.' },
      { shootType: 'Branding',           hourlyRate: 125, deliveryCap: '15–20 images/hr', notes: 'Local creators and small businesses needing social content.' },
      { shootType: 'Event',              hourlyRate: 100, deliveryCap: '30–40 images/hr', notes: 'Parties, small gigs, and local live music coverage.' },
      { shootType: 'Graduation',         hourlyRate: 150, deliveryCap: '15–25 images/hr', notes: 'Individual senior portraits on campus (30-min block).' },
      { shootType: 'Real Estate',        hourlyRate: 125, deliveryCap: '15–25 images/hr', notes: 'Standard residential listings and rental properties.' },
      { shootType: 'Family Photoshoot',  hourlyRate: 175, deliveryCap: '15–25 images/hr', notes: 'Outdoor or on-location family group portraits.' },
      { shootType: 'Portraits/Headshots',hourlyRate: 150, deliveryCap: '5–10 images/hr',  notes: 'Individual creative profiles or standard corporate headshots.' },
    ],
  },
  {
    name: 'Mid-Level Tier',
    trigger: 'Trigger: 15–20 paid shoots per category or full portfolio',
    rates: [
      { shootType: 'Proposal',           hourlyRate: 350, deliveryCap: '30–40 images/hr', notes: 'Trigger after building a dedicated gallery of 10+ high-end setups.' },
      { shootType: 'Branding',           hourlyRate: 200, deliveryCap: '20–35 images/hr', notes: 'Apply to established regional brands and marketing agencies.' },
      { shootType: 'Event',              hourlyRate: 175, deliveryCap: '40–50 images/hr', notes: 'Larger festival blocks or regional multi-day music coverage.' },
      { shootType: 'Graduation',         hourlyRate: 200, deliveryCap: '20–30 images/session', notes: 'Scaled rate for rapid execution across multiple campus landmarks.' },
      { shootType: 'Real Estate',        hourlyRate: 200, deliveryCap: '25–40 images/hr', notes: 'Mid-tier commercial listings and high-end residential spaces.' },
      { shootType: 'Family Photoshoot',  hourlyRate: 250, deliveryCap: '20–30 images/hr', notes: 'Accounts for increased culling time with larger group dynamics.' },
      { shootType: 'Portraits/Headshots',hourlyRate: 225, deliveryCap: '10–15 images/hr', notes: 'Advanced lookbooks and multi-outfit studio profiles.' },
    ],
  },
  {
    name: 'Senior Tier',
    trigger: 'Trigger: Flawless reputation, distinct style & premium accounts',
    rates: [
      { shootType: 'Proposal',           hourlyRate: 500, deliveryCap: '45+ images/hr', notes: 'Luxury high-end requests requiring rapid story delivery.' },
      { shootType: 'Branding',           hourlyRate: 300, deliveryCap: '40+ images/hr', notes: 'Commercial productions requiring advanced licensing and asset bundles.' },
      { shootType: 'Event',              hourlyRate: 250, deliveryCap: '60+ images/hr', notes: 'Premium large-scale festivals demanding rapid turnaround guarantees.' },
      { shootType: 'Graduation',         hourlyRate: 400, deliveryCap: '35+ images/session', notes: 'Premium fast-track campus packages with flawless styling control.' },
      { shootType: 'Real Estate',        hourlyRate: 300, deliveryCap: '40+ images/hr', notes: 'Luxury estates, HDR bracketing, and advanced media.' },
      { shootType: 'Family Photoshoot',  hourlyRate: 350, deliveryCap: '35–50 images/hr', notes: 'Premium style editing and deep group retouching workflows.' },
      { shootType: 'Portraits/Headshots',hourlyRate: 325, deliveryCap: '15–20 images/hr', notes: 'High-end editorial and executive corporate headshot accounts.' },
    ],
  },
];

// Maps shoot model types to pricing category names (Portrait + Headshots share one row)
export const SHOOT_TYPE_TO_PRICING: Record<string, string> = {
  Proposal:          'Proposal',
  Branding:          'Branding',
  Event:             'Event',
  Graduation:        'Graduation',
  'Real Estate':     'Real Estate',
  'Family Photoshoot': 'Family Photoshoot',
  Portrait:          'Portraits/Headshots',
  Headshots:         'Portraits/Headshots',
};
