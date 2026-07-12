"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { objektSchema } from "@/lib/validation/objekt";

export async function createObjekt(formData: FormData) {
  await requireSession();

  const parsed = objektSchema.safeParse({
    name: formData.get("name"),
    strasse: formData.get("strasse"),
    plz: formData.get("plz"),
    ort: formData.get("ort"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const objekt = await prisma.objekt.create({ data: parsed.data });

  revalidatePath("/objekte");
  redirect(`/objekte/${objekt.id}`);
}
