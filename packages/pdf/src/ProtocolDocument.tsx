import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import { evaluateVisibleWhen } from "@hgi/form-schema";
import type { Field, Section, TemplateSchema, DraftAnswers } from "@hgi/form-schema";

export interface PdfAttachment {
  fieldPath: string;
  filePath: string | null;
}

export interface ProtocolDocumentProps {
  templateName: string;
  draftTitle: string;
  schema: TemplateSchema;
  answers: DraftAnswers;
  attachments: PdfAttachment[];
  propertyLabel?: string;
  unitLabel?: string;
  /** entity id -> display label, used to resolve "reference" field values (Objekt/Wohnung/...) */
  referenceLabels: Record<string, string>;
  generatedAt: Date;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 16, borderBottom: "2 solid #B3182C", paddingBottom: 8 },
  brand: { fontSize: 16, fontWeight: 700, color: "#B3182C" },
  title: { fontSize: 13, marginTop: 4 },
  meta: { fontSize: 9, color: "#555", marginTop: 2 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 4, backgroundColor: "#f4f5f7", padding: 4 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: "35%", color: "#444" },
  value: { width: "65%" },
  subHeading: { fontSize: 10, fontWeight: 700, marginTop: 6, marginBottom: 2 },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  photo: { width: 110, height: 110, objectFit: "cover", marginRight: 6, marginBottom: 6 },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 8, color: "#999", textAlign: "center" },
});

function formatValue(field: Field, value: unknown, referenceLabels: Record<string, string>): string {
  if (value === undefined || value === null || value === "") return "—";
  switch (field.type) {
    case "reference":
      return referenceLabels[String(value)] ?? String(value);
    case "boolean":
      return value ? "Ja" : "Nein";
    case "singleSelect":
      return field.options.find((o) => o.value === value)?.label ?? String(value);
    case "multiSelect":
    case "checkboxGroup":
      return Array.isArray(value)
        ? value.map((v) => field.options.find((o) => o.value === v)?.label ?? String(v)).join(", ") || "—"
        : String(value);
    case "meterReading": {
      const reading = value as { meterNumber?: string; value?: number; unit?: string };
      return `Zähler ${reading.meterNumber ?? "—"}: ${reading.value ?? "—"}${reading.unit ? ` ${reading.unit}` : ""}`;
    }
    case "datetime": {
      const d = new Date(String(value));
      return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("de-DE");
    }
    case "date": {
      const d = new Date(String(value));
      return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("de-DE");
    }
    default:
      return String(value);
  }
}

function FieldRow({
  field,
  value,
  photos,
  referenceLabels,
}: {
  field: Field;
  value: unknown;
  photos: PdfAttachment[];
  referenceLabels: Record<string, string>;
}) {
  if (field.type === "photo" || field.type === "signature") {
    const images = photos.filter((p) => p.filePath);
    return (
      <View style={styles.row} wrap={false}>
        <Text style={styles.label}>{field.label}</Text>
        <View style={styles.value}>
          {images.length === 0 ? (
            <Text>—</Text>
          ) : (
            <View style={styles.photoRow}>
              {images.map((img, i) => (
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                <Image key={i} src={img.filePath!} style={styles.photo} />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{field.label}</Text>
      <Text style={styles.value}>{formatValue(field, value, referenceLabels)}</Text>
    </View>
  );
}

function SectionBlock({
  section,
  values,
  fieldPathPrefix,
  attachments,
  referenceLabels,
}: {
  section: Section;
  values: Record<string, unknown>;
  fieldPathPrefix: string;
  attachments: PdfAttachment[];
  referenceLabels: Record<string, string>;
}) {
  if (!evaluateVisibleWhen(section.visibleWhen, values)) return null;
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.fields
        .filter((field) => evaluateVisibleWhen(field.visibleWhen, values))
        .map((field) => (
          <FieldRow
            key={field.id}
            field={field}
            value={values[field.id]}
            photos={attachments.filter((a) => a.fieldPath === `${fieldPathPrefix}${field.id}`)}
            referenceLabels={referenceLabels}
          />
        ))}
    </View>
  );
}

export function ProtocolDocument({
  templateName,
  draftTitle,
  schema,
  answers,
  attachments,
  propertyLabel,
  unitLabel,
  referenceLabels,
  generatedAt,
}: ProtocolDocumentProps) {
  return (
    <Document title={draftTitle}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>HGI Immobilien</Text>
          <Text style={styles.title}>
            {templateName} — {draftTitle}
          </Text>
          {(propertyLabel || unitLabel) && (
            <Text style={styles.meta}>
              {propertyLabel}
              {propertyLabel && unitLabel ? " · " : ""}
              {unitLabel}
            </Text>
          )}
        </View>

        {schema.sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            values={answers.values}
            fieldPathPrefix=""
            attachments={attachments}
            referenceLabels={referenceLabels}
          />
        ))}

        {schema.repeatableGroups.map((group) => {
          const selected = answers.values[group.sourceFieldId];
          const selectedValues = Array.isArray(selected) ? selected.filter((v): v is string => typeof v === "string") : [];
          const sourceField = schema.sections.flatMap((s) => s.fields).find((f) => f.id === group.sourceFieldId);
          if (selectedValues.length === 0) return null;
          return (
            <View key={group.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{group.title}</Text>
              {selectedValues.map((optionValue) => {
                const optionLabel =
                  sourceField && "options" in sourceField ? sourceField.options.find((o) => o.value === optionValue)?.label ?? optionValue : optionValue;
                const itemValues = (answers.repeatables[group.id]?.[optionValue] ?? {}) as Record<string, unknown>;
                const prefix = `${group.id}.${optionValue}.`;
                return (
                  <View key={optionValue} wrap={false}>
                    <Text style={styles.subHeading}>{optionLabel}</Text>
                    {group.itemSections.map((itemSection) => (
                      <SectionBlock
                        key={itemSection.id}
                        section={itemSection}
                        values={itemValues}
                        fieldPathPrefix={prefix}
                        attachments={attachments}
                        referenceLabels={referenceLabels}
                      />
                    ))}
                  </View>
                );
              })}
            </View>
          );
        })}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `HGI Immobilien GmbH · erzeugt am ${generatedAt.toLocaleString("de-DE")} · Seite ${pageNumber}/${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
