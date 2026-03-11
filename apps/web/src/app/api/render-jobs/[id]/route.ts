import { NextResponse } from "next/server";
import { getProjectRepository } from "@/lib/server/project-repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repository = await getProjectRepository();
  const renderJob = await repository.getRenderJob(id);

  if (!renderJob) {
    return NextResponse.json({ error: "Render job not found" }, { status: 404 });
  }

  return NextResponse.json({ renderJob });
}
