# AGENTS.md

This file is a directory reference for AI agents working in this repository. When you make changes that affect the areas described below, read the files first for reference and keep them updated with relevant documentation in `documentation/`.

---

## Documentation Index

### [`documentation/TECHSPEC.md`](documentation/TECHSPEC.md)
The technical specification for the full monorepo. Covers:
- Monorepo structure (`apps/mobile`, `apps/web`, `apps/server`, `packages/ui`)
- Mobile app stack: Expo, EAS, NativeWind v4, Expo Router, `@gorhom/bottom-sheet`, `expo-sqlite`, Drizzle ORM, `expo-local-authentication`
- Server stack: Fastify + tRPC (router defined in `apps/server/routers/`, `AppRouter` exported from `@midwifes-notebook/server/router`)
- Web stack: Astro + tRPC client (client configured in `src/lib/trpc.ts`, `AppRouter` imported from `@midwifes-notebook/server/router`)
- Shared conventions: TypeScript, pnpm, Turborepo, Jest

**Update when:** adding or changing a dependency, altering the monorepo structure, changing the build/deploy process, or revising testing strategy.

---

### [`documentation/MOBILE_APP.md`](documentation/MOBILE_APP.md)
The product specification for the mobile app. Covers:
- First launch / onboarding flow
- App lock behavior
- Bottom tab bar navigation and screen inventory
- Screen-by-screen specs: Clients list, Client Detail (tabs: Client / Children / Notes), Client Edit/Add, Tools (LMP/GA/EDD calculator), Calendar, Statistics, Settings

**Update when:** adding, removing, or changing any screen, navigation pattern, feature behavior, or UI interaction in the mobile app.

---

### [`documentation/SCHEMA.md`](documentation/SCHEMA.md)
The local SQLite database schema. Covers:
- `clients` table — all columns, constraints, and derived `status` logic
- `babies` table — birth details, clinical fields, foreign key to `clients`
- `notes` table — title/content/date entries per client
- `settings` table — EAV table for app-wide settings
- General notes: ISO 8601 dates, soft deletes via `deleted_at`, `updated_at` maintenance, unit storage conventions

**Update when:** adding, removing, or renaming a column or table; changing a constraint or default; altering soft-delete or migration behavior.

---

### [`documentation/STYLES.md`](documentation/STYLES.md)
The visual design language for the mobile app. Covers:
- Color palette (background, primary accent, secondary accent, text, muted, badge fills)
- Typography: Newsreader serif for names/display text; Inter/system sans-serif for UI chrome
- Layout conventions: list rows, detail view grids, avatar column, chevron affordance
- Component patterns: status badges, bottom tab bar, detail view tabs, skeleton loaders
- Overall tone

**Update when:** changing colors, fonts, layout rules, component visual patterns, or introducing new design tokens.

---

### [`documentation/CONVENTIONS.md`](documentation/CONVENTIONS.md)
Coding conventions for the repository. Covers:
- File naming: PascalCase for components, camelCase for hooks, kebab-case for lib/util files
- JSDoc: when to write one, what to include (params, returns, examples), and line length

**Update when:** establishing or changing any coding convention that should be applied consistently across the codebase.

---

## Mockups

Visual mockups live in `documentation/mockups/` and are for reference only — do not modify them unless producing new design artifacts.

| File | Description |
|---|---|
| `documentation/mockups/client-list.png` | Client list screen layout |
| `documentation/mockups/client-view-page.png` | Client detail view layout |
