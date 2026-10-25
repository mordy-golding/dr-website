import type { APIRoute } from 'astro';
import {
  RESEND_API_KEY,
  CONTACT_TO_EMAIL,
  CONTACT_FROM_EMAIL,
  TURNSTILE_SECRET_KEY,
} from 'astro:env/server';

// Runs on demand as a Vercel Function; every other page is static.
export const prerender = false;

const VOLUMES: Record<string, string> = {
  'under-50': 'Under 50',
  '50-200': '50–200',
  '200-500': '200–500',
  '500-plus': '500+',
};

const LOCATIONS: Record<string, string> = {
  us: 'U.S. only',
  intl: 'Outside the U.S.',
  both: 'Both',
};

const MIN_FILL_MS = 2500;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

// Best-effort per-instance limiter. The Vercel Firewall rate-limit rule on
// /api/contact is the durable limit; this catches bursts that reach one instance.
const recent = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > RATE_LIMIT;
}

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const field = (form: FormData, name: string, max: number) =>
  String(form.get(name) ?? '').trim().slice(0, max);

const singleLine = (s: string) => s.replace(/[\r\n]+/g, ' ');

async function verifyTurnstile(token: string, ip: string) {
  if (!TURNSTILE_SECRET_KEY) {
    if (import.meta.env.DEV) return true;
    console.error('contact: TURNSTILE_SECRET_KEY is not set');
    return false;
  }
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  return data.success === true;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let ip = 'unknown';
  try {
    ip = clientAddress;
  } catch {}

  if (rateLimited(ip)) {
    return json({ ok: false, error: 'Too many messages from your connection. Please try again later.' }, 429);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Please fill in the form and try again.' }, 400);
  }

  // Honeypot: pretend success so bots don't learn to avoid it.
  if (field(form, 'website', 200)) return json({ ok: true });

  const started = Number(form.get('started'));
  if (!started || Date.now() - started < MIN_FILL_MS) {
    return json({ ok: false, error: 'That was quick! Please wait a moment and try again.' }, 400);
  }

  const name = singleLine(field(form, 'name', 200));
  const company = singleLine(field(form, 'company', 200));
  const email = singleLine(field(form, 'email', 254));
  const volume = VOLUMES[field(form, 'volume', 20)] ?? 'Not answered';
  const where = LOCATIONS[field(form, 'where', 20)] ?? 'Not answered';
  const notes = field(form, 'notes', 5000);

  if (!name || !company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Please enter your name, company, and a valid work email.' }, 400);
  }

  if (!(await verifyTurnstile(field(form, 'cf-turnstile-response', 4096), ip))) {
    return json({ ok: false, error: 'We couldn’t confirm you’re not a bot. Please try again.' }, 400);
  }

  const text = [
    `Name: ${name}`,
    `Company: ${company}`,
    `Work email: ${email}`,
    `Payments per quarter: ${volume}`,
    `Where are your payees?: ${where}`,
    '',
    'Anything else?',
    notes || '(nothing added)',
  ].join('\n');

  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) {
    if (import.meta.env.DEV) {
      console.log('contact (dev, not sent):\n' + text);
      return json({ ok: true });
    }
    console.error('contact: RESEND_API_KEY or CONTACT_TO_EMAIL is not set');
    return json({ ok: false }, 500);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL || 'Design Responsibly website <website@designresponsibly.com>',
      to: [CONTACT_TO_EMAIL],
      reply_to: email,
      subject: `Website inquiry: ${name}, ${company}`,
      text,
    }),
  });

  if (!res.ok) {
    console.error('contact: Resend error', res.status, await res.text().catch(() => ''));
    return json({ ok: false }, 502);
  }

  return json({ ok: true });
};
