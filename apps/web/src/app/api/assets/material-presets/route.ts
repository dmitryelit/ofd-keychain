import { NextResponse } from "next/server";
import { listMaterialPresets } from "@/lib/server/preset-assets";

export async function GET() {
  const presets = await listMaterialPresets();
  return NextResponse.json({ presets });
}
