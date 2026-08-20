# Hackathon Command Center

One place to track every hackathon you are registered for: deadlines, requirements,
submission readiness, tasks and assets.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## Structure

```
src/
  types/          domain model (Hackathon, Requirement, Task, Asset, ...)
  data/           persistence boundary + seed data
    repository.ts       Repository interface, localStorage implementation
    supabaseRepository.ts  cloud implementation (one JSONB row per user)
    seed*.ts            sample hackathons covering every UI state
  store/          reducer over the whole document + React provider, auth provider
  lib/            pure logic: countdowns, formatting, derived progress
  components/     ui.tsx (primitives), shared.tsx (domain pieces), icons.tsx
  styles/         tokens.css -> base.css -> app.css + views.css
  features/       Dashboard, Workspace shell, and the five workspace pages
```

### Persistence

Everything goes through `Repository` in `src/data/repository.ts`. With no setup at
all it writes a single versioned JSON document to `localStorage` (falling back to
in-memory storage when storage is blocked) - data stays on that one browser/device.

Setting the two env vars below switches to `SupabaseRepository` instead: the same
JSON document, stored as one JSONB row per signed-in user, synced across every
device you sign into. See `.env.example` and `supabase/schema.sql`, and
[SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for the full walkthrough.

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Derived state

Progress and submission readiness are never stored. They are computed in
`src/lib/derive.ts` from the underlying checklists, so the numbers on a card can
never drift from what is actually done. Readiness counts only *required* submission
items, so optional extras never block or dilute it.

"Reset sample data" on the dashboard restores the original seed set.
