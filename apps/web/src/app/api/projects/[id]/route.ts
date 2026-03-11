import { NextResponse } from "next/server";
import { parseSceneDocument } from "@ofd-keychain/scene-core";
import { getProjectRepository } from "@/lib/server/project-repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repository = await getProjectRepository();
  const project = await repository.getProject(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const repository = await getProjectRepository();
  const scene = parseSceneDocument(body.scene);
  const project = await repository.updateProject(id, scene, body.title);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}
