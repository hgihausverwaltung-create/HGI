import { z } from "zod";
import { sectionSchema } from "./sections";
import { repeatableGroupSchema } from "./sections";
import type { Field } from "./fields";

export const templateSchemaSchema = z
  .object({
    sections: z.array(sectionSchema).min(1),
    repeatableGroups: z.array(repeatableGroupSchema).default([]),
  })
  .superRefine((template, ctx) => {
    const allFieldIds = new Set<string>();
    for (const section of template.sections) {
      for (const field of section.fields) {
        if (allFieldIds.has(field.id)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Doppelte Feld-ID: ${field.id}` });
        }
        allFieldIds.add(field.id);
      }
    }

    for (const group of template.repeatableGroups) {
      const sourceField = findFieldById(template.sections, group.sourceFieldId);
      if (!sourceField) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `RepeatableGroup "${group.id}" verweist auf unbekanntes Feld "${group.sourceFieldId}"`,
        });
        continue;
      }
      if (sourceField.type !== "multiSelect" && sourceField.type !== "checkboxGroup") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `RepeatableGroup "${group.id}" muss auf ein multiSelect/checkboxGroup-Feld verweisen, "${group.sourceFieldId}" ist vom Typ ${sourceField.type}`,
        });
      }
    }
  });

export type TemplateSchema = z.infer<typeof templateSchemaSchema>;

function findFieldById(sections: { fields: Field[] }[], fieldId: string): Field | undefined {
  for (const section of sections) {
    const match = section.fields.find((f) => f.id === fieldId);
    if (match) return match;
  }
  return undefined;
}

export function parseTemplateSchema(value: unknown): TemplateSchema {
  return templateSchemaSchema.parse(value);
}
