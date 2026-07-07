import { z } from "zod";
import { anredeTypValues } from "@/lib/validation/anrede";

export const eigentuemerSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  anrede: z.enum(anredeTypValues).optional(),
  email: z.string().email("Ungueltige E-Mail-Adresse").optional().or(z.literal("")),
  telefon: z.string().optional().or(z.literal("")),
  iban: z.string().optional().or(z.literal("")),
  bankname: z.string().optional().or(z.literal("")),
});

export type EigentuemerInput = z.infer<typeof eigentuemerSchema>;
