"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { mieterSchema } from "@/lib/validation/mieter";

export async function createMieter(formData: FormData) {
  await requireSession();

  const parsed = mieterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    telefon: formData.get("telefon") ?? "",
    einheitId: formData.get("einheitId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const mieter = await prisma.mieter.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
      telefon: parsed.data.telefon || null,
      einheitId: parsed.data.einheitId,
    },
  });

  revalidatePath("/mieter");
  redirect(`/mieter/${mieter.id}`);
}
