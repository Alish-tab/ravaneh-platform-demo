# Ravaneh Admin

React + TypeScript + Vite application for the Ravaneh dispatcher/admin web UI.

## Setup

```bash
cd apps/admin
cp .env.example .env
npm install
npm run dev
```

## Scripts

| Script                                                              | Purpose                             |
| ------------------------------------------------------------------- | ----------------------------------- |
| `npm run dev`                                                       | Development server                  |
| `npm run build`                                                     | Production build                    |
| `npm run preview`                                                   | Preview production build            |
| `npm run lint`                                                      | ESLint                              |
| `npm run typecheck`                                                 | TypeScript project references check |
| `npm run test`                                                      | Vitest (watch)                      |
| `npm run test:run`                                                  | Vitest (CI)                         |
| `npm run format`                                                    | Prettier write                      |
| `npm run format:check`                                              | Prettier check                      |
| `npm run api:gen -- <spec> -o src/shared/api/generated/schema.d.ts` | Generate OpenAPI types              |

## Notes

- RTL (`lang=fa` / `dir=rtl`) is enabled in `index.html`.
- Primary UI font is self-hosted **Vazirmatn** (`src/shared/assets/fonts/`).
- Design tokens and control grammar live under `src/app/styles/` (Dark Foundation).
- No UI component library; lightweight primitives are in `src/shared/ui/`.
- Map visual grammar (route palette, stop marker styles) is in `src/shared/map/grammar.ts` for Leaflet — SVG Foundation mock is not used.
- Internal visual smoke: `/foundation` (not in primary nav).
