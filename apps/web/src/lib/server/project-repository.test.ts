import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createDefaultSceneDocument } from "@ofd-keychain/scene-core";
import { getPresetAssetFile, getPresetAssetRoot, listMaterialPresets, listShapePresets } from "./preset-assets";
import { createInitialProjectScene } from "./scene-bootstrap";
import { reconcileSceneWithPresets } from "../scene/preset-scene";
import { normalizeSvgMarkup } from "../utils/svg";

describe("svg normalization", () => {
  it("extracts viewBox dimensions", () => {
    const asset = normalizeSvgMarkup({
      markup: '<svg viewBox="0 0 256 128"><path d="M0 0h10v10H0z"/></svg>'
    });

    expect(asset.viewBox.width).toBe(256);
    expect(asset.viewBox.height).toBe(128);
  });
});

describe("default scene document", () => {
  it("keeps publishable title and tracks", () => {
    const scene = createDefaultSceneDocument("demo");

    expect(scene.meta.title).toContain("Custom keychain");
    expect(scene.timeline.tracks[0]?.property).toBe("transform.rotation");
  });

  it("creates preset-backed initial scenes", async () => {
    const scene = await createInitialProjectScene("demo");

    expect(scene.meta.projectId).toBe("demo");
    expect(scene.materials[0]?.maps.normal?.url.startsWith("/api/assets/files/materials/")).toBe(true);
    expect(scene.materials[0]?.id).toBe("mat-copper-satin");
    expect(scene.materials[0]?.maps.normal?.tiling).toEqual([5, 5]);
    expect(scene.assets[0]?.sourceSvgUrl.startsWith("/api/assets/files/shapes/")).toBe(true);
    expect(scene.assets[0]?.extrudeDefaults.depth).toBeGreaterThan(0);
  });

  it("migrates legacy default materials to the current preset catalog", async () => {
    const scene = createDefaultSceneDocument("demo");
    const materialPresets = await listMaterialPresets();
    const shapePresets = await listShapePresets();
    const reconciled = reconcileSceneWithPresets(scene, materialPresets, shapePresets);

    expect(reconciled.materials[0]?.id).toBe("mat-copper-satin");
    expect(reconciled.objects[0]?.materialId).toBe("mat-copper-satin");
    expect(reconciled.materials[0]?.maps.normal?.url).toBe(
      "/api/assets/files/materials/copper-satin/textures/Copper_Satin_normal.png"
    );
  });
});

describe("preset assets", () => {
  it("returns normalized shape presets", async () => {
    const presets = await listShapePresets();

    expect(presets).toHaveLength(5);
    expect(presets[0]?.asset.viewBox.width).toBeGreaterThan(0);
    expect(presets[0]?.asset.normalizedSvgMarkup.startsWith("<svg")).toBe(true);
    expect(presets[0]?.asset.sourceSvgUrl.startsWith("/api/assets/files/shapes/")).toBe(true);
  });

  it("returns allowlisted material maps", async () => {
    const presets = await listMaterialPresets();

    expect(presets).toHaveLength(1);
    expect(presets[0]?.name).toBe("Copper Satin");
    expect(presets[0]?.previewUrl).toBe("/api/assets/files/materials/copper-satin/material%20preview.svg");
    expect(presets[0]?.material.maps.normal?.url).toBe(
      "/api/assets/files/materials/copper-satin/textures/Copper_Satin_normal.png"
    );
    expect(presets[0]?.material.maps.normal?.tiling).toEqual([5, 5]);
  });

  it("resolves preset assets independent of the process cwd", async () => {
    const originalCwd = process.cwd();

    process.chdir(os.tmpdir());

    try {
      expect(path.basename(getPresetAssetRoot())).toBe("assets");
      expect(getPresetAssetRoot()).toContain(path.join("apps", "web", "assets"));

      const [materialPresets, shapePresets] = await Promise.all([listMaterialPresets(), listShapePresets()]);

      expect(materialPresets.length).toBeGreaterThan(0);
      expect(shapePresets.length).toBeGreaterThan(0);
      expect(materialPresets[0]?.previewUrl.startsWith("/api/assets/files/materials/")).toBe(true);
      expect(shapePresets[0]?.asset.sourceSvgUrl.startsWith("/api/assets/files/shapes/")).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("rejects paths outside the preset asset catalog", () => {
    expect(() => getPresetAssetFile(["materials", "metal", ".DS_Store"])).toThrow("allowlisted");
  });
});
