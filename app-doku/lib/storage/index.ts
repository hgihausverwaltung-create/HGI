import { LocalDiskStorageAdapter } from "./local-disk-adapter";
import type { StorageAdapter } from "./storage-adapter";

function createStorageAdapter(): StorageAdapter {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  switch (driver) {
    case "local":
      return new LocalDiskStorageAdapter();
    default:
      throw new Error(`Unbekannter STORAGE_DRIVER: ${driver}`);
  }
}

export const storage = createStorageAdapter();
export type { StorageAdapter } from "./storage-adapter";
