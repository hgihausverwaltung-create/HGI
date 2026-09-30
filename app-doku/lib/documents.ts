import { randomUUID } from "crypto";
import path from "path";

export function sanitizeFilename(filename: string): string {
  const base = path.basename(filename);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildStorageKey(objektId: string, originalFilename: string): string {
  const safeName = sanitizeFilename(originalFilename);
  return `objekt-${objektId}/${randomUUID()}-${safeName}`;
}
