import type { DraftAnswers, TemplateSchema } from "@hgi/form-schema";
import { readStoreFile, writeStoreFile } from "./offlineStorage";

export type SyncStatus = "synced" | "pending" | "error";
export type DraftStatus = "DRAFT" | "PENDING_SEND" | "SENT" | "FAILED";

export interface CachedTemplate {
  id: string;
  name: string;
  description: string | null;
  currentVersion: { versionNumber: number; status: string } | null;
}

export interface CachedTemplateDetail {
  id: string;
  name: string;
  currentVersionId: string;
  versionNumber: number;
  schema: TemplateSchema;
}

export interface CachedUnit {
  id: string;
  label: string;
}

export interface CachedProperty {
  id: string;
  name: string;
  street: string;
  houseNumber: string;
  units: CachedUnit[];
}

export interface LocalDraft {
  clientUuid: string;
  serverId: string | null;
  templateId: string;
  templateName: string;
  title: string;
  propertyId?: string;
  unitId?: string;
  answers: DraftAnswers;
  status: DraftStatus;
  syncStatus: SyncStatus;
  syncError?: string;
  /** Recipients for a "Senden" tapped while offline; the sync engine dispatches the send once
   * the draft and all its attachments have synced, then clears this field. */
  pendingSendRecipients?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalAttachment {
  clientUuid: string;
  draftClientUuid: string;
  fieldPath: string;
  kind: "PHOTO" | "SIGNATURE";
  /** Displayable URI: a local file:// URI while pending, the authenticated server URL once synced. */
  localUri: string;
  mimeType: string;
  fileName: string;
  serverId: string | null;
  syncStatus: SyncStatus;
  syncError?: string;
}

interface OfflineStoreShape {
  templates: CachedTemplate[];
  templateDetails: Record<string, CachedTemplateDetail>;
  properties: CachedProperty[];
  drafts: Record<string, LocalDraft>;
  attachments: Record<string, LocalAttachment>;
}

function emptyStore(): OfflineStoreShape {
  return { templates: [], templateDetails: {}, properties: [], drafts: {}, attachments: {} };
}

let cache: OfflineStoreShape | null = null;
let loadPromise: Promise<OfflineStoreShape> | null = null;

async function load(): Promise<OfflineStoreShape> {
  if (cache) return cache;
  if (!loadPromise) {
    loadPromise = readStoreFile().then((raw) => {
      cache = raw ? { ...emptyStore(), ...(JSON.parse(raw) as Partial<OfflineStoreShape>) } : emptyStore();
      return cache;
    });
  }
  return loadPromise;
}

async function mutate(fn: (store: OfflineStoreShape) => void): Promise<void> {
  const store = await load();
  fn(store);
  await writeStoreFile(JSON.stringify(store));
}

export async function cacheTemplates(templates: CachedTemplate[]): Promise<void> {
  await mutate((store) => {
    store.templates = templates;
  });
}

export async function getCachedTemplates(): Promise<CachedTemplate[]> {
  return (await load()).templates;
}

export async function cacheTemplateDetail(detail: CachedTemplateDetail): Promise<void> {
  await mutate((store) => {
    store.templateDetails[detail.id] = detail;
  });
}

export async function getCachedTemplateDetail(templateId: string): Promise<CachedTemplateDetail | null> {
  return (await load()).templateDetails[templateId] ?? null;
}

export async function cacheProperties(properties: CachedProperty[]): Promise<void> {
  await mutate((store) => {
    store.properties = properties;
  });
}

export async function getCachedProperties(): Promise<CachedProperty[]> {
  return (await load()).properties;
}

export async function upsertLocalDraft(draft: LocalDraft): Promise<void> {
  await mutate((store) => {
    store.drafts[draft.clientUuid] = draft;
  });
}

export async function getLocalDraft(clientUuid: string): Promise<LocalDraft | null> {
  return (await load()).drafts[clientUuid] ?? null;
}

export async function listLocalDraftsForTemplate(templateId: string): Promise<LocalDraft[]> {
  return Object.values((await load()).drafts).filter((d) => d.templateId === templateId);
}

export async function listPendingDrafts(): Promise<LocalDraft[]> {
  return Object.values((await load()).drafts).filter((d) => d.syncStatus !== "synced");
}

export async function listDraftsPendingSend(): Promise<LocalDraft[]> {
  return Object.values((await load()).drafts).filter((d) => !!d.pendingSendRecipients && d.status !== "SENT");
}

export async function upsertLocalAttachment(attachment: LocalAttachment): Promise<void> {
  await mutate((store) => {
    store.attachments[attachment.clientUuid] = attachment;
  });
}

export async function removeLocalAttachment(clientUuid: string): Promise<void> {
  await mutate((store) => {
    delete store.attachments[clientUuid];
  });
}

export async function listLocalAttachmentsForDraft(draftClientUuid: string): Promise<LocalAttachment[]> {
  return Object.values((await load()).attachments).filter((a) => a.draftClientUuid === draftClientUuid);
}

export async function listPendingAttachments(): Promise<LocalAttachment[]> {
  return Object.values((await load()).attachments).filter((a) => a.syncStatus !== "synced");
}
