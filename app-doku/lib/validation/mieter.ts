import { z } from "zod";
import { anredeTypValues } from "@/lib/validation/anrede";

export const mieterSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  anrede: z.enum(anredeTypValues).optional(),
  email: z.string().email("Ungueltige E-Mail-Adresse").optional().or(z.literal("")),
  telefon: z.string().optional().or(z.literal("")),
  einheitId: z.string().min(1, "Einheit ist erforderlich"),
});

export type MieterInput = z.infer<typeof mieterSchema>;
