# Midwife's Notebook — Web (Astro)

The Astro web frontend. Part of the monorepo — run all commands from the repo root using `pnpm`.

## Commands

| Command | Action |
| :--- | :--- |
| `pnpm dev:web-stack` | Start the web frontend and server together |
| `pnpm dev:web` | Start the web frontend only |
| `pnpm build` | Build all apps |
| `pnpm check:types:web` | Type-check this app |

## Project Structure

```
src/
  lib/
    trpc.ts        # tRPC client — import this in pages instead of re-declaring
  pages/
    index.astro    # Entry page
public/
```

## tRPC

The tRPC client is pre-configured in `src/lib/trpc.ts`. Import it in any page:

```ts
import { trpc } from "../lib/trpc";
```

The `AppRouter` type comes from `@midwifes-notebook/server/router` and is wired up inside `trpc.ts` — pages don't need to import it directly.
