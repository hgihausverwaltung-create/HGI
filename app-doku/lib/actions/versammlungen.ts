"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  versammlungCreateSchema,
  versammlungStatusUpdateSchema,
  versammlungDokumentUpdateSchema,
} from "@/lib/validation/versammlung";

function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function createVersammlung(formData: FormData) {
  await requireSession();

  const parsed = versammlungCreateSchema.safeParse({
    titel: formData.get("titel"),
    datum: formData.get("datum"),
    einladungsdatum: formData.get("einladungsdatum") ?? "",
    objektId: formData.get("objektId"),
    dokumentId: formData.get("dokumentId") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const einladungsdatum = orNull(parsed.data.einladungsdatum);

  const versammlung = await prisma.versammlung.create({
    data: {
      titel: parsed.data.titel,
      datum: new Date(parsed.data.datum),
      einladungsdatum: einladungsdatum ? new Date(einladungsdatum) : null,
      objektId: parsed.data.objektId,
      dokumentId: orNull(parsed.data.dokumentId),
    },
  });

  revalidatePath("/versammlungen");
  revalidatePath(`/objekte/${versammlung.objektId}`);
  redirect(`/versammlungen/${versammlung.id}`);
}

export async function updateVersammlungStatus(formData: FormData) {
  await requireSession();

  const parsed = versammlungStatusUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await prisma.versammlung.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  revalidatePath("/versammlungen");
  revalidatePath(`/versammlungen/${parsed.data.id}`);
}

export async function updateVersammlungDokument(formData: FormData) {
  await requireSession();

  const parsed = versammlungDokumentUpdateSchema.safeParse({
    id: formData.get("id"),
    dokumentId: formData.get("dokumentId") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await prisma.versammlung.update({
    where: { id: parsed.data.id },
    data: { dokumentId: orNull(parsed.data.dokumentId) },
  });

  revalidatePath("/versammlungen");
  revalidatePath(`/versammlungen/${parsed.data.id}`);
}
