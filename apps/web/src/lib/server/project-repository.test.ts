import { describe, expect, it } from "vitest";
import { createDefaultSceneDocument } from "@ofd-keychain/scene-core";
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
