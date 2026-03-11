import { NextResponse } from "next/server";
import { parseSceneDocument } from "@ofd-keychain/scene-core";
import { getProjectRepository } from "@/lib/server/project-repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const scene = parseSceneDocument(body.scene);
  const repository = await getProjectRepository();
  const project = await repository.publishProject(id, scene);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}
