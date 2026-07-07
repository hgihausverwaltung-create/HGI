import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseTemplateSchema, templateSchemaSchema } from "../template";

function section(fields: unknown[]) {
  return { id: "s1", title: "Section", fields };
}

describe("templateSchemaSchema", () => {
  it("requires at least one section", () => {
    expect(() => parseTemplateSchema({ sections: [] })).toThrow(ZodError);
  });

  it("defaults repeatableGroups to an empty array when omitted", () => {
    const parsed = parseTemplateSchema({
      sections: [section([{ id: "f1", type: "text", label: "Feld 1" }])],
    });
    expect(parsed.repeatableGroups).toEqual([]);
  });

  it("rejects duplicate field IDs across different sections", () => {
    const result = templateSchemaSchema.safeParse({
      sections: [
        { id: "s1", title: "Section 1", fields: [{ id: "dup", type: "text", label: "Feld A" }] },
        { id: "s2", title: "Section 2", fields: [{ id: "dup", type: "text", label: "Feld B" }] },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("Doppelte Feld-ID: dup"))).toBe(true);
    }
  });

  it("accepts distinct field IDs across different sections", () => {
    const result = templateSchemaSchema.safeParse({
      sections: [
        { id: "s1", title: "Section 1", fields: [{ id: "f1", type: "text", label: "Feld A" }] },
        { id: "s2", title: "Section 2", fields: [{ id: "f2", type: "text", label: "Feld B" }] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a repeatableGroup referencing an unknown sourceFieldId", () => {
    const result = templateSchemaSchema.safeParse({
      sections: [section([{ id: "auswahl", type: "checkboxGroup", label: "Auswahl", options: [{ value: "a", label: "A" }] }])],
      repeatableGroups: [
        {
          id: "grp",
          title: "Gruppe",
          sourceFieldId: "nicht-vorhanden",
          itemSections: [section([{ id: "x", type: "text", label: "X" }])],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message.includes('unbekanntes Feld "nicht-vorhanden"')),
      ).toBe(true);
    }
  });

  it("rejects a repeatableGroup whose sourceFieldId is not a multiSelect/checkboxGroup field", () => {
    const result = templateSchemaSchema.safeParse({
      sections: [section([{ id: "name", type: "text", label: "Name" }])],
      repeatableGroups: [
        {
          id: "grp",
          title: "Gruppe",
          sourceFieldId: "name",
          itemSections: [section([{ id: "x", type: "text", label: "X" }])],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message.includes("muss auf ein multiSelect/checkboxGroup-Feld verweisen")),
      ).toBe(true);
    }
  });

  it("accepts a repeatableGroup referencing a valid multiSelect field", () => {
    const result = templateSchemaSchema.safeParse({
      sections: [section([{ id: "auswahl", type: "multiSelect", label: "Auswahl", options: [{ value: "a", label: "A" }] }])],
      repeatableGroups: [
        {
          id: "grp",
          title: "Gruppe",
          sourceFieldId: "auswahl",
          itemSections: [section([{ id: "x", type: "text", label: "X" }])],
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
