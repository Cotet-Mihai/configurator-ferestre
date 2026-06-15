# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev        # Start dev server at http://localhost:3000
pnpm build      # Production build
pnpm start      # Run production server
pnpm lint       # Run ESLint
```

No test runner is configured.

## Stack

- **Next.js 16.2.6** (canary) with App Router — read `node_modules/next/dist/docs/` before writing code, APIs differ from stable releases
- **TypeScript 5** with strict mode; path alias `@/*` maps to repo root
- **Tailwind CSS v4** via `@tailwindcss/postcss` — no `tailwind.config.*`, configure in CSS
- **pnpm** as package manager

## Architecture

Single-app structure under `app/` using the Next.js App Router:

- `app/layout.tsx` — root layout with Geist font and dark-mode CSS variables
- `app/page.tsx` — home page (currently boilerplate)
- `app/globals.css` — Tailwind import + CSS custom properties for theming

The project is a window (ferestre) calculator that is not yet implemented — only the Next.js scaffold exists.
