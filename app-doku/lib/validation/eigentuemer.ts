import { z } from "zod";

export const eigentuemerSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  email: z.string().email("Ungueltige E-Mail-Adresse").optional().or(z.literal("")),
  telefon: z.string().optional().or(z.literal("")),
});

export type EigentuemerInput = z.infer<typeof eigentuemerSchema>;
