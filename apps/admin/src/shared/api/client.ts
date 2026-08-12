import createClient from 'openapi-fetch';

import { env } from '@/shared/config/env';

/**
 * Typed OpenAPI client.
 *
 * When Backend publishes an OpenAPI spec, generate types:
 *   npm run api:gen -- <path-or-url-to-openapi> -o src/shared/api/generated/schema.d.ts
 *
 * Then replace `paths` with: `import type { paths } from './generated/schema'`
 *
 * Do not hand-write Backend domain types here.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- placeholder until OpenAPI generation
export type paths = {};

export const apiClient = createClient<paths>({
  baseUrl: env.apiBaseUrl,
});
