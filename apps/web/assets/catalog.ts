import type { ShapeAsset } from "@ofd-keychain/scene-core";

export interface MaterialPresetMapCatalogEntry {
  fileName: string;
  tiling?: [number, number];
  offset?: [number, number];
  rotation?: number;
  opacity?: number;
}

export interface MaterialPresetCatalogEntry {
  id: string;
  name: string;
  type: "metal" | "plastic" | "acrylic" | "rubber" | "custom";
  directory: string;
  previewFile: string;
  materialXFile?: string;
  maps: Partial<Record<"normal" | "roughness" | "metalness", string | MaterialPresetMapCatalogEntry>>;
  appearance: {
    color: string;
    roughness: number;
    metalness: number;
    clearcoat: number;
    opacity: number;
    normalScale: number;
  };
}

export interface ShapePresetCatalogEntry {
  id: string;
  name: string;
  fileName: string;
  extrudeDefaults: ShapeAsset["extrudeDefaults"];
}

const DEFAULT_SHAPE_EXTRUDE = {
  depth: 4,
  bevelEnabled: true,
  bevelSegments: 2,
  bevelSize: 0.35,
  bevelThickness: 0.45,
  ringHoleRadius: 1.2
} satisfies ShapeAsset["extrudeDefaults"];

export const MATERIAL_PRESET_CATALOG: MaterialPresetCatalogEntry[] = [
  {
    id: "copper-satin",
    name: "Copper Satin",
    type: "metal",
    directory: "copper-satin",
    previewFile: "material preview.svg",
    materialXFile: "Copper_Satin.mtlx",
    maps: {
      normal: {
        fileName: "textures/Copper_Satin_normal.png",
        tiling: [5, 5]
      },
      roughness: {
        fileName: "textures/Copper_Satin_roughness.png",
        tiling: [5, 5]
      },
      metalness: {
        fileName: "textures/Copper_Satin_metallic.png",
        tiling: [5, 5]
      }
    },
    appearance: {
      color: "#561d10",
      roughness: 0.4,
      metalness: 1,
      clearcoat: 0.06,
      opacity: 1,
      normalScale: 0.7
    }
  }
];

export const SHAPE_PRESET_CATALOG: ShapePresetCatalogEntry[] = [
  {
    id: "pill",
    name: "Pill",
    fileName: "pill.svg",
    extrudeDefaults: DEFAULT_SHAPE_EXTRUDE
  },
  {
    id: "tag",
    name: "Tag",
    fileName: "tag.svg",
    extrudeDefaults: DEFAULT_SHAPE_EXTRUDE
  },
  {
    id: "tree",
    name: "Tree",
    fileName: "tree.svg",
    extrudeDefaults: DEFAULT_SHAPE_EXTRUDE
  },
  {
    id: "spark",
    name: "Spark",
    fileName: "spark.svg",
    extrudeDefaults: DEFAULT_SHAPE_EXTRUDE
  },
  {
    id: "circle",
    name: "Circle",
    fileName: "circle.svg",
    extrudeDefaults: DEFAULT_SHAPE_EXTRUDE
  }
];
