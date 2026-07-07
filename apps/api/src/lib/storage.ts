import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Local-disk stand-in for Supabase Storage (the plan's production choice, which needs a
 * cloud project this sandbox doesn't have credentials for). Swapping to Supabase Storage
 * later means replacing the two functions below — nothing upstream depends on the disk
 * layout, only on a `storageKey` string.
 */
const STORAGE_ROOT = path.resolve(import.meta.dirname, "../../storage/files");
mkdirSync(STORAGE_ROOT, { recursive: true });

export function saveBuffer(buffer: Buffer, extension: string): string {
  const key = `${randomUUID()}.${extension}`;
  writeFileSync(path.join(STORAGE_ROOT, key), buffer);
  return key;
}

export function readStoredFile(key: string): Buffer {
  return readFileSync(resolveStoragePath(key));
}

export function resolveStoragePath(key: string): string {
  const safeKey = path.basename(key);
  return path.join(STORAGE_ROOT, safeKey);
}
