import { z } from "zod";

export const wirtschaftsplanStatusValues = ["ENTWURF", "BESCHLOSSEN"] as const;

export const WIRTSCHAFTSPLAN_STATUS_LABELS: Record<
  (typeof wirtschaftsplanStatusValues)[number],
  string
> = {
  ENTWURF: "Entwurf",
  BESCHLOSSEN: "Beschlossen",
};

export const wirtschaftsplanCreateSchema = z.object({
  objektId: z.string().min(1, "Objekt ist erforderlich"),
  wirtschaftsjahr: z.coerce
    .number()
    .int()
    .min(2000, "Jahr ist ungueltig")
    .max(2100, "Jahr ist ungueltig"),
  versammlungId: z.string().optional().or(z.literal("")),
});

export type WirtschaftsplanCreateInput = z.infer<typeof wirtschaftsplanCreateSchema>;

export const wirtschaftsplanStatusUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(wirtschaftsplanStatusValues),
});

export const wirtschaftsplanVersammlungUpdateSchema = z.object({
  id: z.string().min(1),
  versammlungId: z.string().optional().or(z.literal("")),
});
