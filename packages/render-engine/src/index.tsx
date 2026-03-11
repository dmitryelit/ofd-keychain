"use client";

import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { evaluateTimeline, type MaterialDefinition, type ScalarOrVector, type SceneDocument, type ShapeAsset } from "@ofd-keychain/scene-core";
import { useEffect, useMemo, useRef } from "react";
import {
  Box3,
  Color,
  ExtrudeGeometry,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  Shape,
  Vector3,
  type DirectionalLight as ThreeDirectionalLight,
  type PerspectiveCamera,
  type ShapePath,
  type SpotLight as ThreeSpotLight
} from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

export interface ExtrudeOptions {
  depth: number;
  bevelEnabled: boolean;
  bevelSegments: number;
  bevelSize: number;
  bevelThickness: number;
}

export function createMaterial(material: MaterialDefinition) {
  return new MeshPhysicalMaterial({
    color: new Color(material.color),
    roughness: material.roughness,
    metalness: material.metalness,
    clearcoat: material.clearcoat,
    emissive: new Color(material.emissive),
    reflectivity: MathUtils.clamp(0.5 + material.clearcoat * 0.5, 0, 1)
  });
}

export function createExtrudedGeometry(asset: ShapeAsset, options: ExtrudeOptions) {
  const loader = new SVGLoader();
  const data = loader.parse(asset.normalizedSvgMarkup);
  const shapes = data.paths.flatMap((path: ShapePath) => SVGLoader.createShapes(path));
  const geometry = new ExtrudeGeometry(shapes, {
    ...options,
    curveSegments: 24,
    steps: 1
  });
  geometry.computeVertexNormals();
  geometry.center();
  geometry.computeBoundingBox();

  const boundingBox = geometry.boundingBox ?? new Box3();
  const size = new Vector3();
  boundingBox.getSize(size);
  const maxDimension = Math.max(size.x, size.y, size.z, 1);
  const normalizedScale = 5.5 / maxDimension;
  geometry.scale(normalizedScale, normalizedScale, normalizedScale);
  geometry.computeBoundingBox();
  geometry.center();
  return geometry;
}

function toVector3(value: ScalarOrVector | string | null, fallback: [number, number, number]) {
  return Array.isArray(value) && value.length === 3 ? value : fallback;
}

function DirectionalSceneLight({
  color,
  intensity,
  position,
  castShadow,
  target
}: {
  color: string;
  intensity: number;
  position: [number, number, number];
  castShadow: boolean;
  target?: [number, number, number];
}) {
  const lightRef = useRef<ThreeDirectionalLight>(null);
  const targetObject = useMemo(() => new Object3D(), []);

  useEffect(() => {
    targetObject.position.fromArray(target ?? [0, 0, 0]);

    if (lightRef.current) {
      lightRef.current.target = targetObject;
      lightRef.current.target.updateMatrixWorld();
    }

    return () => {
      targetObject.removeFromParent();
    };
  }, [target, targetObject]);

  return (
    <>
      <primitive object={targetObject} />
      <directionalLight ref={lightRef} color={color} intensity={intensity} position={position} castShadow={castShadow} />
    </>
  );
}

function SpotSceneLight({
  color,
  intensity,
  position,
  castShadow,
  target
}: {
  color: string;
  intensity: number;
  position: [number, number, number];
  castShadow: boolean;
  target?: [number, number, number];
}) {
  const lightRef = useRef<ThreeSpotLight>(null);
  const targetObject = useMemo(() => new Object3D(), []);

  useEffect(() => {
    targetObject.position.fromArray(target ?? [0, 0, 0]);

    if (lightRef.current) {
      lightRef.current.target = targetObject;
      lightRef.current.target.updateMatrixWorld();
    }

    return () => {
      targetObject.removeFromParent();
    };
  }, [target, targetObject]);

  return (
    <>
      <primitive object={targetObject} />
      <spotLight ref={lightRef} color={color} intensity={intensity} position={position} castShadow={castShadow} />
    </>
  );
}

function KeychainMesh({
  scene,
  meshRef
}: {
  scene: SceneDocument;
  meshRef: React.RefObject<Mesh | null>;
}) {
  const keychainObject = scene.objects[0];
  const asset = scene.assets.find((entry) => entry.id === keychainObject?.assetId);
  const materialDefinition = scene.materials.find((entry) => entry.id === keychainObject?.materialId);

  const geometry = useMemo(() => {
    if (!asset || !keychainObject) {
      return new ExtrudeGeometry([new Shape()], { depth: 1 });
    }

    return createExtrudedGeometry(asset, {
      depth: keychainObject.params.depth,
      bevelEnabled: keychainObject.params.bevelEnabled,
      bevelSegments: keychainObject.params.bevelSegments,
      bevelSize: keychainObject.params.bevelSize,
      bevelThickness: keychainObject.params.bevelThickness
    });
  }, [asset, keychainObject]);

  const material = useMemo(() => {
    if (!materialDefinition) {
      return new MeshPhysicalMaterial({ color: "#d4d4d8" });
    }

    return createMaterial(materialDefinition);
  }, [materialDefinition]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  if (!keychainObject) {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      castShadow
      geometry={geometry}
      material={material}
      position={keychainObject.transform.position}
      rotation={keychainObject.transform.rotation}
      scale={keychainObject.transform.scale}
    />
  );
}

function SceneLights({ scene }: { scene: SceneDocument }) {
  return (
    <>
      {scene.lights.map((light) => {
        if (light.kind === "ambient") {
          return <ambientLight key={light.id} color={light.color} intensity={light.intensity} />;
        }

        if (light.kind === "directional") {
          return (
            <DirectionalSceneLight
              key={light.id}
              color={light.color}
              intensity={light.intensity}
              position={light.position}
              target={light.target}
              castShadow={light.castShadow}
            />
          );
        }

        if (light.kind === "spot") {
          return (
            <SpotSceneLight
              key={light.id}
              color={light.color}
              intensity={light.intensity}
              position={light.position}
              target={light.target}
              castShadow={light.castShadow}
            />
          );
        }

        return (
          <pointLight
            key={light.id}
            color={light.color}
            intensity={light.intensity}
            position={light.position}
            castShadow={light.castShadow}
          />
        );
      })}
    </>
  );
}

function SceneRuntime({
  scene,
  playbackTimeMs,
  autoplayTimeline,
  readOnly
}: {
  scene: SceneDocument;
  playbackTimeMs: number;
  autoplayTimeline: boolean;
  readOnly: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const cameraRef = camera as PerspectiveCamera;
  const fallbackTarget = useMemo(() => new Vector3(...scene.cameraRig.target), [scene.cameraRig.target]);
  const keychainObject = scene.objects[0];

  useFrame(({ clock }) => {
    const effectiveTimeMs = autoplayTimeline ? clock.getElapsedTime() * 1000 : playbackTimeMs;
    const timelineValues = evaluateTimeline(scene.timeline, effectiveTimeMs);

    if (meshRef.current && keychainObject) {
      const nextPosition = toVector3(
        timelineValues[`${keychainObject.id}:transform.position`] as ScalarOrVector | string | null,
        keychainObject.transform.position
      );
      const nextRotation = toVector3(
        timelineValues[`${keychainObject.id}:transform.rotation`] as ScalarOrVector | string | null,
        keychainObject.transform.rotation
      );
      const nextScale = toVector3(
        timelineValues[`${keychainObject.id}:transform.scale`] as ScalarOrVector | string | null,
        keychainObject.transform.scale
      );

      meshRef.current.position.set(...nextPosition);
      meshRef.current.rotation.set(...nextRotation);
      meshRef.current.scale.set(...nextScale);
    }

    const nextCameraPosition = toVector3(
      timelineValues["cameraRig:position"] as ScalarOrVector | string | null,
      scene.cameraRig.position
    );
    const nextCameraTarget = toVector3(
      timelineValues["cameraRig:target"] as ScalarOrVector | string | null,
      scene.cameraRig.target
    );

    cameraRef.position.set(...nextCameraPosition);

    if (controlsRef.current) {
      controlsRef.current.target.set(...nextCameraTarget);
      controlsRef.current.update();
    } else {
      fallbackTarget.set(...nextCameraTarget);
      cameraRef.lookAt(fallbackTarget);
    }
  });

  return (
    <>
      <SceneLights scene={scene} />
      {scene.environment.hdriUrl ? <Environment files={scene.environment.hdriUrl} background={false} /> : null}
      <KeychainMesh scene={scene} meshRef={meshRef} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.06}
        enablePan={!readOnly}
        enableZoom
        autoRotate={!autoplayTimeline && scene.cameraRig.autoRotate}
        autoRotateSpeed={scene.cameraRig.autoRotateSpeed}
        target={scene.cameraRig.target}
      />
    </>
  );
}

export function KeychainCanvas({
  scene,
  readOnly = false,
  className,
  playbackTimeMs = 0,
  autoplayTimeline = false
}: {
  scene: SceneDocument;
  readOnly?: boolean;
  className?: string;
  playbackTimeMs?: number;
  autoplayTimeline?: boolean;
}) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: scene.cameraRig.position, fov: scene.cameraRig.fov }}
        dpr={[1, 1.75]}
        shadows
        gl={{ antialias: true }}
      >
        <color attach="background" args={[scene.viewport.background]} />
        <fog attach="fog" args={["#d6d3d1", 18, 30]} />
        <SceneRuntime
          scene={scene}
          playbackTimeMs={playbackTimeMs}
          autoplayTimeline={autoplayTimeline}
          readOnly={readOnly}
        />
      </Canvas>
    </div>
  );
}
