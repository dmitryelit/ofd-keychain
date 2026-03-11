import Fastify from "fastify";
import { z } from "zod";

const app = Fastify({ logger: true });

const renderJobSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  status: z.enum(["queued", "rendering", "completed", "failed"]),
  output: z.enum(["mp4", "webm"]),
  fps: z.number(),
  durationMs: z.number(),
  resultUrl: z.string().nullable(),
  payload: z.object({
    output: z.enum(["mp4", "webm"]),
    fps: z.number(),
    durationMs: z.number(),
    resolution: z.object({
      width: z.number(),
      height: z.number()
    }),
    scene: z.any()
  })
});

app.get("/health", async () => ({
  ok: true,
  service: "render-worker",
  timestamp: new Date().toISOString()
}));

app.post("/jobs/render", async (request, reply) => {
  const job = renderJobSchema.parse(request.body);
  const baseUrl = process.env.PUBLIC_RENDER_BASE_URL ?? "http://localhost:4001";

  // This is a scaffold placeholder. Replace with Chromium/WebGL/FFmpeg rendering pipeline.
  return reply.send({
    jobId: job.id,
    status: "completed",
    resultUrl: `${baseUrl}/artifacts/${job.id}.${job.output}`,
    note: "Stub render completed. Replace with actual frame rendering pipeline."
  });
});

const port = Number(process.env.PORT ?? 4001);

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
