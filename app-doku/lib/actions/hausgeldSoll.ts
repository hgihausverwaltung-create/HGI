"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { hausgeldSollCreateSchema } from "@/lib/validation/hausgeldSoll";

export async function createHausgeldSoll(formData: FormData) {
  await requireSession();

  const parsed = hausgeldSollCreateSchema.safeParse({
    wirtschaftsplanId: formData.get("wirtschaftsplanId"),
    einheitId: formData.get("einheitId"),
    betragMonatlich: formData.get("betragMonatlich"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  try {
    await prisma.hausgeldSoll.create({
      data: {
        wirtschaftsplanId: parsed.data.wirtschaftsplanId,
        einheitId: parsed.data.einheitId,
        betragMonatlich: new Prisma.Decimal(parsed.data.betragMonatlich),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Fuer diese Einheit besteht in diesem Wirtschaftsplan bereits eine Position.");
    }
    throw err;
  }

  revalidatePath(`/wirtschaftsplaene/${parsed.data.wirtschaftsplanId}`);
}
