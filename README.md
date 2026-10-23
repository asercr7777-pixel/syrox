# STRYVEN

STRYVEN is a dark, RPG-inspired self-improvement Progressive Web App. It turns user-confirmed daily missions and recorded training sessions into saved progression, XP, ranks, and profile history.

## Core areas

- **Dashboard** — current rank and XP, daily objectives, recorded training, recent history, and tracked attributes.
- **Missions** — system and personal daily missions, plus claimable daily challenges and weekly missions.
- **Training** — exercise selection, active-session controls, and saved workout history.
- **Progress & Analytics** — summaries calculated from saved activity.
- **Achievements** — tracked milestones that can be claimed after their requirements are met.
- **Shadow Army** — story-boss victories, current equipment, inventory, and rank progression.
- **Hunter Profile** and **Settings** — saved identity, loadout, appearance, account, and app preferences.

The interface is responsive and includes PWA installation support. Supabase credentials are required for authentication and cloud persistence; the placeholder client prevents a missing environment variable from crashing module initialization, but it is not a substitute for a configured project.

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS and project-specific CSS layers
- Supabase JS client
- Lucide icons
- Vite production build and GitHub Actions quality checks

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Supabase configuration

Create a local `.env` file with the public project URL and anon/publishable key:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Only use the public anon/publishable key in client-side configuration. Never put a service-role key or other server secret in a `VITE_*` variable or commit it to the repository.

Database migrations are stored in `supabase/migrations/`. Review and apply migrations deliberately to the intended Supabase project; adding a migration file to Git does not apply it to a live database.

## Project conventions

- Keep production changes on `main` unless a separate branch is explicitly requested.
- Preserve existing user data, Supabase auth, and row-level security policies.
- Do not mark a mission complete without an explicit user action unless it is a defined, verified claim flow.
- Show progression from saved records rather than fabricated metrics or demo users.
- Verify TypeScript, lint, and production build after code changes.
