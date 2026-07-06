"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { eigentuemerSchema } from "@/lib/validation/eigentuemer";

export async function createEigentuemer(formData: FormData) {
  await requireSession();

  const parsed = eigentuemerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    telefon: formData.get("telefon") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const einheitId = formData.get("einheitId");

  const eigentuemer = await prisma.eigentuemer.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
      telefon: parsed.data.telefon || null,
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
