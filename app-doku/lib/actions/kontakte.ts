"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { kontaktCreateSchema } from "@/lib/validation/kontakt";

export async function createKontakt(formData: FormData) {
  await requireSession();

  const parsed = kontaktCreateSchema.safeParse({
    name: formData.get("name"),
    typ: formData.get("typ"),
    email: formData.get("email") ?? "",
    telefon: formData.get("telefon") ?? "",
    objektId: formData.get("objektId") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const kontakt = await prisma.kontakt.create({
    data: {
      name: parsed.data.name,
      typ: parsed.data.typ,
      email: parsed.data.email || null,
      telefon: parsed.data.telefon || null,
      objektId: parsed.data.objektId || null,
    },
  });

  revalidatePath("/kontakte");
  if (kontakt.objektId) revalidatePath(`/objekte/${kontakt.objektId}`);
  redirect(`/kontakte/${kontakt.id}`);
}
