"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  createDefaultSceneDocument,
  parseSceneDocument,
  type MaterialDefinition,
  type SceneDocument,
  type ShapeAsset
} from "@ofd-keychain/scene-core";

export interface EditorState {
  projectId: string;
  projectTitle: string;
  scene: SceneDocument;
  selectedObjectId: string | null;
  currentTimeMs: number;
  publishSlug: string | null;
  setProjectIdentity: (projectId: string, title: string) => void;
  hydrate: (scene: SceneDocument) => void;
  setTime: (timeMs: number) => void;
  updateMaterial: (materialId: string, patch: Partial<MaterialDefinition>) => void;
  updateGeometryDepth: (objectId: string, depth: number) => void;
  setAutoRotate: (enabled: boolean) => void;
  replaceShapeAsset: (
    asset: Pick<ShapeAsset, "id" | "name" | "normalizedSvgMarkup" | "viewBox">
  ) => void;
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
    updateGeometryDepth(objectId, depth) {
      set((state) => {
        const object = state.scene.objects.find((entry) => entry.id === objectId);

        if (object) {
          object.params.depth = depth;
          state.scene.meta.updatedAt = new Date().toISOString();
        }
      });
    },
    setAutoRotate(enabled) {
      set((state) => {
        state.scene.cameraRig.autoRotate = enabled;
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
        }
        state.scene.meta.updatedAt = new Date().toISOString();
      });
    },
    setPublishSlug(slug) {
      set((state) => {
        state.publishSlug = slug;
      });
    }
  }))
);
