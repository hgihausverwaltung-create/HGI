import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEY = "hgi.token";

/** expo-secure-store has no web implementation; localStorage is the pragmatic equivalent
 * there (used only for the `expo start --web` verification target in this sandbox). */
export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") return localStorage.getItem(KEY);
  return SecureStore.getItemAsync(KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(KEY, token);
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
