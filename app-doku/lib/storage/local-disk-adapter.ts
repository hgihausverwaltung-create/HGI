import { mkdir, readFile, writeFile, unlink, access } from "fs/promises";
import path from "path";
import type { StorageAdapter } from "./storage-adapter";

const STORAGE_ROOT = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.STORAGE_ROOT ?? "./storage"
);

function resolveKey(key: string): string {
  const resolved = path.resolve(STORAGE_ROOT, key);
  if (!resolved.startsWith(STORAGE_ROOT + path.sep)) {
    throw new Error(`Ungueltiger Storage-Key: ${key}`);
  }
  return resolved;
}

export class LocalDiskStorageAdapter implements StorageAdapter {
  async put(key: string, data: Buffer): Promise<void> {
    const filePath = resolveKey(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(resolveKey(key));
  }

  async delete(key: string): Promise<void> {
    await unlink(resolveKey(key)).catch((err) => {
      if (err.code !== "ENOENT") throw err;
    });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }
}
