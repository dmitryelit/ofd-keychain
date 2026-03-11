import type { SceneDocument } from "@ofd-keychain/scene-core";
import type { ReactNode } from "react";

export function EditorShell({
  topBar,
  inspector,
  timeline,
  viewport,
  mobilePanel
}: {
  topBar: ReactNode;
  inspector: ReactNode;
  timeline: ReactNode;
  viewport: ReactNode;
  mobilePanel?: ReactNode;
}) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-stone-50">
      <div className="absolute inset-0">{viewport}</div>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 sm:p-4">{topBar}</header>
      <aside className="desktop-only pointer-events-none absolute right-4 top-20 bottom-24 z-20 w-[320px]">
        {inspector}
      </aside>
      <section className="desktop-only pointer-events-none absolute bottom-4 left-4 right-[352px] z-20">
        {timeline}
      </section>
      <section className="mobile-only pointer-events-none absolute inset-x-3 bottom-3 z-20 space-y-3">
        {mobilePanel ?? (
          <>
            {timeline}
            {inspector}
          </>
        )}
      </section>
    </div>
  );
}

export function InspectorPanel({
  scene,
  selectedObjectId
}: {
  scene: SceneDocument;
  selectedObjectId: string | null;
}) {
  const object = scene.objects.find((entry) => entry.id === selectedObjectId) ?? scene.objects[0];
  const material = scene.materials.find((entry) => entry.id === object?.materialId);

  return (
    <div className="pointer-events-auto h-full overflow-y-auto rounded-[24px] border border-black/10 bg-white/78 p-4 text-stone-900 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Selection</p>
          <h2 className="mt-2 text-base font-medium text-stone-950">{object?.name ?? "No selection"}</h2>
          <p className="mt-1 text-sm text-stone-500">{material?.name ?? "Material preset"}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-black/8 bg-white/65 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Depth</p>
            <p className="mt-1 text-sm text-stone-950">{object?.params.depth ?? 0} mm</p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white/65 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Bevel</p>
            <p className="mt-1 text-sm text-stone-950">{object?.params.bevelEnabled ? "On" : "Off"}</p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white/65 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Ring</p>
            <p className="mt-1 text-sm text-stone-950">{object?.params.ringHoleRadius ?? 0} mm</p>
          </div>
        </div>
        <div className="space-y-2 rounded-3xl border border-black/8 bg-white/65 p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Material</p>
          <div className="flex items-center justify-between text-sm text-stone-700">
            <span>Color</span>
            <span className="font-medium text-stone-950">{material?.color ?? "#000000"}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>Roughness</span>
            <span>{material?.roughness ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>Metalness</span>
            <span>{material?.metalness ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimelinePanel({ scene, currentTimeMs }: { scene: SceneDocument; currentTimeMs: number }) {
  return (
    <div className="pointer-events-auto rounded-[24px] border border-black/10 bg-white/78 p-4 text-stone-900 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Timeline</p>
          <p className="mt-1 text-sm text-stone-700">
            {Math.round(currentTimeMs)} / {scene.timeline.durationMs} ms at {scene.timeline.fps} fps
          </p>
        </div>
        <div className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] text-stone-600">
          {scene.timeline.loop ? "Looping" : "One-shot"}
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {scene.timeline.tracks.map((track) => (
          <div key={track.id} className="min-w-[180px] rounded-3xl border border-black/8 bg-white/65 p-3">
            <p className="text-sm font-medium text-stone-950">{track.property}</p>
            <p className="text-xs text-stone-500">{track.targetRef}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {track.keyframes.map((keyframe) => (
                <div
                  key={keyframe.id}
                  className="rounded-full border border-black/8 bg-white px-2 py-1 text-[11px] text-stone-600"
                >
                  {keyframe.timeMs}ms
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Toolbar({
  projectTitle,
  actions
}: {
  projectTitle: string;
  actions: ReactNode;
}) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-3 rounded-[24px] border border-black/10 bg-white/78 px-4 py-3 text-stone-900 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:px-5">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.32em] text-stone-500">Keychain Lab</p>
        <h1 className="truncate text-base font-medium text-stone-950 sm:text-lg">{projectTitle}</h1>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
    </div>
  );
}
