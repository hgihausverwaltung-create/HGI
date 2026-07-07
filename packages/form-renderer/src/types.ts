import type { ReferenceKind } from "@hgi/form-schema";

export interface ReferenceOption {
  value: string;
  label: string;
}

export type ReferenceOptionsByKind = Partial<Record<ReferenceKind, ReferenceOption[]>>;

export interface AttachmentInfo {
  id: string;
  fieldPath: string;
  kind: "PHOTO" | "SIGNATURE";
  url: string;
}
