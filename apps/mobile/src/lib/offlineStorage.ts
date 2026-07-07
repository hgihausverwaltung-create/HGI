import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";

const STORE_FILE_NAME = "hgi-offline-store-v1.json";
const STORE_LOCALSTORAGE_KEY = "hgi.offlineStore.v1";
const PHOTOS_DIR_NAME = "hgi-photos";

function nativeStoreFile(): File {
  return new File(Paths.document, STORE_FILE_NAME);
}

export async function readStoreFile(): Promise<string | null> {
  if (Platform.OS === "web") return localStorage.getItem(STORE_LOCALSTORAGE_KEY);
  const file = nativeStoreFile();
  if (!file.exists) return null;
  return file.text();
}

export async function writeStoreFile(json: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(STORE_LOCALSTORAGE_KEY, json);
    return;
  }
  const file = nativeStoreFile();
  if (!file.exists) file.create({ intermediates: true });
  file.write(json);
}

/** Persists a locally picked photo outside the OS-managed image-picker cache dir so it
 * survives across app restarts while a draft is still waiting to sync. No-op on web,
 * where the picker already returns a durable blob/data URI. */
export async function persistLocalPhoto(sourceUri: string, clientUuid: string, extension: string): Promise<string> {
  if (Platform.OS === "web") return sourceUri;
  const dir = new Directory(Paths.document, PHOTOS_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  const destination = new File(dir, `${clientUuid}.${extension}`);
  await new File(sourceUri).copy(destination);
  return destination.uri;
}
