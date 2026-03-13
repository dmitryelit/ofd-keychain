import {
  createDefaultSceneDocument,
  parseSceneDocument,
  type MaterialDefinition,
  type SceneDocument,
  type ShapeAsset
} from "@ofd-keychain/scene-core";

interface MaterialPresetLike {
  material: MaterialDefinition;
}

interface ShapePresetLike {
  asset: ShapeAsset;
}

function cloneMaps(material: MaterialDefinition): MaterialDefinition["maps"] {
  return Object.fromEntries(
    Object.entries(material.maps).map(([key, value]) => [key, value ? { ...value } : value])
  ) as MaterialDefinition["maps"];
}

function cloneMaterial(material: MaterialDefinition): MaterialDefinition {
  return {
    ...material,
    maps: cloneMaps(material)
  };
}

function cloneShapeAsset(asset: ShapeAsset): ShapeAsset {
  return {
    ...asset,
    viewBox: {
      ...asset.viewBox
    },
    extrudeDefaults: {
      ...asset.extrudeDefaults
    }
  };
}

function hasRenderableMaps(material: MaterialDefinition) {
  return Object.values(material.maps).some((entry) => Boolean(entry?.url));
}

function hasPresetShapeData(asset: ShapeAsset) {
  return Boolean(asset.sourceSvgUrl) && Boolean(asset.extrudeDefaults);
}

export function createPresetSeededScene(
  projectId: string,
  materialPresets: MaterialPresetLike[],
  shapePresets: ShapePresetLike[]
): SceneDocument {
  const scene = createDefaultSceneDocument(projectId);
  const firstMaterial = materialPresets[0]?.material;
  const firstShape = shapePresets[0]?.asset;
  const object = scene.objects[0];

  if (firstMaterial) {
    scene.materials = [cloneMaterial(firstMaterial)];
    if (object) {
      object.materialId = firstMaterial.id;
    }
  }

  if (firstShape) {
    scene.assets = [cloneShapeAsset(firstShape)];
    if (object) {
      object.assetId = firstShape.id;
      object.params = {
        ...object.params,
        ...firstShape.extrudeDefaults
      };
    }
  }

  return scene;
}

export function reconcileSceneWithPresets(
  scene: SceneDocument,
  materialPresets: MaterialPresetLike[],
  shapePresets: ShapePresetLike[]
): SceneDocument {
  const nextScene = parseSceneDocument(structuredClone(scene));
  const presetMaterialById = new Map(materialPresets.map((preset) => [preset.material.id, preset.material]));
  const presetShapeById = new Map(shapePresets.map((preset) => [preset.asset.id, preset.asset]));

  nextScene.materials = nextScene.materials.map((material) => {
    const preset = presetMaterialById.get(material.id);

    if (!preset || hasRenderableMaps(material)) {
      return material;
    }

    return {
      ...cloneMaterial(preset),
      color: material.color,
      roughness: material.roughness,
      metalness: material.metalness,
      clearcoat: material.clearcoat,
      opacity: material.opacity,
      emissive: material.emissive,
      normalScale: material.normalScale
    };
  });

  nextScene.assets = nextScene.assets.map((asset) => {
    const preset = presetShapeById.get(asset.id);

    if (!preset || hasPresetShapeData(asset)) {
      return asset;
    }

    return {
      ...cloneShapeAsset(preset),
      normalizedSvgMarkup: asset.normalizedSvgMarkup || preset.normalizedSvgMarkup,
      viewBox: asset.viewBox ?? preset.viewBox
    };
  });

  return nextScene;
}
