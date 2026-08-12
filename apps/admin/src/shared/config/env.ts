import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default(''),
  VITE_MAP_TILE_URL: z.string().min(1),
  VITE_MAP_ATTRIBUTION: z.string().min(1),
});

const parsed = envSchema.safeParse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? '',
  VITE_MAP_TILE_URL: import.meta.env.VITE_MAP_TILE_URL,
  VITE_MAP_ATTRIBUTION: import.meta.env.VITE_MAP_ATTRIBUTION,
});

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
  throw new Error(
    `Invalid admin environment. Copy apps/admin/.env.example to .env and set: ${details}`,
  );
}

/**
 * Centralized client env access.
 * Components must import from here — never read `import.meta.env` directly.
 */
export const env = {
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  mapTileUrl: parsed.data.VITE_MAP_TILE_URL,
  mapAttribution: parsed.data.VITE_MAP_ATTRIBUTION,
} as const;
