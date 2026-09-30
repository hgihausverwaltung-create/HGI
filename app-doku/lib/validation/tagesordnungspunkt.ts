import { z } from "zod";

export const tagesordnungsErgebnisValues = ["ANGENOMMEN", "ABGELEHNT", "VERTAGT"] as const;

export const TAGESORDNUNGS_ERGEBNIS_LABELS: Record<
  (typeof tagesordnungsErgebnisValues)[number],
  string
> = {
  ANGENOMMEN: "Angenommen",
  ABGELEHNT: "Abgelehnt",
  VERTAGT: "Vertagt",
};

export const tagesordnungspunktCreateSchema = z.object({
  versammlungId: z.string().min(1),
  titel: z.string().min(1, "Titel ist erforderlich"),
  beschreibung: z.string().optional().or(z.literal("")),
  beschlussvorschlag: z.string().optional().or(z.literal("")),
});

export type TagesordnungspunktCreateInput = z.infer<typeof tagesordnungspunktCreateSchema>;

export const tagesordnungspunktErgebnisUpdateSchema = z.object({
  id: z.string().min(1),
  versammlungId: z.string().min(1),
  ergebnis: z.enum(tagesordnungsErgebnisValues),
});
