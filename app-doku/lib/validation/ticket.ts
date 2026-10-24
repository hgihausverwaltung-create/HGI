import { z } from "zod";

export const ticketStatusValues = ["OFFEN", "IN_BEARBEITUNG", "ERLEDIGT", "STORNIERT"] as const;

export const TICKET_STATUS_LABELS: Record<(typeof ticketStatusValues)[number], string> = {
  OFFEN: "Offen",
  IN_BEARBEITUNG: "In Bearbeitung",
  ERLEDIGT: "Erledigt",
  STORNIERT: "Storniert",
};

export const ticketPrioritaetValues = ["NIEDRIG", "NORMAL", "HOCH"] as const;

export const TICKET_PRIORITAET_LABELS: Record<(typeof ticketPrioritaetValues)[number], string> = {
  NIEDRIG: "Niedrig",
  NORMAL: "Normal",
  HOCH: "Hoch",
};

export const ticketKategorieValues = [
  "SCHADENSMELDUNG",
  "ANFRAGE",
  "BESCHWERDE",
  "SONSTIGES",
] as const;

export const TICKET_KATEGORIE_LABELS: Record<(typeof ticketKategorieValues)[number], string> = {
  SCHADENSMELDUNG: "Schadensmeldung",
  ANFRAGE: "Anfrage",
  BESCHWERDE: "Beschwerde",
  SONSTIGES: "Sonstiges",
};

export const ticketCreateSchema = z.object({
  titel: z.string().min(1, "Titel ist erforderlich"),
  beschreibung: z.string().optional().or(z.literal("")),
  kategorie: z.enum(ticketKategorieValues),
  prioritaet: z.enum(ticketPrioritaetValues),
  objektId: z.string().min(1, "Objekt ist erforderlich"),
  einheitId: z.string().optional().or(z.literal("")),
  mieterId: z.string().optional().or(z.literal("")),
  eigentuemerId: z.string().optional().or(z.literal("")),
  zugewiesenAnId: z.string().optional().or(z.literal("")),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

export const ticketStatusUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(ticketStatusValues),
});

export const ticketZuweisungUpdateSchema = z.object({
  id: z.string().min(1),
  zugewiesenAnId: z.string().optional().or(z.literal("")),
});
