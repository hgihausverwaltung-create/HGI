import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FormRenderer, type AttachmentInfo, type ReferenceOptionsByKind } from "@hgi/form-renderer";
import { draftAnswersSchema, templateSchemaSchema, type DraftAnswers, type TemplateSchema } from "@hgi/form-schema";
import { useAuth } from "../lib/auth";

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

export function DraftEditorPage() {
  const { apiClient, apiBaseUrl, token } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const draftId = params.id!;

  const [draft, setDraft] = useState<DraftDto | null>(null);
  const [answers, setAnswers] = useState<DraftAnswers | null>(null);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});
  const [referenceOptions, setReferenceOptions] = useState<ReferenceOptionsByKind>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function loadDraft() {
    const [d, properties] = await Promise.all([apiClient.drafts.getById.query({ id: draftId }), apiClient.properties.list.query()]);
    setDraft(d);
    setAnswers(draftAnswersSchema.parse(d.answers));
    setReferenceOptions({
      property: properties.map((p) => ({ value: p.id, label: `${p.name}` })),
      unit: properties.flatMap((p) => p.units.map((u) => ({ value: u.id, label: `${p.name} – ${u.label}` }))),
    });
  }

  /** Refreshes only the draft's attachments (e.g. after upload/delete) without touching
   * the in-progress `answers` state, which would otherwise discard unsaved edits. */
  async function refreshAttachments() {
    const d = await apiClient.drafts.getById.query({ id: draftId });
    setDraft(d);
  }

  useEffect(() => {
    loadDraft().catch(() => setError("Entwurf konnte nicht geladen werden."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  useEffect(() => {
    if (!draft) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        draft.attachments.map(async (a) => {
          const res = await fetch(`${apiBaseUrl}/attachments/${a.id}/file`, { headers: { Authorization: `Bearer ${token}` } });
          const blob = await res.blob();
          return [a.id, URL.createObjectURL(blob)] as const;
        }),
      );
      if (!cancelled) setBlobUrls(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [draft, apiBaseUrl, token]);

  const schema = useMemo<TemplateSchema | null>(() => {
    if (!draft) return null;
    return templateSchemaSchema.parse(draft.templateVersion.schema);
  }, [draft]);

  const attachmentInfos: AttachmentInfo[] = useMemo(
    () =>
      draft?.attachments.map((a) => ({ id: a.id, fieldPath: a.fieldPath, kind: a.kind, url: blobUrls[a.id] ?? "" })).filter((a) => a.url) ?? [],
    [draft, blobUrls],
  );

  async function handleSave() {
    if (!answers) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.drafts.updateAnswers.mutate({ id: draftId, answers });
      setNotice("Entwurf gespeichert.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadPhoto(fieldPath: string, file: File, kind: "PHOTO" | "SIGNATURE") {
    const formData = new FormData();
    formData.append("draftId", draftId);
    formData.append("fieldPath", fieldPath);
    formData.append("kind", kind);
    formData.append("file", file);
    const res = await fetch(`${apiBaseUrl}/uploads`, {
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
      const result = await apiClient.drafts.send.mutate({ id: draftId, recipients: list });
      if (result.status === "SENT") {
        setNotice("Protokoll wurde versendet.");
        setShowSendDialog(false);
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

  if (!draft || !answers || !schema) return <p>Lädt…</p>;

  const isSent = draft.status === "SENT";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>{draft.title}</h1>
          <p className="hint">{draft.templateVersion.template.name}</p>
        </div>
        {!isSent && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="secondary" onClick={handleSave} disabled={isSaving}>
              Speichern
            </button>
            <button onClick={() => setShowSendDialog(true)}>Senden</button>
          </div>
        )}
      </div>

      {isSent && <div className="card">Dieses Protokoll wurde versendet und ist schreibgeschützt.</div>}
      {notice && <div className="card">{notice}</div>}
      {error && <div className="error-box">{error}</div>}

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

      {showSendDialog && (
        <div className="card">
          <h3>Protokoll senden</h3>
          <label>
            Empfänger (E-Mail, mehrere durch Komma getrennt)
            <input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="mieter@example.com" />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className="secondary" onClick={() => setShowSendDialog(false)}>
              Abbrechen
            </button>
            <button onClick={handleSend} disabled={isSending}>
              {isSending ? "Wird gesendet…" : "Jetzt senden"}
            </button>
          </div>
        </div>
      )}

      <button className="secondary" style={{ marginTop: "1rem" }} onClick={() => navigate(-1)}>
        Zurück
      </button>
    </div>
  );
}
