import { KeychainCanvas } from "@ofd-keychain/render-engine";
import { notFound } from "next/navigation";
import { getProjectRepository } from "@/lib/server/project-repository";

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const repository = await getProjectRepository();
  const project = await repository.getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <KeychainCanvas scene={project.scene} readOnly autoplayTimeline className="h-screen w-screen" />
      <aside className="pointer-events-none absolute inset-x-3 top-3 z-20 flex justify-between gap-3 sm:inset-x-5 sm:top-5">
        <div className="pointer-events-auto max-w-md rounded-[28px] border border-white/10 bg-black/45 px-4 py-3 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-[0.32em] text-stone-500">Hosted share</p>
          <h1 className="mt-2 text-lg font-medium text-white sm:text-2xl">{project.title}</h1>
          <p className="mt-2 text-sm text-stone-400">Interactive read-only scene generated from the published document.</p>
        </div>
        <div className="pointer-events-auto hidden rounded-[28px] border border-white/10 bg-black/45 px-4 py-3 text-sm text-stone-300 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:block">
          {project.scene.objects.length} object · {project.scene.lights.length} lights · {project.scene.timeline.durationMs}ms
        </div>
      </aside>
    </main>
  );
}
