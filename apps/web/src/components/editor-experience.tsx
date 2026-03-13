"use client";

import { createMediaRecorderExport } from "@ofd-keychain/export-core";
import { KeychainCanvas } from "@ofd-keychain/render-engine";
import type { MaterialDefinition, ShapeAsset } from "@ofd-keychain/scene-core";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { loadDraft, saveDraft } from "@/lib/storage/drafts";
import { useEditorStore, type EditorPanel, type EditorState } from "@/lib/state/editor-store";
import { trackEvent } from "@/lib/telemetry";

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

function BrandMarkIcon() {
  return (
    <svg viewBox="0 0 40 40" className="size-10 text-white" fill="currentColor" aria-hidden="true">
      <path d="M5 9.688A4.687 4.687 0 0 1 9.687 5h4.688v9.688H9.687A4.687 4.687 0 0 1 5 9.687Z" />
      <path d="M16.562 5H31.25L23.906 12.344 16.562 5Z" />
      <path d="M16.562 20 23.906 12.656 31.25 20 23.906 27.344 16.562 20Z" />
      <path d="M5 30.312a4.687 4.687 0 0 1 4.687-4.687h4.688V35H9.687A4.687 4.687 0 0 1 5 30.312Z" />
      <path d="M16.562 35V20.312h14.688L16.562 35Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="square">
      <path d="M3.75781 3.75781 12.2426 12.2426" />
      <path d="M12.2426 3.75781 3.75781 12.2426" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6667" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.028 2.5c.585 0 1.128.307 1.429 0.809l.644 1.072c.075.125.211.202.357.202h1.375A2.5 2.5 0 0 1 18.333 7.083V15a2.5 2.5 0 0 1-2.5 2.5H4.167a2.5 2.5 0 0 1-2.5-2.5V7.083a2.5 2.5 0 0 1 2.5-2.5h1.375c.146 0 .282-.077.357-.202l.644-1.072A1.667 1.667 0 0 1 7.972 2.5h4.056Z" />
      <path d="M10 14.583a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666Z" />
    </svg>
  );
}

function VideoDownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6667" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.333 3.333c.46 0 .834.373.834.833v3.5l4.344-3.04a.417.417 0 0 1 .655.34v10.066a.417.417 0 0 1-.655.34l-4.344-3.04v3.5a.833.833 0 0 1-.834.834H2.5a.833.833 0 0 1-.833-.834V4.166c0-.46.373-.833.833-.833h10.833Z" />
      <path d="M10 7.5v5" />
      <path d="M8.125 10.625 10 12.5l1.875-1.875" />
    </svg>
  );
}

function UploadCloudIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6667" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.833 17.5c-2.797-.213-5-2.55-5-5.417 0-1.94 1.02-3.642 2.554-4.599C3.804 4.203 6.606 1.667 10 1.667c3.394 0 6.196 2.536 6.613 5.817 1.533.957 2.554 2.659 2.554 4.599 0 2.867-2.203 5.204-5 5.417H5.833Z" />
      <path d="M10 13.333V8.333" />
      <path d="m7.917 10.417 2.083-2.084 2.083 2.084" />
    </svg>
  );
}

function AppsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6667" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.625 2.083A3.542 3.542 0 0 1 9.167 5.625v3.542H5.625A3.542 3.542 0 0 1 2.083 5.625 3.542 3.542 0 0 1 5.625 2.083Z" />
      <path d="M14.375 2.083A3.542 3.542 0 1 1 10.833 5.625a3.542 3.542 0 0 1 3.542-3.542Z" />
      <path d="M5.625 10.833h3.542v3.542a3.542 3.542 0 1 1-3.542-3.542Z" />
      <path d="M13.75 12.5h4.167v1.875a3.542 3.542 0 1 1-7.084 0c0-1.036.84-1.875 1.875-1.875H13.75Z" />
    </svg>
  );
}

function StageStyle(topColor: string, bottomColor: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(180deg, ${topColor} 15.869%, #175f47 57.935%, ${bottomColor} 100%)`,
    backgroundColor: topColor
  };
}

function ToolbarButton({
  onClick,
  title,
  children,
  disabled = false
}: {
  onClick?: () => void;
  title: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-[16px] bg-black p-2 text-white transition hover:bg-[#111] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  widthClass,
  onClose,
  children
}: {
  title: string;
  widthClass: string;
  onClose?: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-[16px] bg-[#222] p-2 ${widthClass}`}>
      <div className="relative flex h-4 items-center justify-center">
        <p className="text-center text-[14px] tracking-[-0.05em] text-white">{title}</p>
        <button
          type="button"
          aria-label={`Close ${title}`}
          onClick={onClose}
          className="absolute right-0 top-0 inline-flex size-4 items-center justify-center text-white/90 transition hover:text-white"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-center text-[14px] tracking-[-0.05em] text-[#808080]">{children}</p>;
}

function MaterialTile({
  active,
  src,
  alt,
  onClick
}: {
  active: boolean;
  src: string;
  alt: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center rounded-[12px] p-2 transition ${active ? "bg-[#4c4c4c]" : "bg-[#2f2f2f] hover:bg-[#3a3a3a]"}`}
    >
      <img src={src} alt={alt} className="size-16 rounded-full object-cover" />
    </button>
  );
}

function ShapeTile({
  active,
  asset,
  onClick
}: {
  active: boolean;
  asset: ShapeAsset;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex size-20 items-center justify-center rounded-[12px] p-2 transition ${active ? "bg-[#4c4c4c]" : "bg-[#2f2f2f] hover:bg-[#3a3a3a]"}`}
    >
      {asset.sourceSvgUrl ? (
        <img src={asset.sourceSvgUrl} alt={asset.name} className="size-16 object-contain" />
      ) : (
        <div className="flex size-16 items-center justify-center" dangerouslySetInnerHTML={{ __html: asset.normalizedSvgMarkup }} />
      )}
    </button>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex h-10 w-40 items-center justify-between overflow-clip rounded-[12px] bg-black p-2">
      <span className="text-[14px] tracking-[-0.04em] text-white">{value.toUpperCase()}</span>
      <label className="relative block h-6 w-[54px] overflow-hidden rounded-[4px]">
        <span className="absolute inset-0 block" style={{ backgroundColor: value }} />
        <input
          type="color"
          aria-label="Color picker"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
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
    <label className="relative flex h-10 w-40 items-center justify-center overflow-clip rounded-[12px] bg-black p-2">
      <span className="absolute inset-y-0 left-0 bg-[#4c4c4c]" style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} />
      <span className="relative z-10 text-[14px] tracking-[-0.04em] text-white">{label}</span>
      <input
        type="range"
        aria-label={label}
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

function PreviewChip({
  preview,
  alt,
  onClick
}: {
  preview: ReactNode;
  alt: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={alt}
      onClick={onClick}
      className="inline-flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#222] p-2 transition hover:bg-[#2b2b2b]"
    >
      <span className="inline-flex size-10 items-center justify-center rounded-[8px] bg-[#424242]">{preview}</span>
    </button>
  );
}

function BackgroundModeControl() {
  return (
    <div className="flex w-full items-start gap-[2px] rounded-[12px] bg-black p-[2px]">
      <div className="flex min-w-[40px] flex-1 items-center justify-center rounded-[16px] px-2 py-1">
        <span className="block size-[14px] rounded-full border border-dashed border-white/95" />
      </div>
      <div className="flex min-w-[40px] flex-1 items-center justify-center rounded-[16px] px-2 py-1">
        <span className="block size-[14px] rounded-full bg-white" />
      </div>
      <div className="flex min-w-[40px] flex-1 items-center justify-center rounded-[10px] bg-[#2f2f2f] px-2 py-1">
        <span className="block size-[14px] rounded-full bg-[radial-gradient(circle_at_50%_40%,#84d6bb_0%,#175f47_100%)]" />
      </div>
    </div>
  );
}

function MobileFallback({
  status,
  onSnapshot,
  onClip,
  onPublish,
  isRecording
}: {
  status: string;
  onSnapshot: () => void;
  onClip: () => void;
  onPublish: () => void;
  isRecording: boolean;
}) {
  return (
    <div className="relative z-20 flex min-h-screen flex-col justify-between p-4 lg:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-[16px] bg-[#222] p-2">
          <div className="flex h-10 items-center gap-[6px]">
            <BrandMarkIcon />
            <div className="leading-none">
              <p className="text-[18px] font-semibold tracking-[-0.07em] text-white">Key Ma Name</p>
              <p className="mt-0.5 text-[18px] tracking-[-0.07em] text-white">Custom Key Tags</p>
            </div>
          </div>
        </div>
        <div className="rounded-[16px] bg-[#222] p-2">
          <div className="flex gap-1">
            <ToolbarButton title="Snapshot" onClick={onSnapshot}>
              <CameraIcon />
            </ToolbarButton>
            <ToolbarButton title="Clip" onClick={onClip} disabled={isRecording}>
              <VideoDownloadIcon />
            </ToolbarButton>
            <ToolbarButton title="Publish" onClick={onPublish}>
              <UploadCloudIcon />
            </ToolbarButton>
          </div>
        </div>
      </div>
      <div className="rounded-[16px] bg-[#222]/92 p-4 text-sm text-white/80">{status}</div>
    </div>
  );
}

export function EditorExperience() {
  const [status, setStatus] = useState("Ready");
  const [isPending, startTransition] = useTransition();
  const [isRecording, setIsRecording] = useState(false);
  const [materialPresets, setMaterialPresets] = useState<MaterialPreset[]>([]);
  const [shapePresets, setShapePresets] = useState<ShapePreset[]>([]);
  const initialized = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scene = useEditorStore((state: EditorState) => state.scene);
  const projectId = useEditorStore((state: EditorState) => state.projectId);
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
            setStatus("Ready");
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
  const activeMaterialPreset = materialPresets.find((preset) => preset.material.id === material?.id) ?? materialPresets[0];
  const activeScenePreview = activeMaterialPreset ?? materialPresets[0];

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

  async function handleSnapshotExport() {
    const canvas = document.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement)) {
      setStatus("Canvas not ready");
      return;
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
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

  function togglePanel(panel: EditorPanel) {
    togglePanelCollapsed(panel);
  }

  const stageStyle = StageStyle(scene.viewport.background.topColor, scene.viewport.background.bottomColor);

  return (
    <main className="relative min-h-screen overflow-hidden text-white" style={stageStyle}>
      <div className="absolute inset-x-0 top-0 h-[180px] bg-gradient-to-b from-black/90 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_50%_34%,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0)_46%)]" />
      <div className="absolute inset-0 hidden lg:block">
        <KeychainCanvas scene={scene} className="h-full w-full" />
      </div>

      <div className="absolute left-[50px] top-[50px] z-30 hidden h-14 rounded-[16px] bg-[#222] p-2 lg:flex">
        <div className="flex items-center gap-[6px]">
          <BrandMarkIcon />
          <div className="leading-none">
            <p className="text-[18px] font-semibold tracking-[-0.07em] text-white">Key Ma Name</p>
            <p className="mt-0.5 text-[18px] tracking-[-0.07em] text-white">Custom Key Tags</p>
          </div>
        </div>
      </div>

      <div className="absolute right-[50px] top-[50px] z-30 hidden rounded-[16px] bg-[#222] p-2 lg:block">
        <div className="flex gap-1">
          <ToolbarButton title="Snapshot" onClick={handleSnapshotExport}>
            <CameraIcon />
          </ToolbarButton>
          <ToolbarButton title="Clip export" onClick={handleClipExport} disabled={isRecording}>
            <VideoDownloadIcon />
          </ToolbarButton>
          <ToolbarButton title="Publish" onClick={handlePublish}>
            <UploadCloudIcon />
          </ToolbarButton>
        </div>
      </div>

      <div className="absolute bottom-[50px] left-[50px] z-30 hidden w-[364px] flex-wrap content-end items-end gap-x-2 gap-y-4 lg:flex">
        {!collapsedPanels.material ? (
          <>
            <Panel title="Material" widthClass="w-[180px]" onClose={() => togglePanel("material")}>
              <div className="flex flex-col items-center gap-4">
                <SectionLabel>Basics</SectionLabel>
                <div className="grid w-full grid-cols-2 gap-1">
                  {materialPresets.map((preset) => (
                    <MaterialTile
                      key={preset.id}
                      active={preset.material.id === material?.id}
                      src={preset.previewUrl}
                      alt={preset.name}
                      onClick={() => applyMaterialPreset(preset.material)}
                    />
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Edit Material" widthClass="w-[176px]" onClose={() => togglePanel("material")}>
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-4">
                  <SectionLabel>Color</SectionLabel>
                  <ColorField value={material?.color ?? "#ffffff"} onChange={(value) => material && updateMaterialAppearance(material.id, { color: value })} />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <SectionLabel>Appearance</SectionLabel>
                  <div className="flex flex-col gap-2">
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
            </Panel>
          </>
        ) : null}

        <PreviewChip
          alt="Material preview"
          onClick={collapsedPanels.material ? () => togglePanel("material") : undefined}
          preview={
            activeMaterialPreset ? (
              <img src={activeMaterialPreset.previewUrl} alt={activeMaterialPreset.name} className="size-8 rounded-full object-cover" />
            ) : (
              <span className="block size-8 rounded-full bg-white/60" />
            )
          }
        />
      </div>

      <div className="absolute bottom-[50px] right-[50px] z-30 hidden w-[180px] flex-col items-end gap-4 lg:flex">
        {!collapsedPanels.scene ? (
          <Panel title="Scene" widthClass="w-full" onClose={() => togglePanel("scene")}>
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-4">
                <SectionLabel>Background Color</SectionLabel>
                <div className="flex flex-col gap-2">
                  <BackgroundModeControl />
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

              <div className="flex w-full flex-col items-center gap-4">
                <SectionLabel>HDRIs</SectionLabel>
                <div className="grid w-full grid-cols-2 gap-1">
                  {materialPresets.map((preset) => (
                    <MaterialTile key={`scene-${preset.id}`} active={false} src={preset.previewUrl} alt={preset.name} onClick={() => undefined} />
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        ) : null}

        <PreviewChip
          alt="Scene preview"
          onClick={collapsedPanels.scene ? () => togglePanel("scene") : undefined}
          preview={
            activeScenePreview ? (
              <img src={activeScenePreview.previewUrl} alt={activeScenePreview.name} className="size-8 rounded-full object-cover" />
            ) : (
              <span className="block size-8 rounded-full bg-white/60" />
            )
          }
        />
      </div>

      <div className="absolute bottom-[50px] left-1/2 z-30 hidden w-[584px] -translate-x-1/2 flex-col gap-4 lg:flex">
        {!collapsedPanels.shape ? (
          <Panel title="Shape" widthClass="w-[180px]" onClose={() => togglePanel("shape")}>
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-10 w-full items-center justify-center rounded-[16px] bg-black px-4 text-[16px] tracking-[-0.04em] text-white transition hover:bg-[#111]"
              >
                Upload SVG
              </button>
              <input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" hidden onChange={handleSvgFileChange} />
              <SectionLabel>Basics</SectionLabel>
              <div className="grid w-full grid-cols-2 gap-1">
                {shapePresets.map((preset) => (
                  <ShapeTile key={preset.id} active={preset.asset.id === scene.assets[0]?.id} asset={preset.asset} onClick={() => applyShapePreset(preset.asset)} />
                ))}
              </div>
            </div>
          </Panel>
        ) : null}

        <div className="flex w-full items-start justify-center gap-4 rounded-[16px] bg-[#222] p-2">
          <ToolbarButton title="Shape presets" onClick={collapsedPanels.shape ? () => togglePanel("shape") : undefined}>
            <AppsIcon />
          </ToolbarButton>
          <SliderField label="Depth" value={object?.params.depth ?? 4} min={1} max={12} step={0.1} onChange={(value) => object && updateGeometryDepth(object.id, value)} />
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
          <SliderField label="Ring" value={object?.params.ringHoleRadius ?? 1.2} min={0.5} max={3} step={0.05} onChange={(value) => object && updateRingHoleRadius(object.id, value)} />
        </div>
      </div>

      {status !== "Ready" || isPending ? (
        <div className="absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/75 lg:block">
          {isPending ? "Loading…" : status}
        </div>
      ) : null}

      <MobileFallback status={status} onSnapshot={handleSnapshotExport} onClip={handleClipExport} onPublish={handlePublish} isRecording={isRecording} />
    </main>
  );
}
