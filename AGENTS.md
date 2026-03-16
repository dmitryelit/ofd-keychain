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
- Keep the editor's desktop composition aligned with the approved Figma design. The current editor is a Figma-driven floating-panel workbench, not a generic dashboard layout.
- Treat the current desktop editor layout as pixel-sensitive: top-left brand pill, top-right action cluster, left material/edit-material stack, centered shape stack plus bottom rail, right scene stack, and bottom preview chips must remain visually faithful unless a newer design explicitly replaces them.
- Preserve the separation between scene state and editor-only UI state. Collapsed panel state, temporary layout state, and similar editor chrome must stay out of `SceneDocument`.
- Asset preset delivery belongs to `apps/web` server utilities and API routes; shared packages may consume only the serialized scene contract and asset URLs, not app-local file paths.

## Code Rules
- Use TypeScript everywhere unless a tool hard-requires another language.
- Favor server/client boundaries that are safe for React Server Components.
- Do not duplicate `SceneDocument` or related schemas in apps. Import them from `packages/scene-core`.
- Every new editor action must define undo/redo behavior or explicitly document why it is exempt.
- Validate and normalize all uploaded SVGs and texture assets before persistence.
- Keep domain logic in packages, not in route handlers or React components.
- Prefer pure functions for timeline evaluation, serialization, and scene migration logic.
- Use Figma MCP as the source of truth for design implementation when a Figma file or node is provided. Match sizing, spacing, panel placement, and component visuals as closely as possible instead of approximating.
- Reuse the typed preset catalogs in `apps/web/assets/catalog.ts` and the preset asset services/routes instead of hardcoding material or shape option lists in UI components.
- Material presets sourced from external libraries should be checked into `apps/web/assets/materials/*` as local archives or extracted files; keep the original source files such as `MTLX` next to the runtime texture maps when available.
- When changing materials, backgrounds, or shape presets, update both the editor experience and any viewer/runtime behavior that depends on the same serialized scene data.

## Product Boundaries
- Current v1 scope is portfolio/demo quality editing, animation, video export, and hosted share pages.
- Do not add checkout, pricing, payment, manufacturing export, or account-driven business logic without an explicit product decision.
- Desktop editor is primary. Mobile supports viewer/share mode, not the full authoring experience.
- The mobile editor may use a simplified fallback, but desktop remains the reference experience and must be kept closest to Figma.

## Current Contracts
- `SceneDocument` is currently on schema version `3`.
- `viewport.background` is a discriminated union that supports `{ mode: "gradient", topColor, bottomColor }`, `{ mode: "solid", color }`, and `{ mode: "transparent" }`.
- `MaterialDefinition` currently includes `opacity` and supports `maps.metalness` in addition to existing texture maps.
- Shape and material presets are served from `apps/web` through allowlisted asset routes under `/api/assets/*`.
- Preset asset resolution in `apps/web` must be anchored to the module location, not `process.cwd()`, so material/shape catalogs keep working across `pnpm dev`, monorepo runs, builds, and tests.
- The current material catalog is intentionally narrowed to a GPUOpen Matlib `Copper Satin` MaterialX preset stored under `apps/web/assets/materials/copper-satin`, and new or reconciled scenes should land on that preset by default.
- New projects should be seeded from the preset asset services so default materials include preset map URLs and default shapes include preset SVG source URLs.
- The desktop editor opens with the floating panels collapsed into preview chips, while the desktop stage itself runs an editor-only idle spin on the keychain object.
- The editor currently supports live material presets, shape presets, SVG upload, gradient/solid/transparent background editing, and `Depth / Bevel / Ring` controls.
- When preset collections fail or come back empty, the desktop editor should still open the project and surface explicit material/shape preset status instead of silently showing blank panels.

## Testing Requirements
- Add or update automated tests for:
  - scene schema validation and migrations
  - SVG import normalization
  - timeline serialization and playback evaluation
  - publish/share flow
  - export payload generation
- When geometry or material generation changes, verify that editor/viewer/worker consume the same scene contract.
- When changing editor visuals to match Figma, verify both functional correctness and layout fidelity, especially for the desktop `/editor` route.
- When changing preset catalogs or asset routes, add or update allowlist and normalization coverage.

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
- Update `AGENTS.md` after every significant project change so it stays current with the actual editor UX, scene contracts, asset pipeline, and workflow rules.
