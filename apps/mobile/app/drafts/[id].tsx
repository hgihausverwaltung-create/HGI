import { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { FormRenderer, type AttachmentInfo, type PickedPhoto, type ReferenceOptionsByKind } from "@hgi/form-renderer-native";
import { draftAnswersSchema, templateSchemaSchema, type DraftAnswers, type TemplateSchema } from "@hgi/form-schema";
import { useAuth, API_BASE_URL } from "../../src/lib/auth";

interface RawAttachment {
  id: string;
  fieldPath: string;
  kind: "PHOTO" | "SIGNATURE";
  storageKey: string | null;
}

interface DraftDto {
  id: string;
  title: string;
  status: "DRAFT" | "PENDING_SEND" | "SENT" | "FAILED";
  answers?: unknown;
  templateVersion: { schema?: unknown; template: { name: string } };
  attachments: RawAttachment[];
}

export default function DraftEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiClient, token } = useAuth();

  const [draft, setDraft] = useState<DraftDto | null>(null);
  const [answers, setAnswers] = useState<DraftAnswers | null>(null);
  const [referenceOptions, setReferenceOptions] = useState<ReferenceOptionsByKind>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [isSending, setIsSending] = useState(false);

  const loadDraft = useCallback(async () => {
    const [d, properties] = await Promise.all([apiClient.drafts.getById.query({ id }), apiClient.properties.list.query()]);
    setDraft(d);
    setAnswers(draftAnswersSchema.parse(d.answers));
    setReferenceOptions({
      property: properties.map((p) => ({ value: p.id, label: p.name })),
      unit: properties.flatMap((p) => p.units.map((u) => ({ value: u.id, label: `${p.name} – ${u.label}` }))),
    });
  }, [apiClient, id]);

  const refreshAttachments = useCallback(async () => {
    const d = await apiClient.drafts.getById.query({ id });
    setDraft(d);
  }, [apiClient, id]);

  useFocusEffect(
    useCallback(() => {
      loadDraft().catch(() => setError("Entwurf konnte nicht geladen werden."));
    }, [loadDraft]),
  );

  const schema = useMemo<TemplateSchema | null>(() => (draft ? templateSchemaSchema.parse(draft.templateVersion.schema) : null), [draft]);

  const attachmentInfos: AttachmentInfo[] = useMemo(
    () =>
      draft?.attachments.map((a) => ({
        id: a.id,
        fieldPath: a.fieldPath,
        kind: a.kind,
        // <Image> can't set an Authorization header, so the file route also accepts the
        // token as a query param (see apps/api/src/lib/requestAuth.ts).
        url: `${API_BASE_URL}/attachments/${a.id}/file?token=${encodeURIComponent(token ?? "")}`,
      })) ?? [],
    [draft, token],
  );

  async function handleSave() {
    if (!answers) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.drafts.updateAnswers.mutate({ id, answers });
      setNotice("Entwurf gespeichert.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadPhoto(fieldPath: string, photo: PickedPhoto, kind: "PHOTO" | "SIGNATURE") {
    const formData = new FormData();
    formData.append("draftId", id);
    formData.append("fieldPath", fieldPath);
    formData.append("kind", kind);
    // React Native's fetch/FormData accepts this {uri, name, type} shape for files.
    formData.append("file", { uri: photo.uri, name: photo.fileName, type: photo.mimeType } as unknown as Blob);

    const res = await fetch(`${API_BASE_URL}/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      setError("Foto-Upload fehlgeschlagen.");
      return;
    }
    await refreshAttachments();
  }

  async function handleDeleteAttachment(attachmentId: string) {
    await apiClient.drafts.deleteAttachment.mutate({ attachmentId });
    await refreshAttachments();
  }

  async function handleSend() {
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
      const result = await apiClient.drafts.send.mutate({ id, recipients: list });
      if (result.status === "SENT") {
        setShowSendDialog(false);
        Alert.alert("Gesendet", "Das Protokoll wurde versendet.");
        await loadDraft();
      } else {
        setError(result.error ?? "Versand fehlgeschlagen.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Versand fehlgeschlagen");
    } finally {
      setIsSending(false);
    }
  }

  if (!draft || !answers || !schema) return <Text style={styles.loading}>Lädt…</Text>;

  const isSent = draft.status === "SENT";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{draft.title}</Text>
        <Text style={styles.subtitle}>{draft.templateVersion.template.name}</Text>
        {isSent && <Text style={styles.info}>Dieses Protokoll wurde versendet und ist schreibgeschützt.</Text>}
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
