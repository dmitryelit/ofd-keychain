import path from "node:path";
import { NextResponse } from "next/server";
import { readPresetAsset } from "@/lib/server/preset-assets";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetPath: string[] }> }
) {
  try {
    const { assetPath } = await params;
    const { buffer, absolutePath } = await readPresetAsset(assetPath);
    const extension = path.extname(absolutePath).toLowerCase();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": CONTENT_TYPES[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Asset not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
