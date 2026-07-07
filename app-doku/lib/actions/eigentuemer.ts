"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { eigentuemerSchema } from "@/lib/validation/eigentuemer";

export async function createEigentuemer(formData: FormData) {
  await requireSession();

  const anredeRaw = formData.get("anrede");
  const parsed = eigentuemerSchema.safeParse({
    name: formData.get("name"),
    anrede: anredeRaw ? anredeRaw : undefined,
    email: formData.get("email") ?? "",
    telefon: formData.get("telefon") ?? "",
    iban: formData.get("iban") ?? "",
    bankname: formData.get("bankname") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const einheitId = formData.get("einheitId");

  const eigentuemer = await prisma.eigentuemer.create({
    data: {
      name: parsed.data.name,
      anrede: parsed.data.anrede ?? null,
      email: parsed.data.email || null,
      telefon: parsed.data.telefon || null,
      iban: parsed.data.iban || null,
      bankname: parsed.data.bankname || null,
      ...(einheitId
        ? {
            einheiten: {
              create: { einheitId: String(einheitId) },
            },
          }
        : {}),
    },
  });

  revalidatePath("/eigentuemer");
  redirect(`/eigentuemer/${eigentuemer.id}`);
}
