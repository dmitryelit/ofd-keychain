import { describe, expect, it } from "vitest";
import {
  CommandHistory,
  createDefaultSceneDocument,
  evaluateTimeline,
  parseSceneDocument,
  serializeSceneDocument
} from "../src/index";

describe("scene-core", () => {
  it("creates and parses the default scene document", () => {
    const scene = createDefaultSceneDocument("project-1");
    const parsed = parseSceneDocument(JSON.parse(serializeSceneDocument(scene)));

    expect(parsed.meta.projectId).toBe("project-1");
    expect(parsed.objects).toHaveLength(1);
    expect(parsed.timeline.tracks).toHaveLength(1);
    expect(parsed.viewport.background).toEqual({
      mode: "gradient",
      topColor: "#060606",
      bottomColor: "#84d6bb"
    });
    expect(parsed.materials[0]?.opacity).toBe(1);
  });

  it("evaluates deterministic timeline values", () => {
    const scene = createDefaultSceneDocument();
    const values = evaluateTimeline(scene.timeline, 3000);

    expect(values["object-keychain:transform.rotation"]).toEqual([0.6, 2.8, 0.15]);
  });

  it("supports undo and redo", () => {
    const history = new CommandHistory({ value: 1 });

    history.apply({
      label: "increment",
      execute: (state) => ({ value: state.value + 1 }),
      undo: (state) => ({ value: state.value - 1 })
    });

    expect(history.snapshot().value).toBe(2);
    history.undo();
    expect(history.snapshot().value).toBe(1);
    history.redo();
    expect(history.snapshot().value).toBe(2);
  });

  it("migrates legacy string backgrounds into solid mode", () => {
    const parsed = parseSceneDocument({
      sceneVersion: 1,
      meta: {
        projectId: "legacy-project",
        title: "Legacy scene",
        updatedAt: new Date().toISOString()
      },
      viewport: {
        background: "#ff00ff",
        exposure: 1,
        shadows: true
      },
      assets: [],
      materials: [
        {
          id: "legacy-material",
          name: "Legacy material",
          type: "metal",
          color: "#ffffff",
          roughness: 0.4,
          metalness: 0.8,
          clearcoat: 0.1,
          emissive: "#000000",
          normalScale: 1
        }
      ],
      objects: [],
      lights: [],
      cameraRig: {
        mode: "orbit",
        position: [0, 0, 12],
        target: [0, 0, 0],
        fov: 35,
        autoRotate: false,
        autoRotateSpeed: 1
      },
      timeline: {
        durationMs: 1000,
        fps: 30,
        loop: true,
        tracks: [],
        markers: []
      }
    });

    expect(parsed.sceneVersion).toBe(3);
    expect(parsed.viewport.background).toEqual({
      mode: "solid",
      color: "#ff00ff"
    });
    expect(parsed.materials[0]?.opacity).toBe(1);
    expect(parsed.materials[0]?.maps.metalness).toBeUndefined();
  });

  it("migrates v2 gradient backgrounds into gradient mode", () => {
    const parsed = parseSceneDocument({
      sceneVersion: 2,
      meta: {
        projectId: "gradient-project",
        title: "Gradient scene",
        updatedAt: new Date().toISOString()
      },
      viewport: {
        background: {
          topColor: "#111111",
          bottomColor: "#22cc88"
        },
        exposure: 1,
        shadows: true
      },
      assets: [],
      materials: [],
      objects: [],
      lights: [],
      cameraRig: {
        mode: "orbit",
        position: [0, 0, 12],
        target: [0, 0, 0],
        fov: 35,
        autoRotate: false,
        autoRotateSpeed: 1
      },
      timeline: {
        durationMs: 1000,
        fps: 30,
        loop: true,
        tracks: [],
        markers: []
      }
    });

    expect(parsed.sceneVersion).toBe(3);
    expect(parsed.viewport.background).toEqual({
      mode: "gradient",
      topColor: "#111111",
      bottomColor: "#22cc88"
    });
  });
});
