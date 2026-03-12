import { NextResponse } from "next/server";
import { listShapePresets } from "@/lib/server/preset-assets";

export async function GET() {
  const presets = await listShapePresets();
  return NextResponse.json({ presets });
}
