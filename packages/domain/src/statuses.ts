export const TEMPLATE_VERSION_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type TemplateVersionStatus = (typeof TEMPLATE_VERSION_STATUSES)[number];

export const DRAFT_STATUSES = ["DRAFT", "PENDING_SEND", "SENT", "FAILED"] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export const ATTACHMENT_UPLOAD_STATUSES = ["PENDING", "UPLOADED"] as const;
export type AttachmentUploadStatus = (typeof ATTACHMENT_UPLOAD_STATUSES)[number];

export const ATTACHMENT_KINDS = ["PHOTO", "SIGNATURE"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export const SEND_LOG_STATUSES = ["QUEUED", "SENT", "FAILED"] as const;
export type SendLogStatus = (typeof SEND_LOG_STATUSES)[number];

export const PROPERTY_KINDS = ["WEG", "MIETE", "GEWERBE"] as const;
export type PropertyKind = (typeof PROPERTY_KINDS)[number];
