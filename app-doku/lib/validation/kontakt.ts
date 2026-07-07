import { z } from "zod";

export const kontaktTypValues = ["HANDWERKER", "DIENSTLEISTER", "BEIRAT"] as const;

export const KONTAKT_TYP_LABELS: Record<(typeof kontaktTypValues)[number], string> = {
  HANDWERKER: "Handwerker",
  DIENSTLEISTER: "Dienstleister",
  BEIRAT: "Beirat",
};

export const kontaktCreateSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  typ: z.enum(kontaktTypValues),
  email: z.string().email("Ungueltige E-Mail-Adresse").optional().or(z.literal("")),
  telefon: z.string().optional().or(z.literal("")),
  objektId: z.string().optional().or(z.literal("")),
});

export type KontaktCreateInput = z.infer<typeof kontaktCreateSchema>;
