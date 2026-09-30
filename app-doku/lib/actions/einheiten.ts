"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { einheitSchema } from "@/lib/validation/einheit";

export async function createEinheit(formData: FormData) {
  await requireSession();

  const typRaw = formData.get("typ");
  const parsed = einheitSchema.safeParse({
    objektId: formData.get("objektId"),
    bezeichnung: formData.get("bezeichnung"),
    typ: typRaw ? typRaw : undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await prisma.einheit.create({ data: parsed.data });

  revalidatePath(`/objekte/${parsed.data.objektId}`);
}
