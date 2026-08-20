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
    repository.ts   Repository interface, localStorage implementation
    seed*.ts        sample hackathons covering every UI state
  store/          reducer over the whole document + React provider
  lib/            pure logic: countdowns, formatting, derived progress
  components/     ui.tsx (primitives), shared.tsx (domain pieces), icons.tsx
  styles/         tokens.css -> base.css -> app.css + views.css
  features/       Dashboard, Workspace shell, and the five workspace pages
```

### Persistence

Everything goes through `Repository` in `src/data/repository.ts`. The current
implementation writes a single versioned JSON document to `localStorage` and falls
back to in-memory storage when storage is blocked. Swapping in a real backend means
writing a second implementation of that interface; no component changes.

### Derived state

Progress and submission readiness are never stored. They are computed in
`src/lib/derive.ts` from the underlying checklists, so the numbers on a card can
never drift from what is actually done. Readiness counts only *required* submission
items, so optional extras never block or dilute it.

"Reset sample data" on the dashboard restores the original seed set.
