import React from "react";
import { Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { AnswerValue, Field } from "@hgi/form-schema";
import { SelectModal } from "./SelectModal";
import type { AttachmentInfo, PickedPhoto, ReferenceOptionsByKind } from "./types";

export interface FieldInputProps {
  field: Field;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  fieldPath: string;
  attachments: AttachmentInfo[];
  onUploadPhoto: (fieldPath: string, photo: PickedPhoto, kind: "PHOTO" | "SIGNATURE") => void | Promise<void>;
  onDeleteAttachment: (attachmentId: string) => void | Promise<void>;
  referenceOptions: ReferenceOptionsByKind;
  readOnly?: boolean;
}

function fieldLabel(field: Field): string {
  return field.required ? `${field.label} *` : field.label;
}

async function pickPhoto(source: "camera" | "library"): Promise<PickedPhoto | null> {
  const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ["images"] });

  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? `foto-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}

export function FieldInput({ field, value, onChange, fieldPath, attachments, onUploadPhoto, onDeleteAttachment, referenceOptions, readOnly }: FieldInputProps) {
  function quickCaptureNow() {
    const now = new Date();
    if (field.type === "date") onChange(now.toISOString().slice(0, 10));
    else if (field.type === "time") onChange(now.toTimeString().slice(0, 5));
    else if (field.type === "datetime") onChange(now.toISOString().slice(0, 16).replace("T", " "));
  }

  switch (field.type) {
    case "text":
      return (
        <View style={styles.row}>
          <Text style={styles.label}>{fieldLabel(field)}</Text>
          <TextInput style={styles.input} value={typeof value === "string" ? value : ""} onChangeText={onChange} editable={!readOnly} />
        </View>
      );
    case "textarea":
      return (
        <View style={styles.row}>
          <Text style={styles.label}>{fieldLabel(field)}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={typeof value === "string" ? value : ""}
            onChangeText={onChange}
            editable={!readOnly}
            multiline
          />
        </View>
      );
    case "number":
      return (
        <View style={styles.row}>
          <Text style={styles.label}>{fieldLabel(field)}</Text>
          <TextInput
            style={styles.input}
            value={typeof value === "number" ? String(value) : ""}
            onChangeText={(text) => onChange(text === "" ? "" : Number(text))}
            editable={!readOnly}
            keyboardType="numeric"
          />
        </View>
      );
    case "date":
    case "time":
    case "datetime":
      return (
        <View style={styles.row}>
          <Text style={styles.label}>{fieldLabel(field)}</Text>
          <View style={styles.inline}>
            <TextInput
              style={[styles.input, styles.flex1]}
              value={typeof value === "string" ? value : ""}
              onChangeText={onChange}
              editable={!readOnly}
              placeholder={field.type === "date" ? "JJJJ-MM-TT" : field.type === "time" ? "HH:MM" : "JJJJ-MM-TT HH:MM"}
            />
            {"quickActions" in field && field.quickActions?.includes("captureCurrentTime") && !readOnly && (
              <Pressable style={styles.secondaryButton} onPress={quickCaptureNow}>
                <Text style={styles.secondaryButtonText}>Jetzt</Text>
              </Pressable>
            )}
          </View>
        </View>
      );
    case "boolean":
      return (
        <View style={[styles.row, styles.inline]}>
          <Switch value={value === true} onValueChange={onChange} disabled={readOnly} />
          <Text style={styles.label}>{fieldLabel(field)}</Text>
        </View>
      );
    case "singleSelect":
      return (
        <View style={styles.row}>
          <Text style={styles.label}>{fieldLabel(field)}</Text>
          {field.options.map((option) => (
            <Pressable key={option.value} style={styles.optionRow} onPress={() => !readOnly && onChange(option.value)}>
              <View style={[styles.radioOuter, value === option.value && styles.radioOuterSelected]}>
                {value === option.value && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      );
    case "multiSelect":
    case "checkboxGroup": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <View style={styles.row}>
          <Text style={styles.label}>{fieldLabel(field)}</Text>
          {field.options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <Pressable
                key={option.value}
                style={styles.optionRow}
                onPress={() => {
                  if (readOnly) return;
                  onChange(checked ? selected.filter((v) => v !== option.value) : [...selected, option.value]);
                }}
              >
                <View style={[styles.checkboxOuter, checked && styles.checkboxOuterChecked]}>{checked && <Text style={styles.checkmark}>✓</Text>}</View>
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      );
    }
    case "reference":
      return (
        <View style={styles.row}>
          <Text style={styles.label}>{fieldLabel(field)}</Text>
          <SelectModal
            label={field.label}
            options={referenceOptions[field.referenceKind] ?? []}
            value={typeof value === "string" ? value : undefined}
            onSelect={onChange}
            disabled={readOnly}
          />
        </View>
      );
    case "photo":
    case "signature": {
      const kind = field.type === "signature" ? "SIGNATURE" : "PHOTO";
      const relevant = attachments.filter((a) => a.fieldPath === fieldPath);
      return (
        <View style={styles.row}>
          <Text style={styles.label}>{fieldLabel(field)}</Text>
          <View style={styles.photoRow}>
            {relevant.map((a) => (
              <View key={a.id} style={styles.photoWrapper}>
                <Image source={{ uri: a.url }} style={styles.photo} />
                {!readOnly && (
                  <Pressable style={styles.photoRemove} onPress={() => onDeleteAttachment(a.id)}>
                    <Text style={styles.photoRemoveText}>×</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
          {!readOnly && (
            <View style={styles.inline}>
              <Pressable
                style={styles.secondaryButton}
                onPress={async () => {
                  const photo = await pickPhoto("camera");
                  if (photo) await onUploadPhoto(fieldPath, photo, kind);
                }}
              >
                <Text style={styles.secondaryButtonText}>📷 Kamera</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={async () => {
                  const photo = await pickPhoto("library");
                  if (photo) await onUploadPhoto(fieldPath, photo, kind);
                }}
              >
                <Text style={styles.secondaryButtonText}>Galerie</Text>
              </Pressable>
            </View>
          )}
        </View>
      );
    }
    case "meterReading": {
      const reading = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as {
        meterNumber?: string;
        value?: number;
        unit?: string;
      };
      return (
        <View style={styles.row}>
          <Text style={styles.label}>{fieldLabel(field)}</Text>
          <View style={styles.inline}>
            <TextInput
              style={[styles.input, styles.flex1]}
              placeholder="Zählernummer"
              value={reading.meterNumber ?? ""}
              editable={!readOnly}
              onChangeText={(text) => onChange({ ...reading, meterNumber: text } as AnswerValue)}
            />
            <TextInput
              style={[styles.input, styles.meterValue]}
              placeholder="Stand"
              keyboardType="numeric"
              value={reading.value !== undefined ? String(reading.value) : ""}
              editable={!readOnly}
              onChangeText={(text) => onChange({ ...reading, value: Number(text) } as AnswerValue)}
            />
            <TextInput
              style={[styles.input, styles.meterUnit]}
              placeholder="Einheit"
              value={reading.unit ?? ""}
              editable={!readOnly}
              onChangeText={(text) =>
                onChange({ meterNumber: reading.meterNumber ?? "", value: reading.value ?? 0, unit: text } as AnswerValue)
              }
            />
          </View>
        </View>
      );
    }
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  row: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 6, color: "#1a1a1a" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 10, fontSize: 15, backgroundColor: "white" },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  flex1: { flex: 1 },
  secondaryButton: { backgroundColor: "#e5e5e5", borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12 },
  secondaryButtonText: { color: "#1a1a1a", fontWeight: "500" },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  optionText: { fontSize: 15 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#999", alignItems: "center", justifyContent: "center" },
  radioOuterSelected: { borderColor: "#b3182c" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#b3182c" },
  checkboxOuter: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#999", alignItems: "center", justifyContent: "center" },
  checkboxOuterChecked: { borderColor: "#b3182c", backgroundColor: "#b3182c" },
  checkmark: { color: "white", fontSize: 13, fontWeight: "700" },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  photoWrapper: { position: "relative" },
  photo: { width: 80, height: 80, borderRadius: 6, borderWidth: 1, borderColor: "#ddd" },
  photoRemove: { position: "absolute", top: -6, right: -6, backgroundColor: "#b3182c", borderRadius: 11, width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  photoRemoveText: { color: "white", fontWeight: "700", lineHeight: 16 },
  meterValue: { width: 90 },
  meterUnit: { width: 70 },
});
