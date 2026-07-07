import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../src/lib/auth";

type DraftStatus = "DRAFT" | "PENDING_SEND" | "SENT" | "FAILED";

interface DraftListItem {
  id: string;
  title: string;
  status: DraftStatus;
  createdBy: { name: string };
}

interface TemplateDto {
  id: string;
  name: string;
  description: string | null;
  currentVersion: { versionNumber: number; status: string } | null;
}

const TABS = ["uebersicht", "entwuerfe", "gesendet"] as const;
type Tab = (typeof TABS)[number];

const STATUS_LABEL: Record<DraftStatus, string> = {
  DRAFT: "Entwurf",
  PENDING_SEND: "Wird gesendet…",
  SENT: "Gesendet",
  FAILED: "Fehlgeschlagen",
};

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient } = useAuth();
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateDto | null>(null);
  const [drafts, setDrafts] = useState<DraftListItem[] | null>(null);
  const [tab, setTab] = useState<Tab>("uebersicht");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([apiClient.templates.getById.query({ id }), apiClient.drafts.list.query({ templateId: id })])
        .then(([t, d]) => {
          setTemplate(t);
          setDrafts(d);
        })
        .catch(() => setError("Vorlage konnte nicht geladen werden."));
    }, [apiClient, id]),
  );

  async function handleNewDraft() {
    setIsCreating(true);
    setError(null);
    try {
      const draft = await apiClient.drafts.create.mutate({ templateId: id });
      router.push(`/drafts/${draft.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Entwurf konnte nicht angelegt werden.");
    } finally {
      setIsCreating(false);
    }
  }

  if (!template || !drafts) return <Text style={styles.loading}>Lädt…</Text>;

  const openDrafts = drafts.filter((d) => d.status !== "SENT");
  const sentDrafts = drafts.filter((d) => d.status === "SENT");
  const canFill = !!template.currentVersion && template.currentVersion.status === "PUBLISHED";
  const list = tab === "entwuerfe" ? openDrafts : tab === "gesendet" ? sentDrafts : [];

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t} style={[styles.tab, t === tab && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, t === tab && styles.tabTextActive]}>
              {t === "uebersicht" ? "Übersicht" : t === "entwuerfe" ? `Entwürfe (${openDrafts.length})` : `Gesendet (${sentDrafts.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "uebersicht" && (
        <View style={styles.card}>
          {!canFill ? (
            <Text>Diese Vorlage hat noch keine veröffentlichte Version.</Text>
          ) : (
            <Pressable style={styles.newButton} onPress={handleNewDraft} disabled={isCreating}>
              <Text style={styles.newButtonText}>{isCreating ? "Wird angelegt…" : "+ Neuer Entwurf"}</Text>
            </Pressable>
          )}
        </View>
      )}

      {tab !== "uebersicht" && (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Keine Einträge.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.draftRow} onPress={() => router.push(`/drafts/${item.id}`)}>
              <Text style={styles.draftTitle}>{item.title}</Text>
              <Text style={styles.draftMeta}>
                {STATUS_LABEL[item.status]} · {item.createdBy.name}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5f7" },
  loading: { padding: 16 },
  error: { color: "#a33", padding: 12 },
  tabs: { flexDirection: "row", backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#b3182c" },
  tabText: { color: "#666", fontSize: 13 },
  tabTextActive: { color: "#b3182c", fontWeight: "600" },
  card: { backgroundColor: "white", margin: 16, borderRadius: 10, padding: 16 },
  newButton: { backgroundColor: "#b3182c", borderRadius: 8, padding: 14, alignItems: "center" },
  newButtonText: { color: "white", fontWeight: "600" },
  list: { padding: 12 },
  empty: { textAlign: "center", color: "#888", marginTop: 24 },
  draftRow: { backgroundColor: "white", borderRadius: 8, padding: 14, marginBottom: 8 },
  draftTitle: { fontWeight: "600", marginBottom: 4 },
  draftMeta: { fontSize: 12, color: "#666" },
});
