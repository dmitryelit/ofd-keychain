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
});
