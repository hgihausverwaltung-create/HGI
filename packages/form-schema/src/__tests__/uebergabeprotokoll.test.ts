import { describe, expect, it } from "vitest";
import { parseTemplateSchema } from "../template";
import { validateAnswers } from "../answers";

/**
 * A cut-down version of the real Übergabeprotokoll (Protokollart, Objekt/Wohnung,
 * "Bestehend aus" room checklist with a per-room sub-form) — exercises the
 * RepeatableGroup mechanism end to end against the actual target use case.
 */
const uebergabeprotokoll = parseTemplateSchema({
  sections: [
    {
      id: "protokollinformationen",
      title: "Protokollinformationen",
      collapsible: true,
      fields: [
        { id: "protokollDatum", type: "datetime", label: "Übergabeprotokoll vom", required: true, quickActions: ["captureCurrentTime"] },
        {
          id: "protokollart",
          type: "singleSelect",
          label: "Protokollart",
          required: true,
          options: [
            { value: "auszug", label: "Übergabe bei Auszug" },
            { value: "einzug", label: "Übergabe bei Einzug" },
            { value: "einUndAuszug", label: "Übergabe bei Ein- und Auszug" },
          ],
        },
        { id: "objekt", type: "reference", label: "Objekt", required: true, referenceKind: "property" },
        { id: "wohnung", type: "reference", label: "Wohnung", required: true, referenceKind: "unit" },
        {
          id: "bestehendAus",
          type: "checkboxGroup",
          label: "Bestehend aus",
          required: true,
          options: [
            { value: "eingangsbereich", label: "Eingangsbereich" },
            { value: "kueche", label: "Küche" },
            { value: "zimmer1", label: "Zimmer 1" },
            { value: "bad", label: "Bad" },
            { value: "keller", label: "Keller" },
          ],
        },
      ],
    },
  ],
  repeatableGroups: [
    {
      id: "raeume",
      title: "Raum",
      sourceFieldId: "bestehendAus",
      itemSections: [
        {
          id: "raumZustand",
          title: "Zustand",
          fields: [
            {
              id: "zustand",
              type: "singleSelect",
              label: "Zustand",
              required: true,
              options: [
                { value: "gut", label: "Gut" },
                { value: "maengel", label: "Mängel vorhanden" },
              ],
            },
            { id: "fotos", type: "photo", label: "Fotos", required: false },
          ],
        },
      ],
    },
  ],
});

describe("Übergabeprotokoll template", () => {
  it("parses without error", () => {
    expect(uebergabeprotokoll.sections).toHaveLength(1);
    expect(uebergabeprotokoll.repeatableGroups).toHaveLength(1);
  });

  it("rejects a draft missing required top-level fields", () => {
    const result = validateAnswers(uebergabeprotokoll, { values: {}, repeatables: {} });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes("Übergabeprotokoll vom"))).toBe(true);
  });

  it("requires a room sub-form for every checked room in 'Bestehend aus'", () => {
    const result = validateAnswers(uebergabeprotokoll, {
      values: {
        protokollDatum: "2026-07-06T07:06:00Z",
        protokollart: "auszug",
        objekt: "property-1",
        wohnung: "unit-1",
        bestehendAus: ["kueche", "bad"],
      },
      repeatables: {
        raeume: {
          kueche: { zustand: "gut" },
          // "bad" sub-form is missing entirely
        },
      },
    });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes("bad"))).toBe(true);
  });

  it("accepts a fully filled draft with all selected room sub-forms present", () => {
    const result = validateAnswers(uebergabeprotokoll, {
      values: {
        protokollDatum: "2026-07-06T07:06:00Z",
        protokollart: "auszug",
        objekt: "property-1",
        wohnung: "unit-1",
        bestehendAus: ["kueche", "bad"],
      },
      repeatables: {
        raeume: {
          kueche: { zustand: "gut", fotos: [] },
          bad: { zustand: "maengel", fotos: ["attachment-uuid-1"] },
        },
      },
    });
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
