# AGENTS.md

## Mission
- Build and maintain a desktop-first web app for designing custom keychains in Three.js.
- Treat this repo as a greenfield product scaffold with strict shared contracts between editor, viewer, and render-worker.

## Architecture Rules
- Keep the repo as a `pnpm` monorepo with `apps/*` and `packages/*`.
- `apps/web` owns the editor, hosted viewer, and lightweight API routes.
- `apps/render-worker` owns heavyweight render jobs, FFmpeg integration, and headless rendering.
- `packages/scene-core` is the only source of truth for scene schema, versioning, migrations, timeline contracts, and undo/redo command shapes.
- `packages/render-engine` must stay reusable by both editor and viewer. Do not couple it to editor-only state.
- `packages/export-core` must support both browser export and worker export. Any export change must consider both paths.
- Viewer code must remain read-only and must not import editor stores or editor-only mutations.
- Do not place heavy rendering, FFmpeg, or headless WebGL workloads inside Vercel Functions.

## Code Rules
- Use TypeScript everywhere unless a tool hard-requires another language.
- Favor server/client boundaries that are safe for React Server Components.
- Do not duplicate `SceneDocument` or related schemas in apps. Import them from `packages/scene-core`.
- Every new editor action must define undo/redo behavior or explicitly document why it is exempt.
- Validate and normalize all uploaded SVGs and texture assets before persistence.
- Keep domain logic in packages, not in route handlers or React components.
- Prefer pure functions for timeline evaluation, serialization, and scene migration logic.

## Product Boundaries
- Current v1 scope is portfolio/demo quality editing, animation, video export, and hosted share pages.
- Do not add checkout, pricing, payment, manufacturing export, or account-driven business logic without an explicit product decision.
- Desktop editor is primary. Mobile supports viewer/share mode, not the full authoring experience.

## Testing Requirements
- Add or update automated tests for:
  - scene schema validation and migrations
  - SVG import normalization
  - timeline serialization and playback evaluation
  - publish/share flow
  - export payload generation
- When geometry or material generation changes, verify that editor/viewer/worker consume the same scene contract.

## Tooling Standards
- Preferred package manager: `pnpm` via Corepack.
- Run `corepack pnpm lint`, `corepack pnpm test`, and `corepack pnpm build` before closing substantial work.
- Keep shared config in `packages/config`.
- Use `zod` for runtime validation, `Prisma` for published project persistence, and `Zustand` for editor state.

## Naming and Structure
- Use English identifiers in code and file names.
- Name scene-facing types explicitly: `SceneDocument`, `ShapeAsset`, `MaterialDefinition`, `TimelineTrack`, `RenderJob`.
- Group editor UI by behavior, not by page.
- Keep route handlers thin and delegate to `lib/server` services.

## Documentation
- Update `README.md` when setup, env, or major workspace commands change.
- Document any new environment variables in `apps/web/.env.example` or the relevant app.
