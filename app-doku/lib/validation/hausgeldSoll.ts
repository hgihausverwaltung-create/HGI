import { z } from "zod";

export const hausgeldSollCreateSchema = z.object({
  wirtschaftsplanId: z.string().min(1),
  einheitId: z.string().min(1, "Einheit ist erforderlich"),
  betragMonatlich: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Betrag muss eine positive Zahl mit maximal 2 Nachkommastellen sein"),
});

export type HausgeldSollCreateInput = z.infer<typeof hausgeldSollCreateSchema>;
