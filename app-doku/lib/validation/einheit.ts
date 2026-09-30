import { z } from "zod";

export const einheitTypen = ["WOHNUNG", "GEWERBE", "STELLPLATZ", "SONSTIGES"] as const;

export const einheitSchema = z.object({
  objektId: z.string().min(1),
  bezeichnung: z.string().min(1, "Bezeichnung ist erforderlich"),
  typ: z.enum(einheitTypen).optional(),
});

export type EinheitInput = z.infer<typeof einheitSchema>;
