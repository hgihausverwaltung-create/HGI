import { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { FormRenderer, type AttachmentInfo, type PickedPhoto, type ReferenceOptionsByKind } from "@hgi/form-renderer-native";
import { draftAnswersSchema, templateSchemaSchema, type DraftAnswers, type TemplateSchema } from "@hgi/form-schema";
import { useAuth, API_BASE_URL } from "../../src/lib/auth";
import { persistLocalPhoto } from "../../src/lib/offlineStorage";
import {
  cacheProperties,
  cacheTemplateDetail,
  getCachedProperties,
  getCachedTemplateDetail,
  getLocalDraft,
  listLocalAttachmentsForDraft,
  removeLocalAttachment,
  upsertLocalAttachment,
  upsertLocalDraft,
  type LocalAttachment,
  type LocalDraft,
} from "../../src/lib/offlineStore";
import { runSync } from "../../src/lib/sync";
import { randomUUID } from "../../src/lib/uuid";

export default function DraftEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient, token } = useAuth();

  const [localDraft, setLocalDraft] = useState<LocalDraft | null>(null);
  const [answers, setAnswers] = useState<DraftAnswers | null>(null);
  const [schema, setSchema] = useState<TemplateSchema | null>(null);
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [referenceOptions, setReferenceOptions] = useState<ReferenceOptionsByKind>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [isSending, setIsSending] = useState(false);

  const refreshAttachments = useCallback(async () => {
    setAttachments(await listLocalAttachmentsForDraft(id));
  }, [id]);

  const loadDraft = useCallback(async () => {
    let local = await getLocalDraft(id);
    try {
      const server = await apiClient.drafts.getByClientUuid.query({ clientUuid: id });
      const parsedSchema = templateSchemaSchema.parse(server.templateVersion.schema);
      await cacheTemplateDetail({
        id: server.templateVersion.template.id,
        name: server.templateVersion.template.name,
        currentVersionId: server.templateVersion.id,
        versionNumber: server.templateVersion.versionNumber,
        schema: parsedSchema,
      });
      setSchema(parsedSchema);

      const keepLocalEdits = !!local && local.syncStatus !== "synced";
      const merged: LocalDraft = {
        clientUuid: server.clientUuid,
        serverId: server.id,
        templateId: server.templateVersion.template.id,
        templateName: server.templateVersion.template.name,
        title: keepLocalEdits ? local!.title : server.title,
        propertyId: keepLocalEdits ? local!.propertyId : (server.propertyId ?? undefined),
        unitId: keepLocalEdits ? local!.unitId : (server.unitId ?? undefined),
        answers: keepLocalEdits ? local!.answers : draftAnswersSchema.parse(server.answers),
        status: server.status,
        syncStatus: keepLocalEdits ? local!.syncStatus : "synced",
        syncError: keepLocalEdits ? local!.syncError : undefined,
        pendingSendRecipients: local?.pendingSendRecipients,
        createdAt: local?.createdAt ?? server.createdAt.toString(),
        updatedAt: keepLocalEdits ? local!.updatedAt : server.updatedAt.toString(),
      };
      await upsertLocalDraft(merged);

      const localAttachments = await listLocalAttachmentsForDraft(id);
      const localByUuid = new Map(localAttachments.map((a) => [a.clientUuid, a]));
      for (const serverAttachment of server.attachments) {
        if (localByUuid.has(serverAttachment.clientUuid)) continue; // uploaded from this device already, sync engine owns it
        await upsertLocalAttachment({
          clientUuid: serverAttachment.clientUuid,
          draftClientUuid: id,
          fieldPath: serverAttachment.fieldPath,
          kind: serverAttachment.kind,
          localUri: `${API_BASE_URL}/attachments/${serverAttachment.id}/file?token=${encodeURIComponent(token ?? "")}`,
          mimeType: "",
          fileName: serverAttachment.fieldPath,
          serverId: serverAttachment.id,
          syncStatus: "synced",
        });
      }

      local = merged;
      setIsOffline(false);
    } catch {
      if (!local) throw new Error("Entwurf konnte nicht geladen werden.");
      const cachedDetail = await getCachedTemplateDetail(local.templateId);
      if (!cachedDetail) throw new Error("Vorlage nicht offline verfügbar.");
      setSchema(cachedDetail.schema);
      setIsOffline(true);
    }

    setLocalDraft(local);
    setAnswers(local.answers);
    await refreshAttachments();

    try {
      const properties = await apiClient.properties.list.query();
      await cacheProperties(properties);
      setReferenceOptions({
        property: properties.map((p) => ({ value: p.id, label: p.name })),
        unit: properties.flatMap((p) => p.units.map((u) => ({ value: u.id, label: `${p.name} – ${u.label}` }))),
      });
    } catch {
      const properties = await getCachedProperties();
      setReferenceOptions({
        property: properties.map((p) => ({ value: p.id, label: p.name })),
        unit: properties.flatMap((p) => p.units.map((u) => ({ value: u.id, label: `${p.name} – ${u.label}` }))),
      });
    }
  }, [apiClient, id, refreshAttachments, token]);

  useFocusEffect(
    useCallback(() => {
      loadDraft()
        .then(() => runSync(apiClient, token))
        .then(refreshAttachments)
        .catch((e) => setError(e instanceof Error ? e.message : "Entwurf konnte nicht geladen werden."));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadDraft]),
  );

  const attachmentInfos: AttachmentInfo[] = useMemo(
    () => attachments.map((a) => ({ id: a.clientUuid, fieldPath: a.fieldPath, kind: a.kind, url: a.localUri })),
    [attachments],
  );

  async function handleSave() {
    if (!answers || !localDraft) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);
    const updated: LocalDraft = { ...localDraft, answers, updatedAt: new Date().toISOString(), syncStatus: "pending", syncError: undefined };
    await upsertLocalDraft(updated);
    setLocalDraft(updated);
    await runSync(apiClient, token);
    const refreshed = await getLocalDraft(updated.clientUuid);
    setLocalDraft(refreshed);
    if (refreshed?.syncStatus === "synced") {
      setNotice("Entwurf gespeichert.");
      setIsOffline(false);
    } else if (refreshed?.syncStatus === "error") {
      setError(refreshed.syncError ?? "Speichern fehlgeschlagen.");
    } else {
      setNotice("Offline gespeichert – wird synchronisiert, sobald wieder online.");
      setIsOffline(true);
    }
    setIsSaving(false);
  }

  async function handleUploadPhoto(fieldPath: string, photo: PickedPhoto, kind: "PHOTO" | "SIGNATURE") {
    if (!localDraft) return;
    const clientUuid = randomUUID();
    const extension = (photo.fileName.split(".").pop() || "jpg").toLowerCase();
    const localUri = await persistLocalPhoto(photo.uri, clientUuid, extension);
    await upsertLocalAttachment({
      clientUuid,
      draftClientUuid: localDraft.clientUuid,
      fieldPath,
      kind,
      localUri,
      mimeType: photo.mimeType,
      fileName: photo.fileName,
      serverId: null,
      syncStatus: "pending",
    });
    await refreshAttachments();
    await runSync(apiClient, token);
    await refreshAttachments();
  }

  async function handleDeleteAttachment(clientUuid: string) {
    const attachment = attachments.find((a) => a.clientUuid === clientUuid);
    if (attachment?.serverId) {
      try {
        await apiClient.drafts.deleteAttachment.mutate({ attachmentId: attachment.serverId });
      } catch {
        // Offline or failed — remove locally anyway; the server copy is reconciled manually later.
      }
    }
    await removeLocalAttachment(clientUuid);
    await refreshAttachments();
  }

  async function handleSend() {
    if (!localDraft) return;
    const list = recipients
      .split(/[,;\s]+/)
      .map((r) => r.trim())
      .filter(Boolean);
    if (list.length === 0) {
      setError("Bitte mindestens eine Empfänger-E-Mail angeben.");
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      await handleSave();
      const afterSave = await getLocalDraft(localDraft.clientUuid);
      if (afterSave?.syncStatus === "synced" && afterSave.serverId) {
        const result = await apiClient.drafts.send.mutate({ id: afterSave.serverId, recipients: list });
        if (result.status === "SENT") {
          const sent = { ...afterSave, status: "SENT" as const };
          await upsertLocalDraft(sent);
          setLocalDraft(sent);
          setShowSendDialog(false);
          Alert.alert("Gesendet", "Das Protokoll wurde versendet.");
        } else {
          setError(result.error ?? "Versand fehlgeschlagen.");
        }
      } else if (afterSave) {
        const queued = { ...afterSave, pendingSendRecipients: list };
        await upsertLocalDraft(queued);
        setLocalDraft(queued);
        setShowSendDialog(false);
        Alert.alert("Wird gesendet", "Kein Netz – das Protokoll wird automatisch versendet, sobald wieder online.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Versand fehlgeschlagen");
    } finally {
      setIsSending(false);
    }
  }

  if (!localDraft || !answers || !schema) return <Text style={styles.loading}>Lädt…</Text>;

  const isSent = localDraft.status === "SENT";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{localDraft.title}</Text>
        <Text style={styles.subtitle}>{localDraft.templateName}</Text>
        {isSent && <Text style={styles.info}>Dieses Protokoll wurde versendet und ist schreibgeschützt.</Text>}
        {localDraft.pendingSendRecipients && !isSent && (
          <Text style={styles.info}>Wird automatisch versendet, sobald wieder online.</Text>
        )}
        {isOffline && <Text style={styles.offline}>Offline – Änderungen werden lokal gespeichert und später synchronisiert.</Text>}
        {notice && <Text style={styles.info}>{notice}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        <FormRenderer
          schema={schema}
          answers={answers}
          onChange={setAnswers}
          attachments={attachmentInfos}
          onUploadPhoto={handleUploadPhoto}
          onDeleteAttachment={handleDeleteAttachment}
          referenceOptions={referenceOptions}
          readOnly={isSent}
        />
      </ScrollView>

      {!isSent && (
        <View style={styles.footer}>
          <Pressable style={styles.secondaryButton} onPress={handleSave} disabled={isSaving}>
            <Text style={styles.secondaryButtonText}>Speichern</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={() => setShowSendDialog(true)}>
            <Text style={styles.primaryButtonText}>Senden</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={showSendDialog} animationType="slide" transparent onRequestClose={() => setShowSendDialog(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Protokoll senden</Text>
            <TextInput
              style={styles.input}
              placeholder="empfaenger@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={recipients}
              onChangeText={setRecipients}
            />
            <View style={styles.footer}>
              <Pressable style={styles.secondaryButton} onPress={() => setShowSendDialog(false)}>
                <Text style={styles.secondaryButtonText}>Abbrechen</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={handleSend} disabled={isSending}>
                <Text style={styles.primaryButtonText}>{isSending ? "Wird gesendet…" : "Jetzt senden"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5f7" },
  loading: { padding: 16 },
  scrollContent: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#666", marginBottom: 12 },
  info: { backgroundColor: "white", padding: 10, borderRadius: 8, marginBottom: 12 },
  offline: { color: "#8a6d00", backgroundColor: "#fff3cd", padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 12 },
  error: { color: "#a33", marginBottom: 12 },
  footer: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#eee" },
  secondaryButton: { flex: 1, backgroundColor: "#e5e5e5", borderRadius: 8, padding: 14, alignItems: "center" },
  secondaryButtonText: { color: "#1a1a1a", fontWeight: "600" },
  primaryButton: { flex: 1, backgroundColor: "#b3182c", borderRadius: 8, padding: 14, alignItems: "center" },
  primaryButtonText: { color: "white", fontWeight: "600" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "white", borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 16 },
  sheetTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
});
