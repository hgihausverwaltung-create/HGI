"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  tagesordnungspunktCreateSchema,
  tagesordnungspunktErgebnisUpdateSchema,
} from "@/lib/validation/tagesordnungspunkt";

function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function createTagesordnungspunkt(formData: FormData) {
  await requireSession();

  const parsed = tagesordnungspunktCreateSchema.safeParse({
    versammlungId: formData.get("versammlungId"),
    titel: formData.get("titel"),
    beschreibung: formData.get("beschreibung") ?? "",
    beschlussvorschlag: formData.get("beschlussvorschlag") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const anzahl = await prisma.tagesordnungspunkt.count({
    where: { versammlungId: parsed.data.versammlungId },
  });

  await prisma.tagesordnungspunkt.create({
    data: {
      versammlungId: parsed.data.versammlungId,
      reihenfolge: anzahl + 1,
      titel: parsed.data.titel,
      beschreibung: orNull(parsed.data.beschreibung),
      beschlussvorschlag: orNull(parsed.data.beschlussvorschlag),
    },
  });

  revalidatePath(`/versammlungen/${parsed.data.versammlungId}`);
}

export async function updateTagesordnungspunktErgebnis(formData: FormData) {
  await requireSession();

  const parsed = tagesordnungspunktErgebnisUpdateSchema.safeParse({
    id: formData.get("id"),
    versammlungId: formData.get("versammlungId"),
    ergebnis: formData.get("ergebnis"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await prisma.tagesordnungspunkt.update({
    where: { id: parsed.data.id },
    data: { ergebnis: parsed.data.ergebnis },
  });

  revalidatePath(`/versammlungen/${parsed.data.versammlungId}`);
}
