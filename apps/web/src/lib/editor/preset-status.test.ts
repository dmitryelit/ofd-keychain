import { describe, expect, it } from "vitest";
import { getEditorBootstrapStatus, getPresetCollectionMessage } from "./preset-status";

describe("preset status helpers", () => {
  it("returns error and empty messages for material and shape collections", () => {
    expect(getPresetCollectionMessage("material", 0, "boom")).toBe("Failed to load material presets");
    expect(getPresetCollectionMessage("shape", 0, null, true)).toBe("Loading shape presets…");
    expect(getPresetCollectionMessage("shape", 0, null)).toBe("No shape presets found");
  });

  it("includes preset failures in the editor bootstrap status", () => {
    expect(
      getEditorBootstrapStatus({
        loadedDraft: true,
        materialPresetCount: 0,
        materialPresetError: "boom",
        shapePresetCount: 2,
        shapePresetError: null
      })
    ).toBe("Loaded local draft. Failed to load material presets");
  });

  it("returns ready when both preset collections are available", () => {
    expect(
      getEditorBootstrapStatus({
        loadedDraft: false,
        materialPresetCount: 4,
        materialPresetError: null,
        shapePresetCount: 5,
        shapePresetError: null
      })
    ).toBe("Ready");
  });
});
