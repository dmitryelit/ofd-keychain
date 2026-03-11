# ofd-keychain

Monorepo scaffold for a Three.js-based custom keychain generator with:

- Next.js editor and hosted share viewer
- Shared scene schema and timeline contracts
- Browser export plus external render-worker pipeline
- Prisma-backed publishing flow and local IndexedDB drafts

## Workspace

- `apps/web`: editor, viewer, API routes, Prisma schema
- `apps/render-worker`: separate service for heavyweight video rendering
- `packages/scene-core`: scene schema, migrations, commands, timeline evaluation
- `packages/render-engine`: Three.js/R3F scene runtime and SVG extrusion helpers
- `packages/editor-ui`: headless editor shell and panels
- `packages/export-core`: snapshot/video export adapters
- `packages/config`: shared TypeScript and lint config

## Commands

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm build
corepack pnpm test
```

## Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in storage/database keys before running publish or worker flows.
