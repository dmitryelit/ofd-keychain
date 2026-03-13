"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  createDefaultSceneDocument,
  parseSceneDocument,
  type MaterialDefinition,
  type SceneDocument,
  type ShapeAsset,
  type ViewportBackground
} from "@ofd-keychain/scene-core";

export type EditorPanel = "material" | "scene" | "shape";

export interface EditorState {
  projectId: string;
  projectTitle: string;
  scene: SceneDocument;
  selectedObjectId: string | null;
  currentTimeMs: number;
  publishSlug: string | null;
  collapsedPanels: Record<EditorPanel, boolean>;
  setProjectIdentity: (projectId: string, title: string) => void;
  hydrate: (scene: SceneDocument) => void;
  setTime: (timeMs: number) => void;
  updateMaterial: (materialId: string, patch: Partial<MaterialDefinition>) => void;
  applyMaterialPreset: (material: MaterialDefinition) => void;
  updateMaterialAppearance: (
    materialId: string,
    patch: Pick<Partial<MaterialDefinition>, "color" | "metalness" | "roughness" | "opacity">
  ) => void;
  updateGeometryDepth: (objectId: string, depth: number) => void;
  updateGeometryBevel: (
    objectId: string,
    patch: Pick<
      SceneDocument["objects"][number]["params"],
      "bevelEnabled" | "bevelSegments" | "bevelSize" | "bevelThickness"
    >
  ) => void;
  updateRingHoleRadius: (objectId: string, ringHoleRadius: number) => void;
  setAutoRotate: (enabled: boolean) => void;
  applyShapePreset: (asset: ShapeAsset) => void;
  replaceShapeAsset: (asset: Pick<ShapeAsset, "id" | "name" | "normalizedSvgMarkup" | "viewBox">) => void;
  setViewportBackground: (background: ViewportBackground) => void;
  togglePanelCollapsed: (panel: EditorPanel) => void;
  setPublishSlug: (slug: string | null) => void;
}

const defaultScene = createDefaultSceneDocument();

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    projectId: defaultScene.meta.projectId,
    projectTitle: defaultScene.meta.title,
    scene: defaultScene,
    selectedObjectId: defaultScene.objects[0]?.id ?? null,
    currentTimeMs: 0,
    publishSlug: null,
    collapsedPanels: {
      material: true,
      scene: true,
      shape: true
    },
    setProjectIdentity(projectId, title) {
      set((state) => {
        state.projectId = projectId;
        state.projectTitle = title;
        state.scene.meta.projectId = projectId;
        state.scene.meta.title = title;
      });
    },
    hydrate(scene) {
      const parsed = parseSceneDocument(scene);
      set((state) => {
        state.scene = parsed;
        state.projectId = parsed.meta.projectId;
        state.projectTitle = parsed.meta.title;
        state.selectedObjectId = parsed.objects[0]?.id ?? null;
        state.collapsedPanels = {
          material: true,
          scene: true,
          shape: true
        };
      });
    },
    setTime(timeMs) {
      set((state) => {
        state.currentTimeMs = timeMs;
      });
    },
    updateMaterial(materialId, patch) {
      set((state) => {
        const material = state.scene.materials.find((entry) => entry.id === materialId);

        if (material) {
          Object.assign(material, patch);
          state.scene.meta.updatedAt = new Date().toISOString();
        }
      });
    },
    applyMaterialPreset(material) {
      set((state) => {
        const nextMaterial = {
          ...material,
          maps: {
            ...material.maps
          }
        };

        state.scene.materials = [nextMaterial];
        if (state.scene.objects[0]) {
          state.scene.objects[0].materialId = nextMaterial.id;
        }
        state.scene.meta.updatedAt = new Date().toISOString();
      });
    },
    updateMaterialAppearance(materialId, patch) {
      set((state) => {
        const material = state.scene.materials.find((entry) => entry.id === materialId);

        if (material) {
          material.color = patch.color ?? material.color;
          material.metalness = patch.metalness ?? material.metalness;
          material.roughness = patch.roughness ?? material.roughness;
          material.opacity = patch.opacity ?? material.opacity;
          state.scene.meta.updatedAt = new Date().toISOString();
        }
      });
    },
    updateGeometryDepth(objectId, depth) {
      set((state) => {
        const object = state.scene.objects.find((entry) => entry.id === objectId);

        if (object) {
          object.params.depth = depth;
          state.scene.meta.updatedAt = new Date().toISOString();
        }
      });
    },
    updateGeometryBevel(objectId, patch) {
      set((state) => {
        const object = state.scene.objects.find((entry) => entry.id === objectId);

        if (object) {
          Object.assign(object.params, patch);
          state.scene.meta.updatedAt = new Date().toISOString();
        }
      });
    },
    updateRingHoleRadius(objectId, ringHoleRadius) {
      set((state) => {
        const object = state.scene.objects.find((entry) => entry.id === objectId);

        if (object) {
          object.params.ringHoleRadius = ringHoleRadius;
          state.scene.meta.updatedAt = new Date().toISOString();
        }
      });
    },
    setAutoRotate(enabled) {
      set((state) => {
        state.scene.cameraRig.autoRotate = enabled;
      });
    },
    applyShapePreset(asset) {
      set((state) => {
        const nextAsset = {
          ...asset,
          extrudeDefaults: {
            ...asset.extrudeDefaults
          }
        };

        state.scene.assets = [nextAsset];
        if (state.scene.objects[0]) {
          state.scene.objects[0].assetId = nextAsset.id;
          state.scene.objects[0].params = {
            ...state.scene.objects[0].params,
            ...nextAsset.extrudeDefaults
          };
        }
        state.scene.meta.updatedAt = new Date().toISOString();
      });
    },
    replaceShapeAsset(asset) {
      set((state) => {
        const nextAsset = {
          ...asset,
          sourceSvgUrl: "",
          extrudeDefaults: {
            depth: 4,
            bevelEnabled: true,
            bevelSegments: 2,
            bevelSize: 0.35,
            bevelThickness: 0.45,
            ringHoleRadius: 1.2
          }
        };

        state.scene.assets = [nextAsset];
        if (state.scene.objects[0]) {
          state.scene.objects[0].assetId = nextAsset.id;
          state.scene.objects[0].params = {
            ...state.scene.objects[0].params,
            ...nextAsset.extrudeDefaults
          };
        }
        state.scene.meta.updatedAt = new Date().toISOString();
      });
    },
    setViewportBackground(background) {
      set((state) => {
        state.scene.viewport.background = background;
        state.scene.meta.updatedAt = new Date().toISOString();
      });
    },
    togglePanelCollapsed(panel) {
      set((state) => {
        state.collapsedPanels[panel] = !state.collapsedPanels[panel];
      });
    },
    setPublishSlug(slug) {
      set((state) => {
        state.publishSlug = slug;
      });
    }
  }))
);
