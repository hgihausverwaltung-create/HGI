import { z } from "zod";
import type { Field } from "./fields";
import type { Section, RepeatableGroup } from "./sections";
import type { TemplateSchema } from "./template";
import type { VisibleWhen } from "./fields";

export const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
  z.object({ meterNumber: z.string(), value: z.number(), unit: z.string().optional() }),
]);
export type AnswerValue = z.infer<typeof answerValueSchema>;

export const draftAnswersSchema = z.object({
  values: z.record(z.string(), answerValueSchema).default({}),
  /** repeatableGroupId -> selected option value -> fieldId -> value */
  repeatables: z.record(z.string(), z.record(z.string(), z.record(z.string(), answerValueSchema))).default({}),
});
export type DraftAnswers = z.infer<typeof draftAnswersSchema>;

export interface ValidationResult {
  success: boolean;
  errors: string[];
}

function evaluateVisibleWhen(condition: VisibleWhen | undefined, values: Record<string, AnswerValue>): boolean {
  if (!condition) return true;
  const actual = values[condition.fieldId];
  switch (condition.op) {
    case "equals":
      return actual === condition.value;
    case "includes":
      return Array.isArray(actual) && condition.value !== undefined && actual.includes(String(condition.value));
    case "notEmpty":
      return actual !== undefined && actual !== null && actual !== "" && !(Array.isArray(actual) && actual.length === 0);
    default:
      return true;
  }
}

function validateFieldValue(field: Field, value: AnswerValue | undefined, path: string, errors: string[]): void {
  const isEmpty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  if (field.required && isEmpty) {
    errors.push(`${path}: Pflichtfeld "${field.label}" fehlt`);
    return;
  }
  if (isEmpty) return;

  switch (field.type) {
    case "text":
    case "textarea":
    case "date":
    case "time":
    case "datetime":
    case "reference":
    case "signature":
      if (typeof value !== "string") errors.push(`${path}: "${field.label}" muss Text sein`);
      break;
    case "number":
      if (typeof value !== "number") errors.push(`${path}: "${field.label}" muss eine Zahl sein`);
      break;
    case "boolean":
      if (typeof value !== "boolean") errors.push(`${path}: "${field.label}" muss ein Wahrheitswert sein`);
      break;
    case "singleSelect": {
      if (typeof value !== "string" || !field.options.some((o) => o.value === value)) {
        errors.push(`${path}: "${field.label}" hat einen ungültigen Wert`);
      }
      break;
    }
    case "multiSelect":
    case "checkboxGroup": {
      if (!Array.isArray(value) || value.some((v) => !field.options.some((o) => o.value === v))) {
        errors.push(`${path}: "${field.label}" enthält einen ungültigen Wert`);
      }
      break;
    }
    case "photo":
      if (!Array.isArray(value)) errors.push(`${path}: "${field.label}" muss eine Foto-Liste sein`);
      break;
    case "meterReading":
      if (typeof value !== "object" || value === null || Array.isArray(value) || !("meterNumber" in value)) {
        errors.push(`${path}: "${field.label}" ist kein gültiger Zählerstand`);
      }
      break;
  }
}

function validateSections(sections: Section[], values: Record<string, AnswerValue>, pathPrefix: string, errors: string[]): void {
  for (const section of sections) {
    if (!evaluateVisibleWhen(section.visibleWhen, values)) continue;
    for (const field of section.fields) {
      if (!evaluateVisibleWhen(field.visibleWhen, values)) continue;
      validateFieldValue(field, values[field.id], `${pathPrefix}${section.title}`, errors);
    }
  }
}

function findFieldById(sections: Section[], fieldId: string): Field | undefined {
  for (const section of sections) {
    const match = section.fields.find((f) => f.id === fieldId);
    if (match) return match;
  }
  return undefined;
}

function selectedOptionValues(sourceField: Field, value: AnswerValue | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function validateRepeatableGroup(group: RepeatableGroup, template: TemplateSchema, answers: DraftAnswers, errors: string[]): void {
  const sourceField = findFieldById(template.sections, group.sourceFieldId);
  if (!sourceField) return; // already reported by parseTemplateSchema
  const selected = selectedOptionValues(sourceField, answers.values[group.sourceFieldId]);
  const groupAnswers = answers.repeatables[group.id] ?? {};

  for (const optionValue of selected) {
    const itemValues = groupAnswers[optionValue] ?? {};
    validateSections(group.itemSections, itemValues, `${group.title} → ${optionValue} → `, errors);
  }
}

export function validateAnswers(template: TemplateSchema, answersInput: unknown): ValidationResult {
  const parsed = draftAnswersSchema.safeParse(answersInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((i) => i.message) };
  }
  const answers = parsed.data;
  const errors: string[] = [];

  validateSections(template.sections, answers.values, "", errors);
  for (const group of template.repeatableGroups) {
    validateRepeatableGroup(group, template, answers, errors);
  }

  return { success: errors.length === 0, errors };
}
