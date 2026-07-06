import { z } from "zod";

export const aufgabeStatusValues = ["OFFEN", "IN_BEARBEITUNG", "ERLEDIGT"] as const;
export const aufgabePrioritaetValues = ["NIEDRIG", "MITTEL", "HOCH", "DRINGEND"] as const;

export const AUFGABE_STATUS_LABELS: Record<(typeof aufgabeStatusValues)[number], string> = {
  OFFEN: "Offen",
  IN_BEARBEITUNG: "In Bearbeitung",
  ERLEDIGT: "Erledigt",
};

export const AUFGABE_PRIORITAET_LABELS: Record<(typeof aufgabePrioritaetValues)[number], string> = {
  NIEDRIG: "Niedrig",
  MITTEL: "Mittel",
  HOCH: "Hoch",
  DRINGEND: "Dringend",
};

export const aufgabeCreateSchema = z.object({
  titel: z.string().min(1, "Titel ist erforderlich"),
  beschreibung: z.string().optional().or(z.literal("")),
  prioritaet: z.enum(aufgabePrioritaetValues),
  faelligkeitsdatum: z.string().optional().or(z.literal("")),
  objektId: z.string().optional().or(z.literal("")),
  dokumentId: z.string().optional().or(z.literal("")),
});

export type AufgabeCreateInput = z.infer<typeof aufgabeCreateSchema>;

export const aufgabeStatusUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(aufgabeStatusValues),
});
