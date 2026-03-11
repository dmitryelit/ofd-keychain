"use client";

import { createMediaRecorderExport, createRenderJobPayload } from "@ofd-keychain/export-core";
import { InspectorPanel, EditorShell, TimelinePanel, Toolbar } from "@ofd-keychain/editor-ui";
import { KeychainCanvas } from "@ofd-keychain/render-engine";
import type { ShapeAsset } from "@ofd-keychain/scene-core";
import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";
import { useEditorStore, type EditorState } from "@/lib/state/editor-store";
import { loadDraft, saveDraft } from "@/lib/storage/drafts";
import { trackEvent } from "@/lib/telemetry";

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as T;
}

export function EditorExperience() {
  const [status, setStatus] = useState("Ready");
  const [isPending, startTransition] = useTransition();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [svgMarkup, setSvgMarkup] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"scene" | "timeline">("scene");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const scene = useEditorStore((state: EditorState) => state.scene);
  const projectId = useEditorStore((state: EditorState) => state.projectId);
  const projectTitle = useEditorStore((state: EditorState) => state.projectTitle);
  const selectedObjectId = useEditorStore((state: EditorState) => state.selectedObjectId);
  const currentTimeMs = useEditorStore((state: EditorState) => state.currentTimeMs);
  const publishSlug = useEditorStore((state: EditorState) => state.publishSlug);
  const setProjectIdentity = useEditorStore((state: EditorState) => state.setProjectIdentity);
  const hydrate = useEditorStore((state: EditorState) => state.hydrate);
  const updateMaterial = useEditorStore((state: EditorState) => state.updateMaterial);
  const updateGeometryDepth = useEditorStore((state: EditorState) => state.updateGeometryDepth);
  const setAutoRotate = useEditorStore((state: EditorState) => state.setAutoRotate);
  const replaceShapeAsset = useEditorStore((state: EditorState) => state.replaceShapeAsset);
  const setTime = useEditorStore((state: EditorState) => state.setTime);
  const setPublishSlug = useEditorStore((state: EditorState) => state.setPublishSlug);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    startTransition(() => {
      void (async () => {
        try {
          const project = await fetchJson<{
            project: { id: string; title: string; scene: typeof scene };
          }>("/api/projects", { method: "POST" });
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
  }, [hydrate, scene, setProjectIdentity]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveDraft(projectId, scene);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [projectId, scene]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let raf = 0;
    const duration = scene.timeline.durationMs;
    const startedAt = performance.now() - currentTimeMs;

    const tick = (timestamp: number) => {
      const elapsed = timestamp - startedAt;
      const nextTime = scene.timeline.loop ? elapsed % duration : Math.min(elapsed, duration);
      setTime(nextTime);

      if (!scene.timeline.loop && elapsed >= duration) {
        setIsPlaying(false);
        return;
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [currentTimeMs, isPlaying, scene.timeline.durationMs, scene.timeline.loop, setTime]);

  const material = scene.materials[0];
  const object = scene.objects[0];

  async function applySvgMarkup(markup: string) {
    const result = await fetchJson<{
      asset: Pick<ShapeAsset, "id" | "name" | "normalizedSvgMarkup" | "viewBox">;
    }>("/api/assets/svg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markup })
    });

    replaceShapeAsset(result.asset);
  }

  async function handleSvgImport() {
    try {
      await applySvgMarkup(svgMarkup);
      setStatus("SVG normalized and applied");
      trackEvent("svg_imported");
    } catch (error) {
      console.error(error);
      setStatus("SVG import failed");
    }
  }

  async function handleSvgFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      await applySvgMarkup(await file.text());
      setStatus(`Loaded ${file.name}`);
      trackEvent("svg_file_loaded", { name: file.name });
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
    link.download = `${projectTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
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
      link.download = `${projectTitle.toLowerCase().replace(/\s+/g, "-")}.webm`;
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

  async function handleQueueRender() {
    try {
      const payload = createRenderJobPayload(scene);
      const result = await fetchJson<{ renderJob: { id: string; status: string } }>("/api/render-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, payload })
      });
      setStatus(`Render job queued: ${result.renderJob.id}`);
      trackEvent("render_job_queued", result.renderJob);
    } catch (error) {
      console.error(error);
      setStatus("Render queue failed");
    }
  }

  function togglePlayback() {
    setIsPlaying((value) => !value);
    setStatus(isPlaying ? "Paused preview" : "Playing timeline");
  }

  const inspectorControls = (
    <div className="pointer-events-auto mt-3 space-y-3 rounded-[24px] border border-black/10 bg-white/78 p-4 text-stone-900 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="grid grid-cols-1 gap-3">
        <label className="space-y-2">
          <span className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Color</span>
          <input
            type="color"
            value={material?.color ?? "#d4d4d8"}
            onChange={(event) => material && updateMaterial(material.id, { color: event.target.value })}
            className="h-10 w-full rounded-2xl border border-black/10 bg-white"
          />
        </label>
        <label className="space-y-2">
          <span className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Depth</span>
          <input
            type="range"
            min={1}
            max={12}
            step={0.5}
            value={object?.params.depth ?? 4}
            onChange={(event) => object && updateGeometryDepth(object.id, Number(event.target.value))}
            className="mt-1 w-full accent-stone-900"
          />
        </label>
      </div>
      <div className="flex items-center justify-between rounded-3xl border border-black/10 bg-white/70 px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Motion</p>
          <p className="mt-1 text-sm text-stone-600">Orbit auto-rotation</p>
        </div>
        <button
          onClick={() => setAutoRotate(!scene.cameraRig.autoRotate)}
          className="rounded-full border border-black/10 px-3 py-1 text-xs text-stone-900 transition hover:bg-black/5"
        >
          {scene.cameraRig.autoRotate ? "On" : "Off"}
        </button>
      </div>
      <div className="space-y-3 rounded-3xl border border-black/10 bg-white/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Shape</p>
            <p className="mt-1 text-sm text-stone-600">Upload or paste SVG</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-black/10 px-3 py-1 text-xs text-stone-900 transition hover:bg-black/5"
          >
            Load SVG
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" hidden onChange={handleSvgFileChange} />
        <textarea
          value={svgMarkup}
          onChange={(event) => setSvgMarkup(event.target.value)}
          placeholder="<svg ...>...</svg>"
          className="min-h-24 w-full rounded-3xl border border-black/10 bg-white px-3 py-3 text-sm text-stone-800 placeholder:text-stone-400"
        />
        <button
          onClick={handleSvgImport}
          className="w-full rounded-full border border-black/10 px-4 py-2 text-sm text-stone-900 transition hover:bg-black/5"
        >
          Apply pasted SVG
        </button>
        {publishSlug ? (
          <a
            href={`/s/${publishSlug}`}
            target="_blank"
            rel="noreferrer"
            className="block rounded-3xl border border-black/10 bg-white px-4 py-3 text-sm text-stone-800"
          >
            Open hosted share page
          </a>
        ) : null}
      </div>
    </div>
  );

  const timelineControls = (
    <div className="pointer-events-auto mt-3 rounded-[24px] border border-black/10 bg-white/78 p-4 text-stone-900 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={togglePlayback}
          className="rounded-full border border-black/10 px-4 py-2 text-sm text-stone-900 transition hover:bg-black/5"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => {
            setIsPlaying(false);
            setTime(0);
          }}
          className="rounded-full border border-black/10 px-4 py-2 text-sm text-stone-600 transition hover:bg-black/5"
        >
          Reset
        </button>
        <div className="rounded-full border border-black/10 px-3 py-2 text-xs text-stone-500">
          {scene.timeline.fps} fps / {scene.timeline.durationMs} ms
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={scene.timeline.durationMs}
        value={currentTimeMs}
        onChange={(event) => {
          setIsPlaying(false);
          setTime(Number(event.target.value));
        }}
        className="mt-4 w-full accent-stone-900"
      />
    </div>
  );

  return (
    <EditorShell
      topBar={
        <Toolbar
          projectTitle={projectTitle}
          actions={
            <>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-stone-300">
                {isPending ? "Booting..." : status}
              </div>
              <button
                onClick={togglePlayback}
                className="rounded-full border border-black/10 bg-white/85 px-4 py-2 text-sm text-stone-900 transition hover:bg-white"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                onClick={handleSnapshotExport}
                className="rounded-full border border-black/10 bg-white/85 px-4 py-2 text-sm text-stone-900 transition hover:bg-white"
              >
                Snapshot
              </button>
              <button
                onClick={handleClipExport}
                disabled={isRecording}
                className="rounded-full border border-black/10 bg-white/85 px-4 py-2 text-sm text-stone-900 transition hover:bg-white disabled:opacity-50"
              >
                {isRecording ? "Recording..." : "Clip"}
              </button>
              <button
                onClick={handleQueueRender}
                className="rounded-full border border-black/10 bg-white/85 px-4 py-2 text-sm text-stone-900 transition hover:bg-white"
              >
                Queue render
              </button>
              <button
                onClick={handlePublish}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-stone-200"
              >
                Publish
              </button>
            </>
          }
        />
      }
      inspector={
        <div className="flex h-full flex-col">
          <InspectorPanel scene={scene} selectedObjectId={selectedObjectId} />
          {inspectorControls}
        </div>
      }
      timeline={
        <div>
          <TimelinePanel scene={scene} currentTimeMs={currentTimeMs} />
          {timelineControls}
        </div>
      }
      mobilePanel={
        <div className="space-y-3">
              <div className="pointer-events-auto flex gap-2 rounded-full border border-black/10 bg-white/78 p-1 text-stone-900 backdrop-blur-xl">
            <button
              onClick={() => setMobilePanel("scene")}
              className={`flex-1 rounded-full px-3 py-2 text-sm transition ${
                mobilePanel === "scene" ? "bg-stone-900 text-white" : "text-stone-600"
              }`}
            >
              Scene
            </button>
            <button
              onClick={() => setMobilePanel("timeline")}
              className={`flex-1 rounded-full px-3 py-2 text-sm transition ${
                mobilePanel === "timeline" ? "bg-stone-900 text-white" : "text-stone-600"
              }`}
            >
              Timeline
            </button>
          </div>
          {mobilePanel === "scene" ? (
            <div className="max-h-[55vh] overflow-y-auto">
              <InspectorPanel scene={scene} selectedObjectId={selectedObjectId} />
              {inspectorControls}
            </div>
          ) : (
            <div>
              <TimelinePanel scene={scene} currentTimeMs={currentTimeMs} />
              {timelineControls}
            </div>
          )}
        </div>
      }
      viewport={<KeychainCanvas scene={scene} playbackTimeMs={currentTimeMs} className="h-screen w-screen" />}
    />
  );
}
