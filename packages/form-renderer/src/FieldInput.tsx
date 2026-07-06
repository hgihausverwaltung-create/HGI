import React, { useRef } from "react";
import type { AnswerValue, Field } from "@hgi/form-schema";
import type { AttachmentInfo, ReferenceOptionsByKind } from "./types";

export interface FieldInputProps {
  field: Field;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  fieldPath: string;
  attachments: AttachmentInfo[];
  onUploadPhoto: (fieldPath: string, file: File, kind: "PHOTO" | "SIGNATURE") => void | Promise<void>;
  onDeleteAttachment: (attachmentId: string) => void | Promise<void>;
  referenceOptions: ReferenceOptionsByKind;
  readOnly?: boolean;
}

const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 14, fontWeight: 500 };
const controlStyle: React.CSSProperties = { font: "inherit", padding: "0.4rem", border: "1px solid #ccc", borderRadius: 6 };
const rowStyle: React.CSSProperties = { marginBottom: "0.9rem" };
const optionRowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontWeight: 400 };

export function FieldInput({
  field,
  value,
  onChange,
  fieldPath,
  attachments,
  onUploadPhoto,
  onDeleteAttachment,
  referenceOptions,
  readOnly,
}: FieldInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function quickCaptureNow() {
    const now = new Date();
    if (field.type === "date") onChange(now.toISOString().slice(0, 10));
    else if (field.type === "time") onChange(now.toTimeString().slice(0, 5));
    else if (field.type === "datetime") onChange(now.toISOString().slice(0, 16));
  }

  switch (field.type) {
    case "text":
      return (
        <label style={rowStyle}>
          <span>{fieldLabel(field)}</span>
          <input
            style={controlStyle}
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
          />
        </label>
      );
    case "textarea":
      return (
        <label style={rowStyle}>
          <span>{fieldLabel(field)}</span>
          <textarea
            style={{ ...controlStyle, minHeight: 70 }}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
          />
        </label>
      );
    case "number":
      return (
        <label style={rowStyle}>
          <span>{fieldLabel(field)}</span>
          <input
            style={controlStyle}
            type="number"
            value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            disabled={readOnly}
          />
        </label>
      );
    case "date":
    case "time":
    case "datetime": {
      const inputType = field.type === "datetime" ? "datetime-local" : field.type;
      return (
        <label style={rowStyle}>
          <span>{fieldLabel(field)}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={controlStyle}
              type={inputType}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              disabled={readOnly}
            />
            {"quickActions" in field && field.quickActions?.includes("captureCurrentTime") && !readOnly && (
              <button type="button" onClick={quickCaptureNow}>
                Jetzt
              </button>
            )}
          </div>
        </label>
      );
    }
    case "boolean":
      return (
        <label style={{ ...rowStyle, ...optionRowStyle }}>
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} disabled={readOnly} />
          <span>{fieldLabel(field)}</span>
        </label>
      );
    case "singleSelect":
      return (
        <fieldset style={{ ...rowStyle, border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 500, fontSize: 14, padding: 0 }}>{fieldLabel(field)}</legend>
          {field.options.map((option) => (
            <label key={option.value} style={optionRowStyle}>
              <input
                type="radio"
                name={fieldPath}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                disabled={readOnly}
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      );
    case "multiSelect":
    case "checkboxGroup": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <fieldset style={{ ...rowStyle, border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 500, fontSize: 14, padding: 0 }}>{fieldLabel(field)}</legend>
          {field.options.map((option) => (
            <label key={option.value} style={optionRowStyle}>
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                disabled={readOnly}
                onChange={(e) => {
                  const next = e.target.checked ? [...selected, option.value] : selected.filter((v) => v !== option.value);
                  onChange(next);
                }}
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      );
    }
    case "reference": {
      const options = referenceOptions[field.referenceKind] ?? [];
      return (
        <label style={rowStyle}>
          <span>{fieldLabel(field)}</span>
          <select style={controlStyle} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} disabled={readOnly}>
            <option value="">Wert auswählen…</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    }
    case "photo":
    case "signature": {
      const kind = field.type === "signature" ? "SIGNATURE" : "PHOTO";
      const relevant = attachments.filter((a) => a.fieldPath === fieldPath);
      return (
        <div style={rowStyle}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{fieldLabel(field)}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
            {relevant.map((a) => (
              <div key={a.id} style={{ position: "relative" }}>
                <img src={a.url} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }} />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onDeleteAttachment(a.id)}
                    style={{ position: "absolute", top: -6, right: -6, borderRadius: "50%", width: 22, height: 22, padding: 0, lineHeight: 1 }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {!readOnly && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUploadPhoto(fieldPath, file, kind);
                  e.target.value = "";
                }}
              />
              <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
                {kind === "SIGNATURE" ? "Unterschrift hinzufügen" : "Foto hinzufügen"}
              </button>
            </>
          )}
        </div>
      );
    }
    case "meterReading": {
      const reading = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as {
        meterNumber?: string;
        value?: number;
        unit?: string;
      };
      return (
        <div style={rowStyle}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{fieldLabel(field)}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={controlStyle}
              placeholder="Zählernummer"
              value={reading.meterNumber ?? ""}
              disabled={readOnly}
              onChange={(e) => onChange({ ...reading, meterNumber: e.target.value } as AnswerValue)}
            />
            <input
              style={{ ...controlStyle, width: 110 }}
              type="number"
              placeholder="Stand"
              value={reading.value ?? ""}
              disabled={readOnly}
              onChange={(e) => onChange({ ...reading, value: Number(e.target.value) } as AnswerValue)}
            />
            <input
              style={{ ...controlStyle, width: 80 }}
              placeholder="Einheit"
              value={reading.unit ?? ""}
              disabled={readOnly}
              onChange={(e) => onChange({ ...reading, unit: e.target.value, meterNumber: reading.meterNumber ?? "", value: reading.value ?? 0 } as AnswerValue)}
            />
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

function fieldLabel(field: Field): string {
  return field.required ? `${field.label} *` : field.label;
}
