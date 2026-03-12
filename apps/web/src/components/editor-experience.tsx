"use client";

import { createMediaRecorderExport } from "@ofd-keychain/export-core";
import {
  ActionCluster,
  BrandBadge,
  CollapsedChip,
  EditorShell,
  FieldFrame,
  GlassCard,
  IconActionButton,
  PresetTile,
  Rail,
  RailSegment,
  SectionLabel
} from "@ofd-keychain/editor-ui";
import { KeychainCanvas } from "@ofd-keychain/render-engine";
import type { MaterialDefinition, ShapeAsset } from "@ofd-keychain/scene-core";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type ReactNode } from "react";
import { loadDraft, saveDraft } from "@/lib/storage/drafts";
import { useEditorStore, type EditorPanel, type EditorState } from "@/lib/state/editor-store";
import { trackEvent } from "@/lib/telemetry";
import { createStageBackgroundStyle } from "@/lib/utils/background";

interface MaterialPreset {
  id: string;
  name: string;
  previewUrl: string;
  material: MaterialDefinition;
}

interface ShapePreset {
  id: string;
  name: string;
  asset: ShapeAsset;
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as T;
}

function GridIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="5" height="5" rx="1.3" />
      <rect x="12" y="3" width="5" height="5" rx="1.3" />
      <rect x="3" y="12" width="5" height="5" rx="1.3" />
      <rect x="12" y="12" width="5" height="5" rx="1.3" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5.5 6.5h1.7l1-1.8h3.6l1 1.8h1.7A1.9 1.9 0 0 1 16.4 8.4v6.1a1.9 1.9 0 0 1-1.9 1.9H5.5a1.9 1.9 0 0 1-1.9-1.9V8.4A1.9 1.9 0 0 1 5.5 6.5Z" />
      <circle cx="10" cy="11.4" r="2.7" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3.5" y="5.5" width="9" height="9" rx="2" />
      <path d="m12.5 8.4 4-1.9v7l-4-1.9" />
    </svg>
  );
}

function PublishIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10 13.8V4.2" />
      <path d="m6.8 7.3 3.2-3.1 3.2 3.1" />
      <path d="M4.2 15.8h11.6" />
    </svg>
  );
}

function GradientIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="6.3" />
      <path d="M10 3.7a6.3 6.3 0 0 1 0 12.6" />
    </svg>
  );
}

function ShapePreview({ asset }: { asset: ShapeAsset }) {
  if (asset.sourceSvgUrl) {
    return <img src={asset.sourceSvgUrl} alt={asset.name} className="size-16 object-contain" />;
  }

  return (
    <div
      className="flex size-16 items-center justify-center text-[#8a8a8a]"
      dangerouslySetInnerHTML={{ __html: asset.normalizedSvgMarkup }}
    />
  );
}

function MiniPreview({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="size-8 rounded-[8px] object-cover" />;
}

function ColorField({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const normalized = value.toUpperCase();

  return (
    <FieldFrame className="flex h-10 items-center justify-between gap-3">
      <span className="text-[14px] tracking-[-0.04em] text-white">{normalized}</span>
      <label className="relative block h-6 w-[54px] overflow-hidden rounded-[4px] border border-white/10">
        <span className="absolute inset-0 block" style={{ backgroundColor: value }} />
        <input
          aria-label="Color value"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </FieldFrame>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const percentage = ((value - min) / (max - min || 1)) * 100;

  return (
    <label className="relative flex h-10 items-center justify-center overflow-hidden rounded-[12px] bg-black px-3">
      <span
        className="absolute inset-y-0 left-0 rounded-[12px] bg-[#4c4c4c] transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      />
      <span className="relative z-10 text-[14px] tracking-[-0.04em] text-white">{label}</span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

function BackgroundModeButton({
  active,
  disabled,
  children
}: {
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex h-7 flex-1 items-center justify-center rounded-[10px] transition ${
        active ? "bg-[#2f2f2f] text-white" : "text-white/70"
      } ${disabled ? "opacity-60" : "hover:bg-[#2f2f2f]"}`}
    >
      {children}
    </button>
  );
}

export function EditorExperience() {
  const [status, setStatus] = useState("Ready");
  const [isPending, startTransition] = useTransition();
  const [isRecording, setIsRecording] = useState(false);
  const [materialPresets, setMaterialPresets] = useState<MaterialPreset[]>([]);
  const [shapePresets, setShapePresets] = useState<ShapePreset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const scene = useEditorStore((state: EditorState) => state.scene);
  const projectId = useEditorStore((state: EditorState) => state.projectId);
  const publishSlug = useEditorStore((state: EditorState) => state.publishSlug);
  const collapsedPanels = useEditorStore((state: EditorState) => state.collapsedPanels);
  const setProjectIdentity = useEditorStore((state: EditorState) => state.setProjectIdentity);
  const hydrate = useEditorStore((state: EditorState) => state.hydrate);
  const applyMaterialPreset = useEditorStore((state: EditorState) => state.applyMaterialPreset);
  const updateMaterialAppearance = useEditorStore((state: EditorState) => state.updateMaterialAppearance);
  const updateGeometryDepth = useEditorStore((state: EditorState) => state.updateGeometryDepth);
  const updateGeometryBevel = useEditorStore((state: EditorState) => state.updateGeometryBevel);
  const updateRingHoleRadius = useEditorStore((state: EditorState) => state.updateRingHoleRadius);
  const replaceShapeAsset = useEditorStore((state: EditorState) => state.replaceShapeAsset);
  const applyShapePreset = useEditorStore((state: EditorState) => state.applyShapePreset);
  const setViewportBackground = useEditorStore((state: EditorState) => state.setViewportBackground);
  const togglePanelCollapsed = useEditorStore((state: EditorState) => state.togglePanelCollapsed);
  const setPublishSlug = useEditorStore((state: EditorState) => state.setPublishSlug);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    startTransition(() => {
      void (async () => {
        try {
          const [project, fetchedMaterialPresets, fetchedShapePresets] = await Promise.all([
            fetchJson<{
              project: { id: string; title: string; scene: typeof scene };
            }>("/api/projects", { method: "POST" }),
            fetchJson<{ presets: MaterialPreset[] }>("/api/assets/material-presets"),
            fetchJson<{ presets: ShapePreset[] }>("/api/assets/shape-presets")
          ]);

          setMaterialPresets(fetchedMaterialPresets.presets);
          setShapePresets(fetchedShapePresets.presets);
          setProjectIdentity(project.project.id, project.project.title);
          hydrate(project.project.scene);

          const draft = await loadDraft(project.project.id);

          if (draft) {
            hydrate(draft);
            setStatus("Loaded local draft");
          } else {
            setStatus("Created new draft project");
          }
        } catch (error) {
          console.error(error);
          setStatus("Failed to initialize project");
        }
      })();
    });
  }, [hydrate, scene, setProjectIdentity, startTransition]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveDraft(projectId, scene);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [projectId, scene]);

  const material = scene.materials[0];
  const object = scene.objects[0];
  const stageStyle = createStageBackgroundStyle(
    scene.viewport.background.topColor,
    scene.viewport.background.bottomColor
  );
  const activeMaterialPreset = materialPresets.find((preset) => preset.material.id === material?.id) ?? materialPresets[0];
  const activeShapePreset = shapePresets.find((preset) => preset.asset.id === scene.assets[0]?.id);

  async function applySvgMarkup(markup: string, name?: string) {
    const result = await fetchJson<{
      asset: Pick<ShapeAsset, "id" | "name" | "normalizedSvgMarkup" | "viewBox">;
    }>("/api/assets/svg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markup, name })
    });

    replaceShapeAsset(result.asset);
  }

  async function handleSvgFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      await applySvgMarkup(await file.text(), file.name.replace(/\.svg$/i, ""));
      setStatus(`Loaded ${file.name}`);
      trackEvent("svg_file_loaded", { name: file.name });
      if (collapsedPanels.shape) {
        togglePanelCollapsed("shape");
      }
    } catch (error) {
      console.error(error);
      setStatus("SVG file import failed");
    } finally {
      event.target.value = "";
    }
  }

  async function handlePublish() {
    try {
      const result = await fetchJson<{ project: { slug: string } }>(`/api/projects/${projectId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene })
      });
      setPublishSlug(result.project.slug);
      setStatus("Published hosted share page");
      trackEvent("project_published", { slug: result.project.slug });
    } catch (error) {
      console.error(error);
      setStatus("Publish failed");
    }
  }

  async function handleSnapshotExport() {
    const canvas = document.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement)) {
      setStatus("Canvas not ready");
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "ofd-keychain.png";
    link.click();
    setStatus("PNG snapshot exported");
  }

  async function handleClipExport() {
    const canvas = document.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement) || typeof canvas.captureStream !== "function") {
      setStatus("Browser clip export is not supported");
      return;
    }

    try {
      setIsRecording(true);
      setStatus("Recording browser clip");
      const blob = await createMediaRecorderExport(canvas.captureStream(scene.timeline.fps), {
        fps: scene.timeline.fps,
        durationMs: scene.timeline.durationMs
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ofd-keychain.webm";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Browser clip exported");
    } catch (error) {
      console.error(error);
      setStatus("Clip export failed");
    } finally {
      setIsRecording(false);
    }
  }

  function togglePanel(panel: EditorPanel) {
    togglePanelCollapsed(panel);
  }

  const materialSidebar = (
    <div className="flex flex-wrap items-end gap-x-2 gap-y-4">
      {collapsedPanels.material ? (
        <CollapsedChip onClick={() => togglePanel("material")}>
          {activeMaterialPreset ? (
            <MiniPreview src={activeMaterialPreset.previewUrl} alt={activeMaterialPreset.name} />
          ) : (
            <GradientIcon />
          )}
        </CollapsedChip>
      ) : (
        <>
          <GlassCard title="Material" onClose={() => togglePanel("material")} className="w-[180px]">
            <div className="space-y-4">
              <SectionLabel>Basics</SectionLabel>
              <div className="grid grid-cols-2 gap-1">
                {materialPresets.map((preset) => (
                  <PresetTile
                    key={preset.id}
                    active={preset.material.id === material?.id}
                    onClick={() => {
                      applyMaterialPreset(preset.material);
                      setStatus(`Applied ${preset.name}`);
                    }}
                  >
                    <img src={preset.previewUrl} alt={preset.name} className="size-16 rounded-full object-cover" />
                  </PresetTile>
                ))}
              </div>
            </div>
          </GlassCard>
          <GlassCard title="Edit Material" onClose={() => togglePanel("material")} className="w-[176px]">
            <div className="space-y-4">
              <div className="space-y-4">
                <SectionLabel>Color</SectionLabel>
                <ColorField
                  value={material?.color ?? "#ffffff"}
                  onChange={(value) => material && updateMaterialAppearance(material.id, { color: value })}
                />
              </div>
              <div className="space-y-4">
                <SectionLabel>Appearance</SectionLabel>
                <div className="space-y-2">
                  <SliderField
                    label="Metalness"
                    value={material?.metalness ?? 0}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => material && updateMaterialAppearance(material.id, { metalness: value })}
                  />
                  <SliderField
                    label="Roughness"
                    value={material?.roughness ?? 0}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => material && updateMaterialAppearance(material.id, { roughness: value })}
                  />
                  <SliderField
                    label="Transparency"
                    value={1 - (material?.opacity ?? 1)}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => material && updateMaterialAppearance(material.id, { opacity: 1 - value })}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );

  const sceneSidebar = (
    <div className="flex flex-col items-end gap-4">
      {collapsedPanels.scene ? (
        <CollapsedChip onClick={() => togglePanel("scene")}>
          <div
            className="size-8 rounded-[8px]"
            style={{
              backgroundImage: `linear-gradient(180deg, ${scene.viewport.background.topColor}, ${scene.viewport.background.bottomColor})`
            }}
          />
        </CollapsedChip>
      ) : (
        <GlassCard title="Scene" onClose={() => togglePanel("scene")} className="w-[180px]">
          <div className="space-y-4">
            <div className="space-y-4">
              <SectionLabel>Background Color</SectionLabel>
              <div className="space-y-2">
                <FieldFrame className="flex h-8 items-center gap-0.5 p-0.5">
                  <BackgroundModeButton active>
                    <GradientIcon />
                  </BackgroundModeButton>
                  <BackgroundModeButton disabled>
                    <CameraIcon />
                  </BackgroundModeButton>
                  <BackgroundModeButton disabled>
                    <VideoIcon />
                  </BackgroundModeButton>
                </FieldFrame>
                <ColorField
                  value={scene.viewport.background.topColor}
                  onChange={(value) =>
                    setViewportBackground({
                      topColor: value,
                      bottomColor: scene.viewport.background.bottomColor
                    })
                  }
                />
                <ColorField
                  value={scene.viewport.background.bottomColor}
                  onChange={(value) =>
                    setViewportBackground({
                      topColor: scene.viewport.background.topColor,
                      bottomColor: value
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-4">
              <SectionLabel>HDRIs</SectionLabel>
              <div className="grid grid-cols-2 gap-1">
                {(materialPresets.length ? materialPresets : [1, 2, 3, 4]).map((preset, index) => (
                  <PresetTile
                    key={typeof preset === "number" ? preset : preset.id}
                    disabled
                    className={index === 0 ? "bg-[#2f2f2f]" : undefined}
                  >
                    {typeof preset === "number" ? (
                      <div className="size-16 rounded-full bg-neutral-700" />
                    ) : (
                      <img src={preset.previewUrl} alt="" className="size-16 rounded-full object-cover opacity-75" />
                    )}
                  </PresetTile>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );

  const shapePanel = collapsedPanels.shape ? null : (
    <GlassCard title="Shape" onClose={() => togglePanel("shape")} className="w-[180px]">
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-10 w-full items-center justify-center rounded-[16px] bg-black px-4 text-[16px] tracking-[-0.04em] text-white transition hover:bg-[#111]"
        >
          Upload SVG
        </button>
        <input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" hidden onChange={handleSvgFileChange} />
        <SectionLabel>Basics</SectionLabel>
        <div className="grid grid-cols-2 gap-1">
          {shapePresets.map((preset) => (
            <PresetTile
              key={preset.id}
              active={preset.asset.id === scene.assets[0]?.id}
              onClick={() => {
                applyShapePreset(preset.asset);
                setStatus(`Applied ${preset.name}`);
              }}
            >
              <ShapePreview asset={preset.asset} />
            </PresetTile>
          ))}
        </div>
      </div>
    </GlassCard>
  );

  const bottomRail = (
    <Rail
      leading={
        <IconActionButton
          title={collapsedPanels.shape ? "Open shape panel" : "Shape panel is open"}
          active={!collapsedPanels.shape}
          onClick={() => collapsedPanels.shape && togglePanel("shape")}
        >
          <GridIcon />
        </IconActionButton>
      }
      className="w-[584px]"
    >
      <RailSegment
        label="Depth"
        value={object?.params.depth ?? 4}
        min={1}
        max={12}
        step={0.1}
        onChange={(value) => object && updateGeometryDepth(object.id, value)}
      />
      <RailSegment
        label="Bevel"
        value={object?.params.bevelSize ?? 0.35}
        min={0}
        max={1.5}
        step={0.01}
        onChange={(value) =>
          object &&
          updateGeometryBevel(object.id, {
            bevelEnabled: value > 0.02,
            bevelSize: value,
            bevelThickness: Number((value * 1.28).toFixed(2)),
            bevelSegments: value > 0.02 ? 2 : 0
          })
        }
      />
      <RailSegment
        label="Ring"
        value={object?.params.ringHoleRadius ?? 1.2}
        min={0.5}
        max={3}
        step={0.05}
        onChange={(value) => object && updateRingHoleRadius(object.id, value)}
      />
    </Rail>
  );

  const desktopToolbar = (
    <div className="flex flex-col items-end gap-3">
      <ActionCluster>
        <IconActionButton title="Export snapshot" onClick={handleSnapshotExport}>
          <CameraIcon />
        </IconActionButton>
        <IconActionButton title="Export clip" onClick={handleClipExport} disabled={isRecording}>
          <VideoIcon />
        </IconActionButton>
        <IconActionButton title="Publish project" onClick={handlePublish}>
          <PublishIcon />
        </IconActionButton>
      </ActionCluster>
      <div className="rounded-full bg-black/55 px-3 py-1 text-[11px] tracking-[-0.03em] text-white/75">
        {isPending ? "Booting..." : status}
      </div>
    </div>
  );

  const mobilePanel = (
    <>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <BrandBadge title="Key Ma Name" subtitle="Custom Key Tags" icon={<GridIcon />} />
          <ActionCluster>
            <IconActionButton title="Export snapshot" onClick={handleSnapshotExport}>
              <CameraIcon />
            </IconActionButton>
            <IconActionButton title="Export clip" onClick={handleClipExport} disabled={isRecording}>
              <VideoIcon />
            </IconActionButton>
            <IconActionButton title="Publish project" onClick={handlePublish}>
              <PublishIcon />
            </IconActionButton>
          </ActionCluster>
        </div>
        <div className="rounded-full bg-black/55 px-3 py-1 text-[11px] tracking-[-0.03em] text-white/75">{status}</div>
      </div>
      <div className="space-y-3">
        <div className="grid gap-3">
          <GlassCard title="Material" className="w-full">
            <div className="grid grid-cols-4 gap-1">
              {materialPresets.map((preset) => (
                <PresetTile
                  key={preset.id}
                  active={preset.material.id === material?.id}
                  onClick={() => applyMaterialPreset(preset.material)}
                >
                  <img src={preset.previewUrl} alt={preset.name} className="size-12 rounded-full object-cover" />
                </PresetTile>
              ))}
            </div>
          </GlassCard>
          <GlassCard title="Shape" className="w-full">
            <div className="grid grid-cols-3 gap-1">
              {shapePresets.map((preset) => (
                <PresetTile key={preset.id} active={preset.asset.id === scene.assets[0]?.id} onClick={() => applyShapePreset(preset.asset)}>
                  <ShapePreview asset={preset.asset} />
                </PresetTile>
              ))}
            </div>
          </GlassCard>
          <GlassCard title="Scene" className="w-full">
            <div className="space-y-2">
              <ColorField
                value={scene.viewport.background.topColor}
                onChange={(value) =>
                  setViewportBackground({
                    topColor: value,
                    bottomColor: scene.viewport.background.bottomColor
                  })
                }
              />
              <ColorField
                value={scene.viewport.background.bottomColor}
                onChange={(value) =>
                  setViewportBackground({
                    topColor: scene.viewport.background.topColor,
                    bottomColor: value
                  })
                }
              />
            </div>
          </GlassCard>
          <GlassCard title="Adjust" className="w-full">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-10 w-full items-center justify-center rounded-[16px] bg-black px-4 text-[16px] tracking-[-0.04em] text-white transition hover:bg-[#111]"
              >
                Upload SVG
              </button>
              <SliderField
                label="Depth"
                value={object?.params.depth ?? 4}
                min={1}
                max={12}
                step={0.1}
                onChange={(value) => object && updateGeometryDepth(object.id, value)}
              />
              <SliderField
                label="Bevel"
                value={object?.params.bevelSize ?? 0.35}
                min={0}
                max={1.5}
                step={0.01}
                onChange={(value) =>
                  object &&
                  updateGeometryBevel(object.id, {
                    bevelEnabled: value > 0.02,
                    bevelSize: value,
                    bevelThickness: Number((value * 1.28).toFixed(2)),
                    bevelSegments: value > 0.02 ? 2 : 0
                  })
                }
              />
              <SliderField
                label="Ring"
                value={object?.params.ringHoleRadius ?? 1.2}
                min={0.5}
                max={3}
                step={0.05}
                onChange={(value) => object && updateRingHoleRadius(object.id, value)}
              />
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );

  return (
    <EditorShell
      stageStyle={stageStyle}
      brand={<BrandBadge title="Key Ma Name" subtitle="Custom Key Tags" icon={<GridIcon />} />}
      toolbar={desktopToolbar}
      leftSidebar={materialSidebar}
      rightSidebar={sceneSidebar}
      centerPanel={shapePanel}
      bottomRail={bottomRail}
      mobilePanel={mobilePanel}
      viewport={
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.95),transparent_58%)]" />
          <KeychainCanvas scene={scene} className="h-full w-full" />
          {publishSlug ? (
            <a
              href={`/s/${publishSlug}`}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-4 right-4 rounded-full bg-black/60 px-4 py-2 text-sm text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:right-[50px] lg:top-[122px] lg:bottom-auto"
            >
              Open share page
            </a>
          ) : null}
        </div>
      }
    />
  );
}
