import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    last_updated: z.coerce.string(),
    description: z.string().optional(),
    // Short line shown on the /legal index.
    summary: z.string().optional(),
  }),
});

export const collections = { legal };
