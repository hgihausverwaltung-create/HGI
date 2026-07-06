import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { parseTemplateSchema } from "@hgi/form-schema";

const prisma = new PrismaClient();

const uebergabeprotokollSchema = parseTemplateSchema({
  sections: [
    {
      id: "protokollinformationen",
      title: "Protokollinformationen",
      collapsible: true,
      fields: [
        {
          id: "protokollDatum",
          type: "datetime",
          label: "Übergabeprotokoll vom",
          required: true,
          quickActions: ["captureCurrentTime"],
        },
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
            { value: "mitEinbaukueche", label: "mit Einbauküche" },
            { value: "zimmer1", label: "Zimmer 1" },
            { value: "zimmer2", label: "Zimmer 2" },
            { value: "zimmer3", label: "Zimmer 3" },
            { value: "zimmer4", label: "Zimmer 4" },
            { value: "zimmer5", label: "Zimmer 5" },
            { value: "bad", label: "Bad" },
            { value: "gaesteWc", label: "Gäste-WC" },
            { value: "abstellkammer", label: "Abstellkammer" },
            { value: "balkonTerrasse", label: "Balkon/Terrasse" },
            { value: "balkonTerrasse2", label: "Balkon/Terrasse 2" },
            { value: "zwischenflur", label: "Zwischenflur" },
            { value: "keller", label: "Keller" },
            { value: "tgGarage", label: "TG/Garage" },
            { value: "stellplatz", label: "Stellplatz" },
            { value: "garten", label: "Garten" },
            { value: "allgemeinflaeche", label: "Allgemeinfläche" },
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
                { value: "akzeptabel", label: "Akzeptabel" },
                { value: "maengel", label: "Mängel vorhanden" },
              ],
            },
            { id: "maengelBeschreibung", type: "textarea", label: "Mängelbeschreibung", required: false },
            { id: "zaehlerstand", type: "meterReading", label: "Zählerstand", required: false },
            { id: "fotos", type: "photo", label: "Fotos", required: false },
          ],
        },
      ],
    },
  ],
});

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin1234", 10);
  const fieldPasswordHash = await bcrypt.hash("aussendienst1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hgi-immobilien.de" },
    update: {},
    create: {
      email: "admin@hgi-immobilien.de",
      name: "HGI Verwaltung",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "aussendienst@hgi-immobilien.de" },
    update: {},
    create: {
      email: "aussendienst@hgi-immobilien.de",
      name: "Außendienst Testkonto",
      role: "FIELD_STAFF",
      passwordHash: fieldPasswordHash,
    },
  });

  const property = await prisma.property.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Musterstraße 1",
      street: "Musterstraße",
      houseNumber: "1",
      postalCode: "12345",
      city: "Musterstadt",
      kind: "MIETE",
    },
  });

  await prisma.unit.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      propertyId: property.id,
      label: "WE 3, 2. OG rechts",
      floor: "2. OG",
    },
  });

  const template = await prisma.template.upsert({
    where: { key: "uebergabeprotokoll" },
    update: {},
    create: {
      key: "uebergabeprotokoll",
      name: "Übergabeprotokoll",
      description: "Protokoll zur Wohnungsübergabe bei Ein- und/oder Auszug",
      icon: "handover",
    },
  });

  const existingVersion = await prisma.templateVersion.findFirst({
    where: { templateId: template.id },
  });

  if (!existingVersion) {
    const version = await prisma.templateVersion.create({
      data: {
        templateId: template.id,
        versionNumber: 1,
        status: "PUBLISHED",
        schema: uebergabeprotokollSchema as object,
        publishedAt: new Date(),
        publishedById: admin.id,
      },
    });
    await prisma.template.update({
      where: { id: template.id },
      data: { currentVersionId: version.id },
    });
  }

  console.log("Seed abgeschlossen.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
