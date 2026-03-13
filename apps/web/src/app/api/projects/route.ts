import { NextResponse } from "next/server";
import { getProjectRepository } from "@/lib/server/project-repository";
import { createInitialProjectScene } from "@/lib/server/scene-bootstrap";

export async function POST() {
  const repository = await getProjectRepository();
  const scene = await createInitialProjectScene();
  const project = await repository.createProject({
    title: scene.meta.title,
    scene
  });

  return NextResponse.json({ project });
}
