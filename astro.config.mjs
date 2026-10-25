// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import rehypePolicySections from './src/lib/rehype-policy-sections.mjs';

// Pages are prerendered (static). Only /api/contact runs on demand.
export default defineConfig({
  site: 'https://www.designresponsibly.com',
  adapter: vercel(),
  markdown: {
    rehypePlugins: [rehypePolicySections],
  },
  env: {
    schema: {
      // Server-only secrets: never bundled into client code.
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Public by design: Turnstile site keys are meant to be in the page.
      // Default is Cloudflare's "always passes" test key for local development.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        default: '1x00000000000000000000AA',
      }),
    },
  },
});
