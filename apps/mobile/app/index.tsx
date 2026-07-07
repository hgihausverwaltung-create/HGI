import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../src/lib/auth";
import { cacheTemplates, getCachedTemplates, type CachedTemplate } from "../src/lib/offlineStore";
import { runSync } from "../src/lib/sync";

type TemplateListItem = CachedTemplate;

export default function TemplatesHomeScreen() {
  const { apiClient, user, logout, token } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useFocusEffect(
    useCallback(() => {
      apiClient.templates.list
        .query()
        .then(async (list) => {
          setIsOffline(false);
          setError(null);
          setTemplates(list);
          await cacheTemplates(list);
          void runSync(apiClient, token);
        })
        .catch(async () => {
          const cached = await getCachedTemplates();
          if (cached.length > 0) {
            setTemplates(cached);
            setIsOffline(true);
          } else {
            setError("Vorlagen konnten nicht geladen werden.");
          }
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiClient]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {user?.name} ({user?.role})
        </Text>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>Abmelden</Text>
        </Pressable>
      </View>
      {isOffline && <Text style={styles.offline}>Offline – zuletzt geladene Vorlagen werden angezeigt.</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={templates ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable style={styles.tile} onPress={() => router.push(`/templates/${item.id}`)}>
            <Text style={styles.tileIcon}>📄</Text>
            <Text style={styles.tileTitle}>{item.name}</Text>
            {item.currentVersion ? (
              <Text style={styles.tileBadge}>
                v{item.currentVersion.versionNumber} · {item.currentVersion.status}
              </Text>
            ) : (
              <Text style={styles.tileBadge}>kein Entwurf veröffentlicht</Text>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5f7" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  headerText: { fontWeight: "500" },
  logout: { color: "#b3182c", fontWeight: "600" },
  error: { color: "#a33", paddingHorizontal: 16 },
  offline: { color: "#8a6d00", backgroundColor: "#fff3cd", paddingVertical: 6, paddingHorizontal: 16, fontSize: 12 },
  grid: { padding: 12 },
  row: { gap: 12 },
  tile: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tileIcon: { fontSize: 28, marginBottom: 6 },
  tileTitle: { fontWeight: "600", textAlign: "center", marginBottom: 6 },
  tileBadge: { fontSize: 11, color: "#666", textAlign: "center" },
});
