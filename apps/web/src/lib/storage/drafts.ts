"use client";

import type { SceneDocument } from "@ofd-keychain/scene-core";
import { del, get, set } from "idb-keyval";

const key = (projectId: string) => `ofd-keychain:draft:${projectId}`;

export async function loadDraft(projectId: string) {
  return (await get<SceneDocument>(key(projectId))) ?? null;
}

export async function saveDraft(projectId: string, scene: SceneDocument) {
  await set(key(projectId), scene);
}

export async function clearDraft(projectId: string) {
  await del(key(projectId));
}
