"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  wirtschaftsplanCreateSchema,
  wirtschaftsplanStatusUpdateSchema,
  wirtschaftsplanVersammlungUpdateSchema,
} from "@/lib/validation/wirtschaftsplan";

function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function createWirtschaftsplan(formData: FormData) {
  await requireSession();

  const parsed = wirtschaftsplanCreateSchema.safeParse({
    objektId: formData.get("objektId"),
    wirtschaftsjahr: formData.get("wirtschaftsjahr"),
    versammlungId: formData.get("versammlungId") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  let wirtschaftsplan;
  try {
    wirtschaftsplan = await prisma.wirtschaftsplan.create({
      data: {
        objektId: parsed.data.objektId,
        wirtschaftsjahr: parsed.data.wirtschaftsjahr,
        versammlungId: orNull(parsed.data.versammlungId),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Fuer dieses Objekt existiert bereits ein Wirtschaftsplan fuer dieses Jahr.");
    }
    throw err;
  }

  revalidatePath("/wirtschaftsplaene");
  revalidatePath(`/objekte/${wirtschaftsplan.objektId}`);
  redirect(`/wirtschaftsplaene/${wirtschaftsplan.id}`);
}

export async function updateWirtschaftsplanStatus(formData: FormData) {
  await requireSession();

  const parsed = wirtschaftsplanStatusUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await prisma.wirtschaftsplan.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  revalidatePath("/wirtschaftsplaene");
  revalidatePath(`/wirtschaftsplaene/${parsed.data.id}`);
}

export async function updateWirtschaftsplanVersammlung(formData: FormData) {
  await requireSession();

  const parsed = wirtschaftsplanVersammlungUpdateSchema.safeParse({
    id: formData.get("id"),
    versammlungId: formData.get("versammlungId") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await prisma.wirtschaftsplan.update({
    where: { id: parsed.data.id },
    data: { versammlungId: orNull(parsed.data.versammlungId) },
  });

  revalidatePath("/wirtschaftsplaene");
  revalidatePath(`/wirtschaftsplaene/${parsed.data.id}`);
}
