import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ base: "./_posts", pattern: "**/*.md" }),
  schema: z.object({
    layout: z.string().optional(),
    title: z.string(),
    tags: z.union([z.string(), z.array(z.string())]).optional()
  })
});

export const collections = { blog };
