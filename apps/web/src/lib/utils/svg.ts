import { z } from "zod";

const svgPayloadSchema = z.object({
  markup: z.string().min(1),
  id: z.string().optional(),
  name: z.string().min(1).optional()
});

export interface NormalizedSvgAssetPayload {
  id: string;
  name: string;
  normalizedSvgMarkup: string;
  viewBox: {
    width: number;
    height: number;
  };
}

const VIEWBOX_REGEX = /viewBox=["']([\d.\s-]+)["']/i;

export function normalizeSvgMarkup(input: unknown): NormalizedSvgAssetPayload {
  const { markup, id, name } = svgPayloadSchema.parse(input);
  const normalized = markup.replace(/\r\n/g, "\n").trim();

  if (!normalized.startsWith("<svg")) {
    throw new Error("Invalid SVG payload");
  }

  const viewBoxMatch = normalized.match(VIEWBOX_REGEX);
  const values = viewBoxMatch?.[1]?.split(/\s+/).map(Number) ?? [0, 0, 120, 80];
  const width = Number.isFinite(values[2]) && values[2] > 0 ? values[2] : 120;
  const height = Number.isFinite(values[3]) && values[3] > 0 ? values[3] : 80;

  return {
    id: id ?? crypto.randomUUID(),
    name: name ?? "Uploaded shape",
    normalizedSvgMarkup: normalized,
    viewBox: {
      width,
      height
    }
  };
}
