"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { aufgabeCreateSchema, aufgabeStatusUpdateSchema } from "@/lib/validation/aufgabe";

function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function createAufgabe(formData: FormData) {
  const session = await requireSession();

  const parsed = aufgabeCreateSchema.safeParse({
    titel: formData.get("titel"),
    beschreibung: formData.get("beschreibung") ?? "",
    prioritaet: formData.get("prioritaet"),
    faelligkeitsdatum: formData.get("faelligkeitsdatum") ?? "",
    objektId: formData.get("objektId") ?? "",
    dokumentId: formData.get("dokumentId") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const faelligkeitsdatum = orNull(parsed.data.faelligkeitsdatum);

  const aufgabe = await prisma.aufgabe.create({
    data: {
      titel: parsed.data.titel,
      beschreibung: orNull(parsed.data.beschreibung),
      prioritaet: parsed.data.prioritaet,
      faelligkeitsdatum: faelligkeitsdatum ? new Date(faelligkeitsdatum) : null,
      objektId: orNull(parsed.data.objektId),
      dokumentId: orNull(parsed.data.dokumentId),
      erstelltVonId: session.user.id,
    },
  });

  revalidatePath("/aufgaben");
  if (aufgabe.objektId) revalidatePath(`/objekte/${aufgabe.objektId}`);
  redirect(`/aufgaben/${aufgabe.id}`);
}

export async function updateAufgabeStatus(formData: FormData) {
  await requireSession();

  const parsed = aufgabeStatusUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await prisma.aufgabe.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  revalidatePath("/aufgaben");
  revalidatePath(`/aufgaben/${parsed.data.id}`);
}

export async function deleteAufgabe(formData: FormData) {
  await requireSession();

  const id = String(formData.get("id"));
  const aufgabe = await prisma.aufgabe.findUniqueOrThrow({ where: { id } });

  await prisma.aufgabe.delete({ where: { id } });

  revalidatePath("/aufgaben");
  if (aufgabe.objektId) revalidatePath(`/objekte/${aufgabe.objektId}`);
  redirect("/aufgaben");
}
