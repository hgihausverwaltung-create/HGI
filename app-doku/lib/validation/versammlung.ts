import { z } from "zod";

export const versammlungStatusValues = ["GEPLANT", "DURCHGEFUEHRT"] as const;

export const VERSAMMLUNG_STATUS_LABELS: Record<(typeof versammlungStatusValues)[number], string> = {
  GEPLANT: "Geplant",
  DURCHGEFUEHRT: "Durchgefuehrt",
};

export const versammlungCreateSchema = z.object({
  titel: z.string().min(1, "Titel ist erforderlich"),
  datum: z.string().min(1, "Datum ist erforderlich"),
  einladungsdatum: z.string().optional().or(z.literal("")),
  objektId: z.string().min(1, "Objekt ist erforderlich"),
  dokumentId: z.string().optional().or(z.literal("")),
});

export type VersammlungCreateInput = z.infer<typeof versammlungCreateSchema>;

export const versammlungStatusUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(versammlungStatusValues),
});

export const versammlungDokumentUpdateSchema = z.object({
  id: z.string().min(1),
  dokumentId: z.string().optional().or(z.literal("")),
});
