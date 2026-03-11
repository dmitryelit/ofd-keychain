import { NextResponse } from "next/server";
import type { RenderJobPayload } from "@ofd-keychain/export-core";
import { z } from "zod";
import { getProjectRepository } from "@/lib/server/project-repository";

const requestSchema = z.object({
  projectId: z.string(),
  payload: z.object({
    output: z.enum(["mp4", "webm"]),
    fps: z.number().int().positive(),
    durationMs: z.number().int().positive(),
    resolution: z.object({
      width: z.number().int().positive(),
      height: z.number().int().positive()
    }),
    scene: z.any()
  })
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const repository = await getProjectRepository();
    const renderJob = await repository.enqueueRenderJob(body.projectId, body.payload as RenderJobPayload);

    if (process.env.RENDER_WORKER_URL) {
      fetch(`${process.env.RENDER_WORKER_URL}/jobs/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(renderJob)
      }).catch(() => undefined);
    }

    return NextResponse.json({ renderJob });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to queue render job";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
