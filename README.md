# designresponsibly.com

Astro 6 site, deployed on Vercel from GitHub. Pages are static; the only server code is the contact form endpoint at `/api/contact` (a Vercel Function).

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Local dev server at `localhost:4321`         |
| `npm run build`   | Build for Vercel                             |
| `npx astro check` | Type-check                                   |

## Where things live

- `src/pages/index.astro`: homepage (copy, sections)
- `src/components/`: header, footer, logo, hero account card, contact form
- `src/content/legal/privacy-policy.md`: privacy policy text (rendered at `/legal/privacy-policy`)
- `src/pages/api/contact.ts`: contact form handler
- `src/styles/global.css`: colors and shared styles

## Contact form setup

The form posts to `/api/contact`, which checks it and emails it via [Resend](https://resend.com). The recipient address lives only in Vercel environment variables, never in the code.

In local dev with no keys set, submissions are printed to the terminal instead of sent.

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Value |
| :--- | :--- |
| `RESEND_API_KEY` | API key from Resend |
| `CONTACT_TO_EMAIL` | Where submissions go |
| `CONTACT_FROM_EMAIL` | Sender, on the verified domain, e.g. `Design Responsibly website <website@designresponsibly.com>` |
| `TURNSTILE_SECRET_KEY` | Secret key from Cloudflare Turnstile |
| `PUBLIC_TURNSTILE_SITE_KEY` | Site key from Cloudflare Turnstile (public) |

Redeploy after changing them. In production the form refuses to send if any of these are missing.

### One-time steps

1. **Resend:** add the domain `designresponsibly.com` in Resend and add the DNS records it shows (SPF/DKIM) at the domain's DNS host. Wait for "Verified", then create an API key.
2. **Turnstile:** in the Cloudflare dashboard → Turnstile → Add widget. Add hostnames `designresponsibly.com`, `www.designresponsibly.com`, and `vercel.app` (for preview deploys). The site does not need to be on Cloudflare.
3. **Rate limit:** in Vercel → Firewall, add a rate-limit rule: path equals `/api/contact`, method POST, 5 requests per 10 minutes per IP. The function also limits bursts on its own, but that limit isn't shared across server instances.

### Spam protection

- Hidden honeypot field
- Rejects forms submitted within 2.5 seconds of page load
- Cloudflare Turnstile challenge (usually invisible)
- Rate limiting (Vercel Firewall rule plus a per-instance limit)
- Astro's built-in origin check blocks cross-site posts
