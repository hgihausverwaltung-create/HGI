export const EMAIL_TEMPLATE_PLACEHOLDERS = [
  "draftTitle",
  "templateName",
  "propertyLabel",
  "unitLabel",
  "recipients",
  "sentDate",
] as const;

export type EmailTemplatePlaceholder = (typeof EMAIL_TEMPLATE_PLACEHOLDERS)[number];

export type EmailTemplateContext = Record<EmailTemplatePlaceholder, string>;

/** Substitutes `{{placeholder}}` tokens; unknown placeholders are left untouched. */
export function renderEmailTemplate(template: string, context: EmailTemplateContext): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(context, key) ? context[key as EmailTemplatePlaceholder] : match;
  });
}
