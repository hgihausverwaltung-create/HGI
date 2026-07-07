import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { evaluateVisibleWhen, selectedOptionValues, setItemValue, setTopLevelValue } from "@hgi/form-schema";
import type { AnswerValue, DraftAnswers, Field, Section, TemplateSchema } from "@hgi/form-schema";
import { FieldInput } from "./FieldInput";
import type { AttachmentInfo, PickedPhoto, ReferenceOptionsByKind } from "./types";

export interface FormRendererProps {
  schema: TemplateSchema;
  answers: DraftAnswers;
  onChange: (next: DraftAnswers) => void;
  attachments: AttachmentInfo[];
  onUploadPhoto: (fieldPath: string, photo: PickedPhoto, kind: "PHOTO" | "SIGNATURE") => void | Promise<void>;
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
    <View style={styles.card}>
      <Pressable style={styles.cardHeader} onPress={() => section.collapsible && setCollapsed((c) => !c)}>
        <Text style={styles.cardTitle}>{section.title}</Text>
        {section.collapsible && <Text>{collapsed ? "▸" : "▾"}</Text>}
      </Pressable>
      {!collapsed && (
        <View style={styles.cardBody}>
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
        </View>
      )}
    </View>
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
    <View>
      {schema.sections.map((section) => (
        <SectionView key={section.id} section={section} values={answers.values} onFieldChange={handleTopChange} fieldPathPrefix="" {...commonProps} />
      ))}

      {schema.repeatableGroups.map((group) => {
        const selected = selectedOptionValues(answers.values[group.sourceFieldId]);
        if (selected.length === 0) return null;
        const sourceField = findField(schema, group.sourceFieldId);
        return (
          <View key={group.id} style={styles.card}>
            <Text style={styles.cardTitle}>{group.title}</Text>
            {selected.map((optionValue) => {
              const optionLabel =
                sourceField && "options" in sourceField ? sourceField.options.find((o) => o.value === optionValue)?.label ?? optionValue : optionValue;
              const itemValues = (answers.repeatables[group.id]?.[optionValue] ?? {}) as Record<string, unknown>;
              return (
                <View key={optionValue} style={styles.groupItem}>
                  <Text style={styles.groupItemTitle}>{optionLabel}</Text>
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
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "white", borderRadius: 10, padding: 14, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardBody: { marginTop: 10 },
  groupItem: { marginBottom: 12, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: "#eee" },
  groupItemTitle: { fontSize: 15, fontWeight: "600", marginBottom: 6 },
});
