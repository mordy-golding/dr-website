// Sample data for the hero "Program account" card (from DR_POOL in Main.dc.html).

export interface Payee {
  role: string;
  place: string;
  amount: number;
}

export interface Row {
  p: number; // index into POOL
  status: 'onboarding' | 'approved' | 'paid';
  flash: boolean;
}

export const POOL: Payee[] = [
  { role: 'Creator', place: 'São Paulo, BR', amount: 1200 },
  { role: 'Event speaker', place: 'Austin, US', amount: 2500 },
  { role: 'User group', place: 'Lagos, NG', amount: 800 },
  { role: 'Instructor', place: 'Kraków, PL', amount: 1500 },
  { role: 'Livestream host', place: 'Toronto, CA', amount: 1800 },
  { role: 'Community partner', place: 'Manila, PH', amount: 650 },
  { role: 'Creator', place: 'Berlin, DE', amount: 2200 },
  { role: 'Training partner', place: 'Nairobi, KE', amount: 3000 },
  { role: 'Event speaker', place: 'London, UK', amount: 2750 },
  { role: 'Ambassador', place: 'Mexico City, MX', amount: 900 },
  { role: 'Nonprofit', place: 'Denver, US', amount: 1250 },
  { role: 'One-person studio', place: 'Lisbon, PT', amount: 1600 },
];

export const FUNDED = 250000;
export const START = 184250;

export const INITIAL_ROWS: Row[] = [
  { p: 3, status: 'onboarding', flash: false },
  { p: 2, status: 'approved', flash: false },
  { p: 1, status: 'paid', flash: false },
  { p: 0, status: 'paid', flash: false },
];

export const formatMoney = (n: number) => '$' + n.toLocaleString('en-US');
