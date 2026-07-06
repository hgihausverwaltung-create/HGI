import { z } from "zod";
import { fieldSchema, visibleWhenSchema } from "./fields";

export const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  collapsible: z.boolean().default(false),
  defaultCollapsed: z.boolean().default(false),
  visibleWhen: visibleWhenSchema.optional(),
  fields: z.array(fieldSchema).min(1),
});
export type Section = z.infer<typeof sectionSchema>;

/**
 * Reproduces the smaps "Bestehend aus" mechanism: selecting options in a multiSelect /
 * checkboxGroup field (`sourceFieldId`) spawns one instance of `itemSections` per selected
 * option — e.g. one room sub-form (condition, meter readings, photos) per checked room.
 */
export const repeatableGroupSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sourceFieldId: z.string().min(1),
  itemSections: z.array(sectionSchema).min(1),
});
export type RepeatableGroup = z.infer<typeof repeatableGroupSchema>;
