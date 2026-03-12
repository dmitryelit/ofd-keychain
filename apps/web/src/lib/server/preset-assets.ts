import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MaterialDefinition } from "@ofd-keychain/scene-core";
import { MATERIAL_PRESET_CATALOG, SHAPE_PRESET_CATALOG } from "../assets/catalog";
import { normalizeSvgMarkup } from "../utils/svg";

export interface MaterialPresetPayload {
  id: string;
  name: string;
  previewUrl: string;
  material: MaterialDefinition;
}

export interface ShapePresetPayload {
  id: string;
  name: string;
  asset: ReturnType<typeof normalizeSvgMarkup> & { sourceSvgUrl: string };
}

const ASSET_ROOT = path.join(process.cwd(), "src", "lib", "assets");
const ALLOWLISTED_ASSET_PATHS = new Set(
  [
    ...MATERIAL_PRESET_CATALOG.flatMap((preset) => [
      ["materials", preset.directory, preset.previewFile],
      ...Object.values(preset.maps).map((fileName) => ["materials", preset.directory, fileName])
    ]),
    ...SHAPE_PRESET_CATALOG.map((preset) => ["shapes", preset.fileName])
  ].map((parts) => parts.join("/"))
);

function encodeAssetPath(parts: string[]) {
  return parts.map((part) => encodeURIComponent(part)).join("/");
}

function toAssetUrl(parts: string[]) {
  return `/api/assets/files/${encodeAssetPath(parts)}`;
}

function resolveAssetPath(parts: string[]) {
  const normalizedParts = parts.filter(Boolean);
  const normalizedKey = normalizedParts.join("/");

  if (!ALLOWLISTED_ASSET_PATHS.has(normalizedKey)) {
    throw new Error("Asset path is not allowlisted");
  }

  const absolutePath = path.join(ASSET_ROOT, ...normalizedParts);
  const relativePath = path.relative(ASSET_ROOT, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Asset path is not allowlisted");
  }

  return absolutePath;
}

export function getPresetAssetFile(assetPath: string[]) {
  return resolveAssetPath(assetPath);
}

export async function listMaterialPresets(): Promise<MaterialPresetPayload[]> {
  return MATERIAL_PRESET_CATALOG.map((preset) => ({
    id: preset.id,
    name: preset.name,
    previewUrl: toAssetUrl(["materials", preset.directory, preset.previewFile]),
    material: {
      id: `mat-${preset.id}`,
      name: preset.name,
      type: preset.type,
      color: preset.appearance.color,
      roughness: preset.appearance.roughness,
      metalness: preset.appearance.metalness,
      clearcoat: preset.appearance.clearcoat,
      opacity: preset.appearance.opacity,
      emissive: "#000000",
      normalScale: preset.appearance.normalScale,
      maps: Object.fromEntries(
        Object.entries(preset.maps).map(([key, fileName]) => [
          key,
          {
            url: toAssetUrl(["materials", preset.directory, fileName as string])
          }
        ])
      )
    }
  }));
}

export async function listShapePresets(): Promise<ShapePresetPayload[]> {
  return Promise.all(
    SHAPE_PRESET_CATALOG.map(async (preset) => {
      const sourceSvgUrl = toAssetUrl(["shapes", preset.fileName]);
      const markup = await readFile(resolveAssetPath(["shapes", preset.fileName]), "utf8");
      const normalized = normalizeSvgMarkup({ markup, name: preset.name, id: `shape-${preset.id}` });

      return {
        id: preset.id,
        name: preset.name,
        asset: {
          ...normalized,
          sourceSvgUrl
        }
      };
    })
  );
}

export async function readPresetAsset(assetPath: string[]) {
  const absolutePath = resolveAssetPath(assetPath);
  const buffer = await readFile(absolutePath);
  return {
    buffer,
    absolutePath
  };
}
