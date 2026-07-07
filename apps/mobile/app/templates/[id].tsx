import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { templateSchemaSchema } from "@hgi/form-schema";
import { useAuth } from "../../src/lib/auth";
import {
  cacheTemplateDetail,
  getCachedTemplateDetail,
  listLocalDraftsForTemplate,
  upsertLocalDraft,
  type CachedTemplateDetail,
  type DraftStatus,
  type LocalDraft,
} from "../../src/lib/offlineStore";
import { runSync } from "../../src/lib/sync";
import { randomUUID } from "../../src/lib/uuid";

interface DraftListItem {
  clientUuid: string;
  title: string;
  status: DraftStatus;
  createdBy: { name: string };
  syncStatus: "synced" | "pending" | "error";
}

const TABS = ["uebersicht", "entwuerfe", "gesendet"] as const;
type Tab = (typeof TABS)[number];

const STATUS_LABEL: Record<DraftStatus, string> = {
  DRAFT: "Entwurf",
  PENDING_SEND: "Wird gesendet…",
  SENT: "Gesendet",
  FAILED: "Fehlgeschlagen",
};

function formatTitleTimestamp(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}. ${hh}:${min}`;
}

function toListItem(draft: LocalDraft): DraftListItem {
  return { clientUuid: draft.clientUuid, title: draft.title, status: draft.status, createdBy: { name: "" }, syncStatus: draft.syncStatus };
}

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient, user, token } = useAuth();
  const router = useRouter();
  const [detail, setDetail] = useState<CachedTemplateDetail | null>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftListItem[] | null>(null);
  const [tab, setTab] = useState<Tab>("uebersicht");
  const [isCreating, setIsCreating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromCache = useCallback(async () => {
    const [cachedDetail, localDrafts] = await Promise.all([getCachedTemplateDetail(id), listLocalDraftsForTemplate(id)]);
    if (!cachedDetail) {
      setError("Diese Vorlage wurde noch nicht offline gespeichert – bitte einmal online öffnen.");
      return;
    }
    setDetail(cachedDetail);
    setTemplateName(cachedDetail.name);
    setDrafts(localDrafts.map(toListItem));
    setIsOffline(true);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([apiClient.templates.getById.query({ id }), apiClient.drafts.list.query({ templateId: id })])
        .then(async ([t, serverDrafts]) => {
          setIsOffline(false);
          setError(null);
          setTemplateName(t.name);
          if (t.currentVersion) {
            const cached: CachedTemplateDetail = {
              id: t.id,
              name: t.name,
              currentVersionId: t.currentVersion.id,
              versionNumber: t.currentVersion.versionNumber,
              schema: templateSchemaSchema.parse(t.currentVersion.schema),
            };
            setDetail(cached);
            await cacheTemplateDetail(cached);
          } else {
            setDetail(null);
          }

          const localDrafts = await listLocalDraftsForTemplate(id);
          const localByUuid = new Map(localDrafts.map((d) => [d.clientUuid, d]));
          for (const serverDraft of serverDrafts) {
            const local = localByUuid.get(serverDraft.clientUuid);
            if (local && local.syncStatus !== "synced") continue; // unsynced local edits win, don't clobber
            await upsertLocalDraft({
              clientUuid: serverDraft.clientUuid,
              serverId: serverDraft.id,
              templateId: id,
              templateName: t.name,
              title: serverDraft.title,
              propertyId: serverDraft.propertyId ?? undefined,
              unitId: serverDraft.unitId ?? undefined,
              answers: local?.answers ?? { values: {}, repeatables: {} },
              status: serverDraft.status,
              syncStatus: "synced",
              createdAt: serverDraft.createdAt.toString(),
              updatedAt: serverDraft.updatedAt.toString(),
            });
          }
          const merged = await listLocalDraftsForTemplate(id);
          setDrafts(
            merged.map((d) => {
              const server = serverDrafts.find((s) => s.clientUuid === d.clientUuid);
              return { ...toListItem(d), createdBy: { name: server?.createdBy.name ?? user?.name ?? "" } };
            }),
          );
          void runSync(apiClient, token);
        })
        .catch(() => loadFromCache());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiClient, id]),
  );

  async function handleNewDraft() {
    if (!detail) {
      setError("Vorlage hat keine veröffentlichte Version.");
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const now = new Date();
      const draft: LocalDraft = {
        clientUuid: randomUUID(),
        serverId: null,
        templateId: id,
        templateName: templateName ?? detail.name,
        title: `${detail.name} ${formatTitleTimestamp(now)}`,
        answers: { values: {}, repeatables: {} },
        status: "DRAFT",
        syncStatus: "pending",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      await upsertLocalDraft(draft);
      void runSync(apiClient, token);
      router.push(`/drafts/${draft.clientUuid}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Entwurf konnte nicht angelegt werden.");
    } finally {
      setIsCreating(false);
    }
  }

  if (!drafts) return <Text style={styles.loading}>Lädt…</Text>;

  const openDrafts = drafts.filter((d) => d.status !== "SENT");
  const sentDrafts = drafts.filter((d) => d.status === "SENT");
  const canFill = !!detail;
  const list = tab === "entwuerfe" ? openDrafts : tab === "gesendet" ? sentDrafts : [];

  return (
    <View style={styles.container}>
      {isOffline && <Text style={styles.offline}>Offline – lokal gespeicherte Daten werden angezeigt.</Text>}
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
          keyExtractor={(item) => item.clientUuid}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Keine Einträge.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.draftRow} onPress={() => router.push(`/drafts/${item.clientUuid}`)}>
              <Text style={styles.draftTitle}>{item.title}</Text>
              <Text style={styles.draftMeta}>
                {STATUS_LABEL[item.status]}
                {item.createdBy.name ? ` · ${item.createdBy.name}` : ""}
                {item.syncStatus !== "synced" ? " · wird synchronisiert…" : ""}
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
  offline: { color: "#8a6d00", backgroundColor: "#fff3cd", paddingVertical: 6, paddingHorizontal: 12, fontSize: 12 },
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
