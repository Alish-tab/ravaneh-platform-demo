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
- Brand font files are not in the repo yet; system font fallback is configured.
- No UI component library is installed; styling is Tailwind CSS only.
