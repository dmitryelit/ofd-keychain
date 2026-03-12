import { z } from "zod";

export const CURRENT_SCENE_VERSION = 2;

const vector3Schema = z.tuple([z.number(), z.number(), z.number()]);
const vector2Schema = z.tuple([z.number(), z.number()]);

export const textureMapSchema = z.object({
  url: z.string().url().or(z.string().startsWith("/")),
  tiling: vector2Schema.default([1, 1]),
  offset: vector2Schema.default([0, 0]),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1)
});

export const materialDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["metal", "plastic", "acrylic", "rubber", "custom"]),
  color: z.string().default("#d4d4d8"),
  roughness: z.number().min(0).max(1).default(0.35),
  metalness: z.number().min(0).max(1).default(0.6),
  clearcoat: z.number().min(0).max(1).default(0),
  opacity: z.number().min(0).max(1).default(1),
  emissive: z.string().default("#000000"),
  normalScale: z.number().default(1),
  maps: z
    .object({
      baseColor: textureMapSchema.optional(),
      normal: textureMapSchema.optional(),
      roughness: textureMapSchema.optional(),
      metalness: textureMapSchema.optional(),
      decal: textureMapSchema.optional()
    })
    .default({})
});

export const backgroundGradientSchema = z.object({
  topColor: z.string().default("#060606"),
  bottomColor: z.string().default("#84d6bb")
});

export const shapeAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  sourceSvgUrl: z.string().default(""),
  normalizedSvgMarkup: z.string(),
  viewBox: z.object({
    width: z.number().positive(),
    height: z.number().positive()
  }),
  extrudeDefaults: z.object({
    depth: z.number().positive().default(4),
    bevelEnabled: z.boolean().default(true),
    bevelSegments: z.number().int().min(0).default(2),
    bevelSize: z.number().min(0).default(0.35),
    bevelThickness: z.number().min(0).default(0.45),
    ringHoleRadius: z.number().min(0).default(1.2)
  })
});

export const objectTransformSchema = z.object({
  position: vector3Schema.default([0, 0, 0]),
  rotation: vector3Schema.default([0, 0, 0]),
  scale: vector3Schema.default([1, 1, 1])
});

export const keychainObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal("keychain"),
  assetId: z.string(),
  materialId: z.string(),
  transform: objectTransformSchema.default({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  }),
  params: z.object({
    depth: z.number().positive().default(4),
    bevelEnabled: z.boolean().default(true),
    bevelSegments: z.number().int().min(0).default(2),
    bevelSize: z.number().min(0).default(0.35),
    bevelThickness: z.number().min(0).default(0.45),
    ringHoleRadius: z.number().min(0).default(1.2)
  })
});

export const lightSchema = z.object({
  id: z.string(),
  kind: z.enum(["ambient", "directional", "point", "spot"]),
  color: z.string(),
  intensity: z.number().nonnegative(),
  position: vector3Schema.default([4, 8, 6]),
  target: vector3Schema.optional(),
  castShadow: z.boolean().default(false)
});

export const cameraRigSchema = z.object({
  mode: z.enum(["orbit", "timeline", "turntable"]).default("orbit"),
  position: vector3Schema.default([0, 0, 12]),
  target: vector3Schema.default([0, 0, 0]),
  fov: z.number().positive().default(35),
  autoRotate: z.boolean().default(false),
  autoRotateSpeed: z.number().default(1)
});

export const keyframeSchema = z.object({
  id: z.string(),
  timeMs: z.number().min(0),
  value: z.union([z.number(), vector2Schema, vector3Schema, z.string()]),
  easing: z.enum(["linear", "easeInOut", "easeOut"]).default("linear")
});

export const timelineTrackSchema = z.object({
  id: z.string(),
  targetRef: z.string(),
  property: z.string(),
  keyframes: z.array(keyframeSchema).default([])
});

export const timelineSchema = z.object({
  durationMs: z.number().positive().default(4000),
  fps: z.number().int().positive().default(30),
  loop: z.boolean().default(true),
  tracks: z.array(timelineTrackSchema).default([]),
  markers: z.array(z.object({ id: z.string(), label: z.string(), timeMs: z.number() })).default([])
});

export const sceneDocumentSchema = z.object({
  sceneVersion: z.number().int().default(CURRENT_SCENE_VERSION),
  meta: z.object({
    projectId: z.string().default("local-project"),
    title: z.string().default("Custom keychain scene"),
    updatedAt: z.string().default(() => new Date().toISOString())
  }),
  viewport: z
    .object({
      background: backgroundGradientSchema.default({
        topColor: "#060606",
        bottomColor: "#84d6bb"
      }),
      exposure: z.number().default(1),
      shadows: z.boolean().default(true)
    })
    .default({
      background: {
        topColor: "#060606",
        bottomColor: "#84d6bb"
      },
      exposure: 1,
      shadows: true
    }),
  environment: z
    .object({
      hdriUrl: z.string().default(""),
      blur: z.number().min(0).max(1).default(0.1)
    })
    .default({
      hdriUrl: "",
      blur: 0.1
    }),
  assets: z.array(shapeAssetSchema).default([]),
  materials: z.array(materialDefinitionSchema).default([]),
  objects: z.array(keychainObjectSchema).default([]),
  lights: z.array(lightSchema).default([]),
  cameraRig: cameraRigSchema.default({
    mode: "orbit",
    position: [0, 0, 12],
    target: [0, 0, 0],
    fov: 35,
    autoRotate: false,
    autoRotateSpeed: 1
  }),
  timeline: timelineSchema.default({
    durationMs: 4000,
    fps: 30,
    loop: true,
    tracks: [],
    markers: []
  })
});

export type TextureMapDefinition = z.infer<typeof textureMapSchema>;
export type MaterialDefinition = z.infer<typeof materialDefinitionSchema>;
export type BackgroundGradient = z.infer<typeof backgroundGradientSchema>;
export type ShapeAsset = z.infer<typeof shapeAssetSchema>;
export type KeychainObject = z.infer<typeof keychainObjectSchema>;
export type SceneLight = z.infer<typeof lightSchema>;
export type TimelineKeyframe = z.infer<typeof keyframeSchema>;
export type TimelineTrack = z.infer<typeof timelineTrackSchema>;
export type SceneDocument = z.infer<typeof sceneDocumentSchema>;

export type ScalarOrVector = number | [number, number] | [number, number, number];

export interface SceneMigration {
  from: number;
  to: number;
  migrate: (input: unknown) => unknown;
}

const migrations: SceneMigration[] = [];

export function registerMigration(migration: SceneMigration) {
  migrations.push(migration);
}

export function createDefaultSceneDocument(projectId = "local-project"): SceneDocument {
  return sceneDocumentSchema.parse({
    meta: {
      projectId,
      title: "Custom keychain scene"
    },
    assets: [
      {
        id: "shape-tag",
        name: "Tag",
        normalizedSvgMarkup:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 120"><path d="M12.0779 12.2725C14.0472 5.02383 20.5637 0 27.9968 0C35.4299 0 41.9464 5.02382 43.9157 12.2725L55.1435 53.6011C56.2815 57.79 56.2856 62.2112 55.1554 66.4022L44.0317 107.651C42.0655 114.942 35.5172 120 28.0444 120C20.5832 120 14.042 114.957 12.0653 107.681L0.856542 66.4226C-0.285514 62.2187 -0.285514 57.7813 0.856541 53.5775L12.0779 12.2725Z" fill="#8A8A8A"/></svg>',
        viewBox: { width: 56, height: 120 },
        extrudeDefaults: {
          depth: 4,
          bevelEnabled: true,
          bevelSegments: 2,
          bevelSize: 0.35,
          bevelThickness: 0.45,
          ringHoleRadius: 1.2
        }
      }
    ],
    materials: [
      {
        id: "mat-plastic",
        name: "Plastic",
        type: "plastic",
        color: "#1f2430",
        roughness: 0.52,
        metalness: 0.12,
        clearcoat: 0.04,
        opacity: 1,
        emissive: "#000000",
        normalScale: 0.75
      }
    ],
    objects: [
      {
        id: "object-keychain",
        name: "Hero keychain",
        type: "keychain",
        assetId: "shape-tag",
        materialId: "mat-plastic",
        transform: {
          position: [0, 0, 0],
          rotation: [0.3, 0.7, 0],
          scale: [1, 1, 1]
        },
        params: {
          depth: 4,
          bevelEnabled: true,
          bevelSegments: 2,
          bevelSize: 0.35,
          bevelThickness: 0.45,
          ringHoleRadius: 1.2
        }
      }
    ],
    lights: [
      { id: "light-ambient", kind: "ambient", color: "#ffffff", intensity: 0.55 },
      {
        id: "light-key",
        kind: "directional",
        color: "#ffffff",
        intensity: 2.4,
        position: [6, 8, 10],
        target: [0, 0, 0],
        castShadow: true
      },
      {
        id: "light-rim",
        kind: "point",
        color: "#7dd3fc",
        intensity: 15,
        position: [-8, 4, -6],
        castShadow: false
      }
    ],
    cameraRig: {
      mode: "orbit",
      position: [0, 1.5, 14],
      target: [0, 0, 0],
      fov: 32,
      autoRotate: true,
      autoRotateSpeed: 0.8
    },
    timeline: {
      durationMs: 6000,
      fps: 30,
      loop: true,
      markers: [{ id: "marker-start", label: "Hero reveal", timeMs: 0 }],
      tracks: [
        {
          id: "track-object-rotation",
          targetRef: "object-keychain",
          property: "transform.rotation",
          keyframes: [
            { id: "kf-0", timeMs: 0, value: [0.3, 0.6, 0], easing: "linear" },
            { id: "kf-1", timeMs: 3000, value: [0.6, 2.8, 0.15], easing: "easeInOut" },
            { id: "kf-2", timeMs: 6000, value: [0.3, 5.9, 0], easing: "easeOut" }
          ]
        }
      ]
    }
  });
}

function toGradientBackground(background: unknown) {
  if (typeof background === "string") {
    return {
      topColor: background,
      bottomColor: background
    };
  }

  if (background && typeof background === "object") {
    const candidate = background as { topColor?: unknown; bottomColor?: unknown };
    const topColor = typeof candidate.topColor === "string" ? candidate.topColor : "#060606";
    const bottomColor = typeof candidate.bottomColor === "string" ? candidate.bottomColor : topColor;
    return {
      topColor,
      bottomColor
    };
  }

  return {
    topColor: "#060606",
    bottomColor: "#84d6bb"
  };
}

registerMigration({
  from: 0,
  to: 2,
  migrate(input) {
    const document = (input ?? {}) as {
      sceneVersion?: number;
      viewport?: { background?: unknown };
      materials?: Array<Record<string, unknown>>;
    };

    return {
      ...document,
      sceneVersion: 2,
      viewport: {
        ...document.viewport,
        background: toGradientBackground(document.viewport?.background)
      },
      materials: document.materials?.map((material) => ({
        ...material,
        opacity: typeof material.opacity === "number" ? material.opacity : 1,
        maps: {
          ...(typeof material.maps === "object" && material.maps ? material.maps : {})
        }
      }))
    };
  }
});

registerMigration({
  from: 1,
  to: 2,
  migrate(input) {
    const document = input as {
      sceneVersion?: number;
      viewport?: { background?: unknown };
      materials?: Array<Record<string, unknown>>;
    };

    return {
      ...document,
      sceneVersion: 2,
      viewport: {
        ...document.viewport,
        background: toGradientBackground(document.viewport?.background)
      },
      materials: document.materials?.map((material) => ({
        ...material,
        opacity: typeof material.opacity === "number" ? material.opacity : 1,
        maps: {
          ...(typeof material.maps === "object" && material.maps ? material.maps : {})
        }
      }))
    };
  }
});

export function migrateSceneDocument(input: unknown): unknown {
  const source = input as { sceneVersion?: number };
  let version = source?.sceneVersion ?? 0;
  let output = input;

  while (version < CURRENT_SCENE_VERSION) {
    const migration = migrations.find((entry) => entry.from === version);

    if (!migration) {
      break;
    }

    output = migration.migrate(output);
    version = migration.to;
  }

  return output;
}

export function parseSceneDocument(input: unknown): SceneDocument {
  const migrated = migrateSceneDocument(input);
  return sceneDocumentSchema.parse(migrated);
}

export function serializeSceneDocument(scene: SceneDocument): string {
  return JSON.stringify(scene, null, 2);
}

export interface Command<TState> {
  label: string;
  execute: (state: TState) => TState;
  undo: (state: TState) => TState;
}

export class CommandHistory<TState> {
  private past: Command<TState>[] = [];
  private future: Command<TState>[] = [];

  constructor(private state: TState) {}

  snapshot() {
    return this.state;
  }

  apply(command: Command<TState>) {
    this.state = command.execute(this.state);
    this.past.push(command);
    this.future = [];
    return this.state;
  }

  undo() {
    const command = this.past.pop();

    if (!command) {
      return this.state;
    }

    this.state = command.undo(this.state);
    this.future.push(command);
    return this.state;
  }

  redo() {
    const command = this.future.pop();

    if (!command) {
      return this.state;
    }

    this.state = command.execute(this.state);
    this.past.push(command);
    return this.state;
  }
}

function interpolateNumber(start: number, end: number, factor: number) {
  return start + (end - start) * factor;
}

function applyEasing(factor: number, easing: TimelineKeyframe["easing"]) {
  if (easing === "easeInOut") {
    return factor < 0.5 ? 2 * factor * factor : 1 - Math.pow(-2 * factor + 2, 2) / 2;
  }

  if (easing === "easeOut") {
    return 1 - Math.pow(1 - factor, 2);
  }

  return factor;
}

export function interpolateValue(
  from: ScalarOrVector,
  to: ScalarOrVector,
  factor: number,
  easing: TimelineKeyframe["easing"] = "linear"
): ScalarOrVector {
  const eased = applyEasing(factor, easing);

  if (typeof from === "number" && typeof to === "number") {
    return interpolateNumber(from, to, eased);
  }

  if (Array.isArray(from) && Array.isArray(to) && from.length === to.length) {
    return from.map((entry, index) => interpolateNumber(entry, to[index] ?? entry, eased)) as ScalarOrVector;
  }

  return to;
}

export function evaluateTrack(track: TimelineTrack, timeMs: number): ScalarOrVector | string | null {
  if (track.keyframes.length === 0) {
    return null;
  }

  const sortedKeyframes = [...track.keyframes].sort((left, right) => left.timeMs - right.timeMs);

  if (timeMs <= sortedKeyframes[0].timeMs) {
    return sortedKeyframes[0].value;
  }

  if (timeMs >= sortedKeyframes[sortedKeyframes.length - 1].timeMs) {
    return sortedKeyframes[sortedKeyframes.length - 1].value;
  }

  const nextIndex = sortedKeyframes.findIndex((entry) => entry.timeMs >= timeMs);
  const next = sortedKeyframes[nextIndex];
  const previous = sortedKeyframes[nextIndex - 1];

  if (!previous || !next) {
    return sortedKeyframes[sortedKeyframes.length - 1].value;
  }

  if (typeof previous.value === "string" || typeof next.value === "string") {
    return timeMs >= next.timeMs ? next.value : previous.value;
  }

  const factor = (timeMs - previous.timeMs) / (next.timeMs - previous.timeMs || 1);
  return interpolateValue(previous.value, next.value, factor, next.easing);
}

export function evaluateTimeline(
  timeline: SceneDocument["timeline"],
  timeMs: number
): Record<string, ScalarOrVector | string | null> {
  const normalizedTime = timeline.loop ? timeMs % timeline.durationMs : Math.min(timeMs, timeline.durationMs);
  return Object.fromEntries(
    timeline.tracks.map((track) => [`${track.targetRef}:${track.property}`, evaluateTrack(track, normalizedTime)])
  );
}
