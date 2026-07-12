import { z } from "zod";

export const objektSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  strasse: z.string().min(1, "Strasse ist erforderlich"),
  plz: z.string().min(1, "PLZ ist erforderlich"),
  ort: z.string().min(1, "Ort ist erforderlich"),
});

export type ObjektInput = z.infer<typeof objektSchema>;
