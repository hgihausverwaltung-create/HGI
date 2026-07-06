import React, { useState } from "react";
import { evaluateVisibleWhen } from "@hgi/form-schema";
import type { AnswerValue, DraftAnswers, Field, Section, TemplateSchema } from "@hgi/form-schema";
import { FieldInput } from "./FieldInput";
import { selectedOptionValues, setItemValue, setTopLevelValue } from "./answersHelpers";
import type { AttachmentInfo, ReferenceOptionsByKind } from "./types";

export interface FormRendererProps {
  schema: TemplateSchema;
  answers: DraftAnswers;
  onChange: (next: DraftAnswers) => void;
  attachments: AttachmentInfo[];
  onUploadPhoto: (fieldPath: string, file: File, kind: "PHOTO" | "SIGNATURE") => void | Promise<void>;
  onDeleteAttachment: (attachmentId: string) => void | Promise<void>;
  referenceOptions: ReferenceOptionsByKind;
  readOnly?: boolean;
}

function findField(schema: TemplateSchema, fieldId: string): Field | undefined {
  for (const section of schema.sections) {
    const match = section.fields.find((f) => f.id === fieldId);
    if (match) return match;
  }
  return undefined;
}

interface SectionViewProps {
  section: Section;
  values: Record<string, unknown>;
  onFieldChange: (fieldId: string, value: AnswerValue) => void;
  fieldPathPrefix: string;
  attachments: AttachmentInfo[];
  onUploadPhoto: FormRendererProps["onUploadPhoto"];
  onDeleteAttachment: FormRendererProps["onDeleteAttachment"];
  referenceOptions: ReferenceOptionsByKind;
  readOnly?: boolean;
}

function SectionView({ section, values, onFieldChange, fieldPathPrefix, ...rest }: SectionViewProps) {
  const [collapsed, setCollapsed] = useState(section.collapsible ? section.defaultCollapsed : false);
  if (!evaluateVisibleWhen(section.visibleWhen, values)) return null;

  return (
    <div className="card">
      <div
        onClick={() => section.collapsible && setCollapsed((c) => !c)}
        style={{ cursor: section.collapsible ? "pointer" : "default", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <h3 style={{ margin: 0 }}>{section.title}</h3>
        {section.collapsible && <span>{collapsed ? "▸" : "▾"}</span>}
      </div>
      {!collapsed && (
        <div style={{ marginTop: "0.75rem" }}>
          {section.fields
            .filter((field) => evaluateVisibleWhen(field.visibleWhen, values))
            .map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={values[field.id] as AnswerValue | undefined}
                onChange={(value) => onFieldChange(field.id, value)}
                fieldPath={`${fieldPathPrefix}${field.id}`}
                {...rest}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function FormRenderer({ schema, answers, onChange, referenceOptions, attachments, onUploadPhoto, onDeleteAttachment, readOnly }: FormRendererProps) {
  function handleTopChange(fieldId: string, value: AnswerValue) {
    onChange(setTopLevelValue(answers, fieldId, value));
  }
  function handleItemChange(groupId: string, optionValue: string, fieldId: string, value: AnswerValue) {
    onChange(setItemValue(answers, groupId, optionValue, fieldId, value));
  }

  const commonProps = { attachments, onUploadPhoto, onDeleteAttachment, referenceOptions, readOnly };

  return (
    <div>
      {schema.sections.map((section) => (
        <SectionView key={section.id} section={section} values={answers.values} onFieldChange={handleTopChange} fieldPathPrefix="" {...commonProps} />
      ))}

      {schema.repeatableGroups.map((group) => {
        const selected = selectedOptionValues(answers.values[group.sourceFieldId]);
        if (selected.length === 0) return null;
        const sourceField = findField(schema, group.sourceFieldId);
        return (
          <div key={group.id} className="card">
            <h3 style={{ marginTop: 0 }}>{group.title}</h3>
            {selected.map((optionValue) => {
              const optionLabel =
                sourceField && "options" in sourceField ? sourceField.options.find((o) => o.value === optionValue)?.label ?? optionValue : optionValue;
              const itemValues = (answers.repeatables[group.id]?.[optionValue] ?? {}) as Record<string, unknown>;
              return (
                <div key={optionValue} style={{ marginBottom: "1rem", paddingLeft: "0.75rem", borderLeft: "3px solid #eee" }}>
                  <h4 style={{ margin: "0 0 0.5rem" }}>{optionLabel}</h4>
                  {group.itemSections.map((section) => (
                    <SectionView
                      key={section.id}
                      section={section}
                      values={itemValues}
                      onFieldChange={(fieldId, value) => handleItemChange(group.id, optionValue, fieldId, value)}
                      fieldPathPrefix={`${group.id}.${optionValue}.`}
                      {...commonProps}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
