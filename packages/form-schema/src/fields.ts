import { z } from "zod";

/**
 * Every field type a template can use. This list is the single source of truth for what
 * the form-renderer (web + mobile) and the PDF package must know how to display.
 */
export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "time",
  "datetime",
  "boolean",
  "singleSelect",
  "multiSelect",
  "checkboxGroup",
  "reference",
  "photo",
  "signature",
  "meterReading",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const REFERENCE_KINDS = ["property", "unit", "contact"] as const;
export type ReferenceKind = (typeof REFERENCE_KINDS)[number];

export const QUICK_ACTIONS = ["captureCurrentTime"] as const;
export type QuickAction = (typeof QUICK_ACTIONS)[number];

export const fieldOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});
export type FieldOption = z.infer<typeof fieldOptionSchema>;

/**
 * A condition that makes a field or section visible only when another field's answer
 * matches. Kept intentionally small (one field, one op) — composite AND/OR conditions
 * are not a requirement any captured smaps screen exhibited, so we don't build for them
 * speculatively.
 */
export const visibleWhenSchema = z.object({
  fieldId: z.string().min(1),
  op: z.enum(["equals", "includes", "notEmpty"]),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});
export type VisibleWhen = z.infer<typeof visibleWhenSchema>;

const fieldBase = {
  id: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean().default(false),
  help: z.string().optional(),
  visibleWhen: visibleWhenSchema.optional(),
};

export const fieldSchema = z.discriminatedUnion("type", [
  z.object({ ...fieldBase, type: z.literal("text") }),
  z.object({ ...fieldBase, type: z.literal("textarea") }),
  z.object({ ...fieldBase, type: z.literal("number"), min: z.number().optional(), max: z.number().optional() }),
  z.object({ ...fieldBase, type: z.literal("date"), quickActions: z.array(z.enum(QUICK_ACTIONS)).optional() }),
  z.object({ ...fieldBase, type: z.literal("time"), quickActions: z.array(z.enum(QUICK_ACTIONS)).optional() }),
  z.object({ ...fieldBase, type: z.literal("datetime"), quickActions: z.array(z.enum(QUICK_ACTIONS)).optional() }),
  z.object({ ...fieldBase, type: z.literal("boolean") }),
  z.object({ ...fieldBase, type: z.literal("singleSelect"), options: z.array(fieldOptionSchema).min(1) }),
  z.object({ ...fieldBase, type: z.literal("multiSelect"), options: z.array(fieldOptionSchema).min(1) }),
  z.object({ ...fieldBase, type: z.literal("checkboxGroup"), options: z.array(fieldOptionSchema).min(1) }),
  z.object({ ...fieldBase, type: z.literal("reference"), referenceKind: z.enum(REFERENCE_KINDS) }),
  z.object({ ...fieldBase, type: z.literal("photo"), maxCount: z.number().int().positive().default(10) }),
  z.object({ ...fieldBase, type: z.literal("signature") }),
  z.object({ ...fieldBase, type: z.literal("meterReading"), unit: z.string().optional() }),
]);
export type Field = z.infer<typeof fieldSchema>;
