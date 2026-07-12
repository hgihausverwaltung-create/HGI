import { z } from "zod";

export const ERLAUBTE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export function maxUploadSizeBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? "25");
  return mb * 1024 * 1024;
}

export const dokumentUploadSchema = z.object({
  kategorieId: z.string().min(1, "Kategorie ist erforderlich"),
  objektId: z.string().min(1, "Objekt ist erforderlich"),
  einheitId: z.string().optional().or(z.literal("")),
  eigentuemerId: z.string().optional().or(z.literal("")),
  mieterId: z.string().optional().or(z.literal("")),
  beschreibung: z.string().optional().or(z.literal("")),
});

export type DokumentUploadInput = z.infer<typeof dokumentUploadSchema>;
