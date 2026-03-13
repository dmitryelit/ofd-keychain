export interface MaterialPresetCatalogEntry {
  id: string;
  name: string;
  type: "metal" | "plastic" | "acrylic" | "rubber" | "custom";
  directory: string;
  previewFile: string;
  maps: Partial<Record<"normal" | "roughness" | "metalness", string>>;
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
}

export const MATERIAL_PRESET_CATALOG: MaterialPresetCatalogEntry[] = [
  {
    id: "plastic",
    name: "Plastic",
    type: "plastic",
    directory: "plastic",
    previewFile: "material preview.png",
    maps: {
      normal: "scuffed-plastic-normal.png",
      roughness: "scuffed-plastic-rough.png",
      metalness: "scuffed-plastic-metal.png"
    },
    appearance: {
      color: "#2c3036",
      roughness: 0.52,
      metalness: 0.12,
      clearcoat: 0.04,
      opacity: 1,
      normalScale: 0.75
    }
  },
  {
    id: "metal",
    name: "Metal",
    type: "metal",
    directory: "metal",
    previewFile: "material preview.png",
    maps: {
      normal: "scuffed-metal1_normal-dx.png",
      roughness: "scuffed-metal1_roughness.png",
      metalness: "scuffed-metal1_metallic.png"
    },
    appearance: {
      color: "#171a1f",
      roughness: 0.28,
      metalness: 0.9,
      clearcoat: 0.2,
      opacity: 1,
      normalScale: 0.7
    }
  },
  {
    id: "painted-metal",
    name: "Painted Metal",
    type: "custom",
    directory: "painted metal",
    previewFile: "material preview.png",
    maps: {
      normal: "flaking-painted-metal_normal-dx.png",
      roughness: "flaking-painted-metal_roughness.png",
      metalness: "flaking-painted-metal_metallic.png"
    },
    appearance: {
      color: "#bb7a2c",
      roughness: 0.62,
      metalness: 0.5,
      clearcoat: 0.08,
      opacity: 1,
      normalScale: 0.85
    }
  },
  {
    id: "quartz",
    name: "Quartz",
    type: "acrylic",
    directory: "quartz",
    previewFile: "material preview.png",
    maps: {
      normal: "cloudy-veined-quartz_normal-dx.png",
      roughness: "cloudy-veined-quartz_roughness.png",
      metalness: "cloudy-veined-quartz_metallic.png"
    },
    appearance: {
      color: "#f4f2ea",
      roughness: 0.36,
      metalness: 0.18,
      clearcoat: 0.48,
      opacity: 0.88,
      normalScale: 0.35
    }
  }
];

export const SHAPE_PRESET_CATALOG: ShapePresetCatalogEntry[] = [
  {
    id: "pill",
    name: "Pill",
    fileName: "pill.svg"
  },
  {
    id: "tag",
    name: "Tag",
    fileName: "tag.svg"
  },
  {
    id: "tree",
    name: "Tree",
    fileName: "tree.svg"
  },
  {
    id: "spark",
    name: "Spark",
    fileName: "spark.svg"
  },
  {
    id: "circle",
    name: "Circle",
    fileName: "circle.svg"
  }
];
