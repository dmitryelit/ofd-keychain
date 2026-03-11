import type { SceneDocument } from "@ofd-keychain/scene-core";
import type { RenderJobPayload } from "@ofd-keychain/export-core";

export interface ProjectRecord {
  id: string;
  slug: string | null;
  title: string;
  status: "draft" | "published";
  coverAssetId: string | null;
  publishedSceneVersionId: string | null;
  scene: SceneDocument;
  createdAt: string;
  updatedAt: string;
}

export interface RenderJobRecord {
  id: string;
  projectId: string;
  status: "queued" | "rendering" | "completed" | "failed";
  output: "mp4" | "webm";
  fps: number;
  durationMs: number;
  resultUrl: string | null;
  payload: RenderJobPayload;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRepository {
  createProject(input: Pick<ProjectRecord, "title" | "scene">): Promise<ProjectRecord>;
  getProject(id: string): Promise<ProjectRecord | null>;
  updateProject(id: string, scene: SceneDocument, title?: string): Promise<ProjectRecord | null>;
  publishProject(id: string, scene: SceneDocument): Promise<ProjectRecord | null>;
  getProjectBySlug(slug: string): Promise<ProjectRecord | null>;
  enqueueRenderJob(projectId: string, payload: RenderJobPayload): Promise<RenderJobRecord>;
  getRenderJob(id: string): Promise<RenderJobRecord | null>;
}
