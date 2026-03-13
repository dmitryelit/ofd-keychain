import { describe, expect, it } from "vitest";
import { appendRingHoleToShapes } from "@ofd-keychain/render-engine";
import type { ShapeAsset } from "@ofd-keychain/scene-core";

const EXTRUDE_DEFAULTS: ShapeAsset["extrudeDefaults"] = {
  depth: 4,
  bevelEnabled: true,
  bevelSegments: 2,
  bevelSize: 0.35,
  bevelThickness: 0.45,
  ringHoleRadius: 1.2
};

type ShapeLike = Parameters<typeof appendRingHoleToShapes>[0][number];

describe("render-engine SVG handling", () => {
  it("preserves existing SVG holes when adding the keyring hole", () => {
    const asset: ShapeAsset = {
      id: "shape-donut",
      name: "Donut",
      sourceSvgUrl: "",
      normalizedSvgMarkup: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>',
      viewBox: {
        width: 100,
        height: 100
      },
      extrudeDefaults: {
        ...EXTRUDE_DEFAULTS
      }
    };

    const shapeLike = {
      holes: [
        {
          getPoints: () => [
            { x: 30, y: 30 },
            { x: 70, y: 30 },
            { x: 70, y: 70 },
            { x: 30, y: 70 }
          ]
        }
      ],
      extractPoints: () => ({
        shape: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 }
        ]
      })
    };

    const shapes = appendRingHoleToShapes([shapeLike as unknown as ShapeLike], asset, EXTRUDE_DEFAULTS.ringHoleRadius);

    expect(shapes).toHaveLength(1);
    expect(shapes[0]?.holes).toHaveLength(2);
  });
});
