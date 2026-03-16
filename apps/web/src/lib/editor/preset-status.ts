export type PresetCollectionKind = "material" | "shape";

function getPresetCollectionLabel(kind: PresetCollectionKind) {
  return kind === "material" ? "material presets" : "shape presets";
}

export function getPresetCollectionMessage(
  kind: PresetCollectionKind,
  count: number,
  error: string | null,
  isLoading = false
) {
  const label = getPresetCollectionLabel(kind);

  if (isLoading) {
    return `Loading ${label}…`;
  }

  if (error) {
    return `Failed to load ${label}`;
  }

  if (count === 0) {
    return `No ${label} found`;
  }

  return null;
}

export function getEditorBootstrapStatus({
  loadedDraft,
  materialPresetCount,
  materialPresetError,
  shapePresetCount,
  shapePresetError
}: {
  loadedDraft: boolean;
  materialPresetCount: number;
  materialPresetError: string | null;
  shapePresetCount: number;
  shapePresetError: string | null;
}) {
  const issues = [
    getPresetCollectionMessage("material", materialPresetCount, materialPresetError, false),
    getPresetCollectionMessage("shape", shapePresetCount, shapePresetError, false)
  ].filter((message): message is string => Boolean(message));

  if (loadedDraft) {
    return issues.length > 0 ? `Loaded local draft. ${issues.join(". ")}` : "Loaded local draft";
  }

  return issues[0] ?? "Ready";
}
