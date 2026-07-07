import type { AnswerValue, DraftAnswers } from "./answers";

/** Pure helpers for updating a DraftAnswers value from a form UI — shared between the web
 * and native form-renderer packages, neither of which should duplicate this logic. */

export function setTopLevelValue(answers: DraftAnswers, fieldId: string, value: AnswerValue): DraftAnswers {
  return { ...answers, values: { ...answers.values, [fieldId]: value } };
}

export function setItemValue(answers: DraftAnswers, groupId: string, optionValue: string, fieldId: string, value: AnswerValue): DraftAnswers {
  const group = answers.repeatables[groupId] ?? {};
  const item = group[optionValue] ?? {};
  return {
    ...answers,
    repeatables: {
      ...answers.repeatables,
      [groupId]: { ...group, [optionValue]: { ...item, [fieldId]: value } },
    },
  };
}

export function selectedOptionValues(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
