import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 text-stone-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Three.js Product Configurator</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight md:text-6xl">
              Build animated custom keychain scenes from SVG shapes.
            </h1>
            <p className="max-w-2xl text-lg text-stone-300">
              Author geometry, materials, lighting, motion, timeline cues and hosted share pages from a single
              scene contract.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/editor"
                className="rounded-full bg-amber-300 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-200"
              >
                Open editor
              </Link>
              <a
                href="#stack"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-stone-100 transition hover:border-white/35"
              >
                Review stack
              </a>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-6 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "SVG import + normalization",
                "Extrusion + bevel controls",
                "Material presets + decals",
                "Timeline + keyframe-ready scene",
                "Snapshot + video export",
                "Hosted share viewer"
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="stack" className="grid gap-4 lg:grid-cols-3">
          {[
            ["Editor", "Next.js 15, React 19, Zustand, TanStack Query"],
            ["Runtime", "Three.js, R3F, shared SceneDocument schema"],
            ["Export", "Browser snapshots plus worker render queue"]
          ].map(([title, description]) => (
            <div key={title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">{title}</p>
              <p className="mt-3 text-lg font-medium text-white">{description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
