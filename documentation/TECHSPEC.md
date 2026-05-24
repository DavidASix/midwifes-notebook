# Technical Specification

## Overview

This project is a monorepo containing three applications: a React Native mobile app, a Fastify API server, and an Astro web frontend. The monorepo is managed with **Turborepo** and **pnpm workspaces**.

---

## Monorepo Structure

```
/
  apps/
    mobile/        # Expo / React Native app
    web/           # Astro web frontend
    server/        # Fastify + tRPC API
  packages/
    ui/            # Shared UI components (if needed)
```

---

## App 1: Mobile (React Native / Expo)

### Platform Targets
- iOS
- Android

### Core Framework
**Expo** (managed workflow). The managed workflow is the recommended starting point — it has fewer limitations than it historically did and simplifies the development and deployment process significantly.

### Builds & Deployment
**EAS (Expo Application Services)** handles the full deployment lifecycle:

- `eas build` — Cloud-based builds for iOS and Android. No local Xcode or Android Studio required for producing distributable builds.
- `eas update` — Over-the-air (OTA) updates via Expo Updates. Allows shipping JS/asset changes to users without going through app store review.
- `eas submit` — Automated submission to the Apple App Store and Google Play Store.

OTA updates are the primary update mechanism for non-native changes. Full app store builds are reserved for native dependency changes, new permissions, or major version releases.

### Styling
React Native's built-in **`StyleSheet`** API is the only styling system used in the mobile app. No utility-class or CSS-in-JS library is used.

### UI Components
Simple, stateless components (buttons, badges, cards, avatars, etc.) are built in-house using `StyleSheet`. There is no dependency on a component library for these.

For complex interactive components with non-trivial logic or accessibility requirements (dropdowns, dialogs, tooltips, popovers), a dedicated library or React Native Reusables may be used on a case-by-case basis.

**`@gorhom/bottom-sheet`** is used for slide-up sheet UI (see Navigation below).

### Fonts
**`@expo-google-fonts/*`** packages are used for Google Fonts. No manual font file management is required. Fonts are loaded at app startup using `expo-font`, with `SplashScreen.preventAutoHideAsync()` used to prevent render before fonts are ready.

### Navigation
Navigation is handled by **Expo Router** (file-system based routing, built on React Navigation). The following navigation patterns are used:

| Pattern | Name | Implementation |
|---|---|---|
| Bottom tab bar | Tab Navigator | `(tabs)` directory in Expo Router |
| Screen pushed on top of current | Stack Navigator | Default Expo Router navigation |
| Slide-up screen with drag handle | Modal / Bottom Sheet | `presentation: 'modal'` for full-screen modals; `@gorhom/bottom-sheet` for partial-height, snapping, or scrollable sheets |

### Local Database
**`expo-sqlite`** (v14+) is used for local on-device storage. It provides a modern async API and integrates directly with Drizzle ORM.

**Drizzle ORM** is used as the database interface layer:
- Schema is defined in TypeScript
- `drizzle-kit` manages migrations
- Migrations are run on app startup
- `expo-drizzle-studio-plugin` is available for inspecting the database in Expo DevTools during development

### Local Authentication (App Lock)
The app supports an optional lock feature. When enabled, the user must authenticate via their device's configured method (Face ID, Touch ID, fingerprint, or PIN/passcode) to access the app.

**`expo-local-authentication`** handles this entirely on-device — no server involvement. Implementation details:

- User can enable/disable the lock in app settings
- On foreground (app returning from background), the lock state is checked via React Native's `AppState` API and the authentication prompt is triggered if enabled
- The main app UI is gated behind an authentication state — a lock screen is shown until auth succeeds
- Biometric methods fall back gracefully to device PIN/passcode if biometrics fail or are unavailable

### TypeScript
TypeScript is used throughout. Expo scaffolds with TypeScript by default. Expo Router provides fully typed routes — navigating to a non-existent route path is a compile-time error. All libraries in the mobile stack (Drizzle, tRPC) are TypeScript-first.

---

## App 2: Server (Fastify + tRPC)

### Framework
**Fastify** — chosen for its performance, TypeScript-first design, and plugin ecosystem.

### API Layer
**tRPC** is used to define the API surface. tRPC provides end-to-end type safety between the server and all clients (mobile app and web) without code generation.

The tRPC instance is initialized within the server app. All routers and procedures are defined under `apps/server/routers/`. The `AppRouter` type is exported from `@midwifes-notebook/server/router` and imported by clients — this is a type-only import, so nothing from the server is bundled into the client at runtime.

tRPC is the exclusive API protocol between the server and clients. REST endpoints are not defined unless required by a third-party integration.

### tRPC Structure
```
apps/server/
  routers/
    index.ts       # Root router — assembles all sub-routers, exports AppRouter
  index.ts         # Fastify server entry point
```

Clients import the shared type like so:
```ts
import type { AppRouter } from '@midwifes-notebook/server/router';
```

---

## App 3: Web (Astro)

### Purpose
The Astro site serves as the public-facing web frontend: marketing pages, changelog, privacy policy, terms of service, and similar static or semi-static content.

### API Connectivity
The site connects to the Fastify server via tRPC when dynamic server interaction is needed. All tRPC calls are made server-side in Astro page frontmatter using the configured client in `src/lib/trpc.ts`. The `AppRouter` type is imported from `@midwifes-notebook/server/router` for full type safety.

### Icons & SVGs

Inline `<svg>` tags are **never** written by hand in this codebase. All SVG usage falls into one of two patterns:

**1. UI icons — use `astro-icon`**

Icons are sourced from the **Lucide** Iconify pack (`@iconify-json/lucide`) via the `<Icon>` component from `astro-icon/components`. Reference icons as `"lucide:<icon-name>"`. Browse [lucide.dev](https://lucide.dev) to find names.

```astro
---
import { Icon } from "astro-icon/components";
---

<Icon name="lucide:calendar" width={20} height={20} aria-hidden="true" />
```

**2. Project SVG assets (logos, illustrations) — import as a component**

SVG files that belong to the project (e.g. brand logos, custom illustrations) live in `src/assets/` and are imported directly as Astro components. Astro inlines them at build time and the import target accepts standard SVG props (`class`, `fill`, `aria-hidden`, etc.).

```astro
---
import AppleLogo from "../assets/apple-logo.svg";
---

<AppleLogo class="h-7 w-auto" fill="white" aria-hidden="true" />
```

Never copy-paste SVG markup inline — either add the file to `src/assets/` and import it, or use an `astro-icon` icon.

### TypeScript
TypeScript is used throughout. Astro ships with TypeScript support built in, with the project configured to use Astro's `strict` tsconfig preset.

---

## Shared Conventions

- **Language:** TypeScript everywhere — no JavaScript files in any application.
- **Package manager:** pnpm
- **Monorepo orchestration:** Turborepo
- **Linting / formatting:** ESLint + Prettier
- **Environment variables:** Per-app `.env` files; secrets are never committed to the repository.

---

## Testing

**Jest** is used as the test runner across all three apps. This provides a single unified `turbo test` command from the monorepo root — Turborepo runs each app's test suite in parallel and caches results.

Vitest was considered but excluded because it does not support React Native. Jest with the `jest-expo` preset handles RN-specific transforms and is the only viable option for the mobile app. Consistency across the monorepo outweighs the DX benefits Vitest would provide for the server and web apps.

### Test Focus

**Unit tests are the primary focus.** Business logic, data transformations, utility functions, Drizzle schema helpers, tRPC procedure logic, and individual components should all have unit test coverage.

**Integration tests are a secondary priority.** These test the interaction between layers — e.g. a tRPC procedure running against a real (in-memory or test) database, or a component that fetches data and renders the result. Integration tests are written where unit tests alone would not catch regressions in the way pieces connect.

E2E tests are not in scope at this stage.

### Per-App Setup

| App | Test Runner | Key Libraries |
|---|---|---|
| Mobile (Expo/RN) | Jest + `jest-expo` preset | `@testing-library/react-native` |
| Server (Fastify) | Jest | `supertest` for HTTP integration tests |
| Web (Astro) | Jest | — |

### Running Tests

```bash
turbo test          # run all test suites across the monorepo
turbo test --filter=mobile   # run tests for a single app
```

---

## EAS Pricing Note

EAS Build has a free tier with limitations on build concurrency and speed. Paid tiers are available for faster builds and higher concurrency. This should be evaluated against team size and release cadence before launch.
