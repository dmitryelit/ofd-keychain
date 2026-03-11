import type { RenderJobPayload } from "@ofd-keychain/export-core";
import type { Prisma } from "@prisma/client";
import type { ProjectRepository } from "./types";
import type { ProjectRecord, RenderJobRecord } from "./types";
import { readDb, writeDb } from "./file-store";

function createSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function now() {
  return new Date().toISOString();
}

function decorateSlug(baseSlug: string, taken: Set<string>) {
  let slug = baseSlug || "scene";
  let index = 1;

  while (taken.has(slug)) {
    slug = `${baseSlug}-${index++}`;
  }

  return slug;
}

async function createFileRepository(): Promise<ProjectRepository> {
  return {
    async createProject(input) {
      const db = await readDb();
      const record: ProjectRecord = {
        id: crypto.randomUUID(),
        slug: null,
        title: input.title,
        status: "draft",
        coverAssetId: input.scene.assets[0]?.id ?? null,
        publishedSceneVersionId: null,
        scene: input.scene,
        createdAt: now(),
        updatedAt: now()
      };
      db.projects.push(record);
      await writeDb(db);
      return record;
    },
    async getProject(id) {
      const db = await readDb();
      return db.projects.find((entry) => entry.id === id) ?? null;
    },
    async updateProject(id, scene, title) {
      const db = await readDb();
      const record = db.projects.find((entry) => entry.id === id);

      if (!record) {
        return null;
      }

      record.scene = scene;
      record.title = title ?? record.title;
      record.coverAssetId = scene.assets[0]?.id ?? record.coverAssetId;
      record.updatedAt = now();
      await writeDb(db);
      return record;
    },
    async publishProject(id, scene) {
      const db = await readDb();
      const record = db.projects.find((entry) => entry.id === id);

      if (!record) {
        return null;
      }

      const existingSlugs = new Set(db.projects.map((entry) => entry.slug).filter(Boolean) as string[]);
      record.scene = scene;
      record.slug = decorateSlug(createSlug(record.title), existingSlugs);
      record.status = "published";
      record.publishedSceneVersionId = crypto.randomUUID();
      record.updatedAt = now();
      await writeDb(db);
      return record;
    },
    async getProjectBySlug(slug) {
      const db = await readDb();
      return db.projects.find((entry) => entry.slug === slug && entry.status === "published") ?? null;
    },
    async enqueueRenderJob(projectId, payload) {
      const db = await readDb();
      const job: RenderJobRecord = {
        id: crypto.randomUUID(),
        projectId,
        status: "queued",
        output: payload.output,
        fps: payload.fps,
        durationMs: payload.durationMs,
        resultUrl: null,
        payload,
        createdAt: now(),
        updatedAt: now()
      };
      db.renderJobs.push(job);
      await writeDb(db);
      return job;
    },
    async getRenderJob(id) {
      const db = await readDb();
      return db.renderJobs.find((entry) => entry.id === id) ?? null;
    }
  };
}

async function createPrismaRepository(): Promise<ProjectRepository> {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  return {
    async createProject(input) {
      const created = await prisma.project.create({
        data: {
          title: input.title,
          slug: `draft-${crypto.randomUUID().slice(0, 8)}`,
          status: "draft",
          coverAssetId: input.scene.assets[0]?.id ?? null,
          sceneVersions: {
            create: {
              sceneJson: input.scene
            }
          }
        },
        include: {
          sceneVersions: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      });

      const latestScene = created.sceneVersions[0]?.sceneJson;

      return {
        id: created.id,
        slug: null,
        title: created.title,
        status: created.status as ProjectRecord["status"],
        coverAssetId: created.coverAssetId,
        publishedSceneVersionId: created.publishedSceneVersionId,
        scene: latestScene as ProjectRecord["scene"],
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString()
      };
    },
    async getProject(id) {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          sceneVersions: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      });

      if (!project) {
        return null;
      }

      return {
        id: project.id,
        slug: project.status === "published" ? project.slug : null,
        title: project.title,
        status: project.status as ProjectRecord["status"],
        coverAssetId: project.coverAssetId,
        publishedSceneVersionId: project.publishedSceneVersionId,
        scene: project.sceneVersions[0]?.sceneJson as ProjectRecord["scene"],
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      };
    },
    async updateProject(id, scene, title) {
      const updated = await prisma.project.update({
        where: { id },
        data: {
          title,
          coverAssetId: scene.assets[0]?.id ?? null,
          sceneVersions: {
            create: {
              sceneJson: scene
            }
          }
        },
        include: {
          sceneVersions: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      });

      return {
        id: updated.id,
        slug: updated.status === "published" ? updated.slug : null,
        title: updated.title,
        status: updated.status as ProjectRecord["status"],
        coverAssetId: updated.coverAssetId,
        publishedSceneVersionId: updated.publishedSceneVersionId,
        scene: updated.sceneVersions[0]?.sceneJson as ProjectRecord["scene"],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString()
      };
    },
    async publishProject(id, scene) {
      const project = await prisma.project.findUnique({ where: { id } });

      if (!project) {
        return null;
      }

      const slug = createSlug(project.title) || `scene-${project.id.slice(0, 6)}`;
      const publishedVersionId = crypto.randomUUID();

      const updated = await prisma.project.update({
        where: { id },
        data: {
          status: "published",
          slug,
          coverAssetId: scene.assets[0]?.id ?? null,
          publishedSceneVersionId: publishedVersionId,
          sceneVersions: {
            create: {
              id: publishedVersionId,
              sceneJson: scene
            }
          }
        },
        include: {
          sceneVersions: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      });

      return {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        status: updated.status as ProjectRecord["status"],
        coverAssetId: updated.coverAssetId,
        publishedSceneVersionId: updated.publishedSceneVersionId,
        scene: updated.sceneVersions[0]?.sceneJson as ProjectRecord["scene"],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString()
      };
    },
    async getProjectBySlug(slug) {
      const project = await prisma.project.findUnique({ where: { slug } });

      if (!project || project.status !== "published") {
        return null;
      }

      const sceneVersion = project.publishedSceneVersionId
        ? await prisma.sceneVersion.findUnique({ where: { id: project.publishedSceneVersionId } })
        : await prisma.sceneVersion.findFirst({
            where: { projectId: project.id },
            orderBy: { createdAt: "desc" }
          });

      return {
        id: project.id,
        slug: project.slug,
        title: project.title,
        status: project.status as ProjectRecord["status"],
        coverAssetId: project.coverAssetId,
        publishedSceneVersionId: project.publishedSceneVersionId,
        scene: sceneVersion?.sceneJson as ProjectRecord["scene"],
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      };
    },
    async enqueueRenderJob(projectId, payload) {
      const created = await prisma.renderJob.create({
        data: {
          projectId,
          status: "queued",
          output: payload.output,
          fps: payload.fps,
          durationMs: payload.durationMs,
          payloadJson: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue
        }
      });

      return {
        id: created.id,
        projectId: created.projectId,
        status: created.status as RenderJobRecord["status"],
        output: created.output as RenderJobRecord["output"],
        fps: created.fps,
        durationMs: created.durationMs,
        resultUrl: created.resultUrl,
        payload: created.payloadJson as unknown as RenderJobPayload,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString()
      };
    },
    async getRenderJob(id) {
      const job = await prisma.renderJob.findUnique({ where: { id } });

      if (!job) {
        return null;
      }

      return {
        id: job.id,
        projectId: job.projectId,
        status: job.status as RenderJobRecord["status"],
        output: job.output as RenderJobRecord["output"],
        fps: job.fps,
        durationMs: job.durationMs,
        resultUrl: job.resultUrl,
        payload: job.payloadJson as unknown as RenderJobPayload,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString()
      };
    }
  };
}

let repositoryPromise: Promise<ProjectRepository> | null = null;

export function getProjectRepository() {
  if (!repositoryPromise) {
    repositoryPromise = process.env.DATABASE_URL ? createPrismaRepository() : createFileRepository();
  }

  return repositoryPromise;
}
