import { NextResponse } from "next/server";
import { normalizeSvgMarkup } from "@/lib/utils/svg";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const asset = normalizeSvgMarkup(body);
    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to normalize SVG";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
