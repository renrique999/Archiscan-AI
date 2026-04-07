# Archiscan-AI

Minimal reference documentation for repository setup, API configuration, and development workflow.

---

## Quick links
- Code entry: [src/main.tsx](src/main.tsx)  
- App routes: [src/App.tsx](src/App.tsx)  
- Generator page: [src/pages/Index.tsx](src/pages/Index.tsx)  
- Landing page: [src/pages/LandingPage.tsx](src/pages/LandingPage.tsx)  
- Text-to-blueprint form: [src/components/BlueprintForm.tsx](src/components/BlueprintForm.tsx)  
- Image upload / analyze: [src/components/PlotImageUpload.tsx](src/components/PlotImageUpload.tsx)  
- Layout optimizer: [src/components/LayoutOptimizer.tsx](src/components/LayoutOptimizer.tsx)  
- Blueprint output: [src/components/BlueprintDisplay.tsx](src/components/BlueprintDisplay.tsx)  
- Toast system: [src/hooks/use-toast.ts](src/hooks/use-toast.ts) and [src/components/ui/sonner.tsx](src/components/ui/sonner.tsx)  
- Toast UI primitives: [src/components/ui/toast.tsx](src/components/ui/toast.tsx)  
- Supabase function config: [supabase/config.toml](supabase/config.toml)  
- Supabase functions:
  - [supabase/functions/generate-blueprint/index.ts](supabase/functions/generate-blueprint/index.ts)  
  - [supabase/functions/analyze-plot-image/index.ts](supabase/functions/analyze-plot-image/index.ts)  
  - [supabase/functions/generate-from-plot/index.ts](supabase/functions/generate-from-plot/index.ts)  
- Build & dev config: [package.json](package.json), [vite.config.ts](vite.config.ts), [tsconfig.app.json](tsconfig.app.json)

---

## Requirements
- Node.js (recommended LTS)
- npm (or yarn / pnpm)
- Supabase CLI (for functions deployment) — optional for local dev but required to deploy server functions
- A Lovable API key (see "Secrets / API keys" below)

---

## Clone & local setup

1. Clone repository:
   git clone <repo-url>
   cd Archiscan-AI

2. Install dependencies:
   npm install

3. Copy environment variables:
   - Create a `.env` file at project root (an example is present here: [.env](.env)).
   - Required client env vars:
     - VITE_SUPABASE_URL — Supabase URL (set in [.env](.env))
     - VITE_SUPABASE_PUBLISHABLE_KEY — Supabase anon/public key (set in [.env](.env))
     - VITE_SUPABASE_PROJECT_ID — Project ref (set in [.env](.env))

4. Start dev server:
   npm run dev
   - Opens Vite dev server (see [package.json](package.json) `dev` script).

---

## Secrets / API keys

- The Supabase serverless functions require a Lovable API key. The functions read `LOVABLE_API_KEY` from the environment:
  - See its usage in:
    - [supabase/functions/generate-blueprint/index.ts](supabase/functions/generate-blueprint/index.ts)
    - [supabase/functions/analyze-plot-image/index.ts](supabase/functions/analyze-plot-image/index.ts)
    - [supabase/functions/generate-from-plot/index.ts](supabase/functions/generate-from-plot/index.ts)

- Do NOT store the Lovable API key in client-side `.env` (VITE_*). The key must be set in the server/function environment (Supabase secrets or Deno env when deploying functions).

---

## Supabase functions (server-side AI calls)

Files:
- [supabase/functions/generate-blueprint/index.ts](supabase/functions/generate-blueprint/index.ts) — Accepts a text prompt and returns image URL.
- [supabase/functions/analyze-plot-image/index.ts](supabase/functions/analyze-plot-image/index.ts) — Sends uploaded image to AI gateway for shape analysis.
- [supabase/functions/generate-from-plot/index.ts](supabase/functions/generate-from-plot/index.ts) — Uses analysis + image to generate a blueprint.

Deployment notes:
- Use Supabase CLI to deploy functions and set secrets:
  - supabase login
  - supabase functions deploy generate-blueprint --project-ref <PROJECT_ID>
  - supabase functions deploy analyze-plot-image --project-ref <PROJECT_ID>
  - supabase functions deploy generate-from-plot --project-ref <PROJECT_ID>
- Set LOVABLE_API_KEY for functions:
  - supabase secrets set LOVABLE_API_KEY=<your_key> --project-ref <PROJECT_ID>

See project ref in [.env](.env) (VITE_SUPABASE_PROJECT_ID) and [supabase/config.toml](supabase/config.toml).

---

## Development workflow

- Run dev client:
  npm run dev

- Build for production:
  npm run build

- Preview production build locally:
  npm run preview

- Run tests:
  npm run test

- Lint:
  npm run lint

---

## Important client-side files

- Generator UI / wiring to functions:
  - [src/pages/Index.tsx](src/pages/Index.tsx) — calls `generate-blueprint` server function via Supabase client.
  - [src/components/PlotImageUpload.tsx](src/components/PlotImageUpload.tsx) — upload, analyze (`analyze-plot-image`) and generate-from-plot flows.
  - [src/components/LayoutOptimizer.tsx](src/components/LayoutOptimizer.tsx) — generates multiple layout options by repeatedly calling `generate-blueprint`.

- Supabase client usage:
  - [src/integrations/supabase/client.ts] (search in repo) — client initialization (uses VITE_* env vars).

---

## Archiscan toolchain notes

- This repo includes optional tooling integrations used for development.
- Remove or disable any environment-specific plugins if you don't use them locally.

---

## Deploying the web app

- Host the static site (Vite build output) on any static host (Netlify, Vercel, Cloudflare Pages, etc.).
- Ensure functions are deployed on Supabase and `LOVABLE_API_KEY` is configured in the functions' environment.

---

## Troubleshooting

- If blueprints fail to generate the functions return errors. Inspect function logs in Supabase dashboard or check console logs that mirror server responses (see `console.error` lines in function files).
  - Inspect the server code:
    - [supabase/functions/generate-blueprint/index.ts](supabase/functions/generate-blueprint/index.ts)
    - [supabase/functions/generate-from-plot/index.ts](supabase/functions/generate-from-plot/index.ts)
    - [supabase/functions/analyze-plot-image/index.ts](supabase/functions/analyze-plot-image/index.ts)

---

## Useful commands (summary)
- Install: npm install
- Dev: npm run dev
- Build: npm run build
- Preview: npm run preview
- Test: npm run test
- Lint: npm run lint
- Deploy Supabase functions:
  - supabase login
  - supabase functions deploy <name> --project-ref <project_id>
  - supabase secrets set LOVABLE_API_KEY=<key> --project-ref <project_id>

---

If you need edits to the README content, or want me to include example CLI outputs / sample environment templates, tell me which section to expand.
