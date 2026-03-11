import type { SceneDocument } from "@ofd-keychain/scene-core";

export interface SnapshotOptions {
  mimeType?: "image/png" | "image/jpeg";
  quality?: number;
}

export interface BrowserVideoExportOptions {
  mimeType?: string;
  fps: number;
  durationMs: number;
}

export interface RenderJobPayload {
  scene: SceneDocument;
  output: "mp4" | "webm";
  fps: number;
  durationMs: number;
  resolution: {
    width: number;
    height: number;
  };
}

export function captureCanvasSnapshot(
  canvas: HTMLCanvasElement,
  options: SnapshotOptions = {}
): Promise<Blob | null> {
  const { mimeType = "image/png", quality = 0.92 } = options;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

export function createMediaRecorderExport(
  stream: MediaStream,
  options: BrowserVideoExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: options.mimeType ?? "video/webm;codecs=vp9"
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onerror = () => reject(new Error("MediaRecorder export failed"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));

    recorder.start();
    window.setTimeout(() => recorder.stop(), options.durationMs);
  });
}

export function supportsWebCodecs() {
  return typeof window !== "undefined" && "VideoEncoder" in window;
}

export function createRenderJobPayload(
  scene: SceneDocument,
  overrides?: Partial<Omit<RenderJobPayload, "scene">>
): RenderJobPayload {
  return {
    scene,
    output: overrides?.output ?? "mp4",
    fps: overrides?.fps ?? scene.timeline.fps,
    durationMs: overrides?.durationMs ?? scene.timeline.durationMs,
    resolution: overrides?.resolution ?? { width: 1920, height: 1080 }
  };
}
