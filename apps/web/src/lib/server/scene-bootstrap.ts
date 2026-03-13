import { createPresetSeededScene } from "../scene/preset-scene";
import { listMaterialPresets, listShapePresets } from "./preset-assets";

export async function createInitialProjectScene(projectId = "local-project") {
  const [materialPresets, shapePresets] = await Promise.all([listMaterialPresets(), listShapePresets()]);
  return createPresetSeededScene(projectId, materialPresets, shapePresets);
}
