import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProjectRecord, RenderJobRecord } from "./types";

interface DatabaseFile {
  projects: ProjectRecord[];
  renderJobs: RenderJobRecord[];
}

const DB_DIR = path.join(process.cwd(), ".local-data");
const DB_FILE = path.join(DB_DIR, "db.json");

async function ensureDb() {
  await mkdir(DB_DIR, { recursive: true });

  try {
    await readFile(DB_FILE, "utf8");
  } catch {
    const initial: DatabaseFile = { projects: [], renderJobs: [] };
    await writeFile(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

export async function readDb(): Promise<DatabaseFile> {
  await ensureDb();
  const raw = await readFile(DB_FILE, "utf8");
  return JSON.parse(raw) as DatabaseFile;
}

export async function writeDb(db: DatabaseFile) {
  await ensureDb();
  await writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}
