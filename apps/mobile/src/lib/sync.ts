import { Platform } from "react-native";
import { TRPCClientError } from "@trpc/client";
import type { ApiClient } from "@hgi/api-client";
import { API_BASE_URL } from "./auth";
import {
  getLocalDraft,
  listDraftsPendingSend,
  listLocalAttachmentsForDraft,
  listPendingAttachments,
  listPendingDrafts,
  upsertLocalAttachment,
  upsertLocalDraft,
  type LocalAttachment,
} from "./offlineStore";

export interface SyncSummary {
  syncedDrafts: number;
  syncedAttachments: number;
  sent: number;
  errors: string[];
}

/** A TRPCError with a `.data.code` means the server understood and rejected the request —
 * retrying the same payload won't help, so we stop treating it as merely "pending". Anything
 * else (network failure, timeout) is treated as transient and retried on the next sync pass. */
function isPermanentError(error: unknown): boolean {
  return error instanceof TRPCClientError && typeof error.data?.code === "string";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Synchronisierung fehlgeschlagen";
}

async function uploadAttachment(draftServerId: string, attachment: LocalAttachment, token: string | null): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append("draftId", draftServerId);
  formData.append("fieldPath", attachment.fieldPath);
  formData.append("kind", attachment.kind);
  formData.append("clientUuid", attachment.clientUuid);

  if (Platform.OS === "web") {
    const blob = await fetch(attachment.localUri).then((res) => res.blob());
    formData.append("file", blob, attachment.fileName);
  } else {
    // React Native's fetch/FormData accepts this {uri, name, type} shape for files.
    formData.append("file", { uri: attachment.localUri, name: attachment.fileName, type: attachment.mimeType } as unknown as Blob);
  }

  const res = await fetch(`${API_BASE_URL}/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Foto-Upload fehlgeschlagen (${res.status})`);
  const body = (await res.json()) as { attachment: { id: string } };
  return body.attachment;
}

/** Outbox-pattern sync: pushes local drafts, then their attachments (which need the draft's
 * server id), then dispatches any sends that were requested while offline. Safe to call
 * repeatedly (e.g. on every reconnect) — already-synced items are skipped. */
export async function runSync(apiClient: ApiClient, token: string | null): Promise<SyncSummary> {
  const summary: SyncSummary = { syncedDrafts: 0, syncedAttachments: 0, sent: 0, errors: [] };

  for (const draft of await listPendingDrafts()) {
    try {
      const server = await apiClient.drafts.syncUpsert.mutate({
        clientUuid: draft.clientUuid,
        templateId: draft.templateId,
        propertyId: draft.propertyId,
        unitId: draft.unitId,
        answers: draft.answers,
        title: draft.title,
      });
      await upsertLocalDraft({ ...draft, serverId: server.id, status: server.status, syncStatus: "synced", syncError: undefined });
      summary.syncedDrafts++;
    } catch (error) {
      const message = errorMessage(error);
      if (isPermanentError(error)) await upsertLocalDraft({ ...draft, syncStatus: "error", syncError: message });
      summary.errors.push(`Entwurf "${draft.title}": ${message}`);
    }
  }

  for (const attachment of await listPendingAttachments()) {
    const draft = await getLocalDraft(attachment.draftClientUuid);
    if (!draft?.serverId) continue;
    try {
      const uploaded = await uploadAttachment(draft.serverId, attachment, token);
      await upsertLocalAttachment({ ...attachment, serverId: uploaded.id, syncStatus: "synced", syncError: undefined });
      summary.syncedAttachments++;
    } catch (error) {
      const message = errorMessage(error);
      await upsertLocalAttachment({ ...attachment, syncStatus: "error", syncError: message });
      summary.errors.push(`Foto in "${draft.title}": ${message}`);
    }
  }

  for (const draft of await listDraftsPendingSend()) {
    if (!draft.serverId || !draft.pendingSendRecipients) continue;
    const attachments = await listLocalAttachmentsForDraft(draft.clientUuid);
    if (attachments.some((a) => a.syncStatus !== "synced")) continue;
    try {
      const result = await apiClient.drafts.send.mutate({ id: draft.serverId, recipients: draft.pendingSendRecipients });
      if (result.status === "SENT") {
        await upsertLocalDraft({ ...draft, status: "SENT", pendingSendRecipients: undefined, syncStatus: "synced", syncError: undefined });
        summary.sent++;
      } else {
        summary.errors.push(`Versand "${draft.title}": ${result.error ?? "unbekannter Fehler"}`);
      }
    } catch (error) {
      summary.errors.push(`Versand "${draft.title}": ${errorMessage(error)}`);
    }
  }

  return summary;
}
