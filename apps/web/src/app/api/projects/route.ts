import { NextResponse } from "next/server";
import { createDefaultSceneDocument } from "@ofd-keychain/scene-core";
import { getProjectRepository } from "@/lib/server/project-repository";

export async function POST() {
  const repository = await getProjectRepository();
  const scene = createDefaultSceneDocument();
  const project = await repository.createProject({
    title: scene.meta.title,
    scene
  });

  return NextResponse.json({ project });
}
