import { describe, expect, it } from "vitest";
import { createDefaultSceneDocument } from "@ofd-keychain/scene-core";
import { getPresetAssetFile, listMaterialPresets, listShapePresets } from "./preset-assets";
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
});

describe("preset assets", () => {
  it("returns normalized shape presets", async () => {
    const presets = await listShapePresets();

    expect(presets).toHaveLength(5);
    expect(presets[0]?.asset.viewBox.width).toBeGreaterThan(0);
    expect(presets[0]?.asset.normalizedSvgMarkup.startsWith("<svg")).toBe(true);
  });

  it("returns allowlisted material maps", async () => {
    const presets = await listMaterialPresets();

    expect(presets).toHaveLength(4);
    expect(presets[0]?.material.maps.normal?.url.startsWith("/api/assets/files/materials/")).toBe(true);
  });

  it("rejects paths outside the preset asset catalog", () => {
    expect(() => getPresetAssetFile(["materials", "metal", ".DS_Store"])).toThrow("allowlisted");
  });
});
