"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { storage } from "@/lib/storage";
import { buildStorageKey } from "@/lib/documents";
import {
  dokumentUploadSchema,
  ERLAUBTE_MIME_TYPES,
  maxUploadSizeBytes,
} from "@/lib/validation/dokument";

function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function uploadDokument(formData: FormData) {
  const session = await requireSession();

  const file = formData.get("datei");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Bitte eine Datei auswaehlen");
  }
  if (!ERLAUBTE_MIME_TYPES.includes(file.type)) {
    throw new Error(`Dateityp nicht erlaubt: ${file.type}`);
  }
  if (file.size > maxUploadSizeBytes()) {
    throw new Error("Datei ist zu gross");
  }

  const parsed = dokumentUploadSchema.safeParse({
    kategorieId: formData.get("kategorieId"),
    objektId: formData.get("objektId"),
    einheitId: formData.get("einheitId") ?? "",
    eigentuemerId: formData.get("eigentuemerId") ?? "",
    mieterId: formData.get("mieterId") ?? "",
    beschreibung: formData.get("beschreibung") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = buildStorageKey(parsed.data.objektId, file.name);
  await storage.put(storageKey, buffer);

  const dokument = await prisma.dokument.create({
    data: {
      dateiname: file.name,
      speicherPfad: storageKey,
      mimeType: file.type,
      dateigroesse: file.size,
      beschreibung: orNull(parsed.data.beschreibung),
      kategorieId: parsed.data.kategorieId,
      objektId: parsed.data.objektId,
      einheitId: orNull(parsed.data.einheitId),
      eigentuemerId: orNull(parsed.data.eigentuemerId),
      mieterId: orNull(parsed.data.mieterId),
      hochgeladenVonId: session.user.id,
    },
  });

  revalidatePath("/dokumente");
  redirect(`/dokumente/${dokument.id}`);
}

export async function deleteDokument(formData: FormData) {
  await requireSession();

  const id = String(formData.get("id"));
  const dokument = await prisma.dokument.findUniqueOrThrow({ where: { id } });

  await storage.delete(dokument.speicherPfad);
  await prisma.dokument.delete({ where: { id } });

  revalidatePath("/dokumente");
  redirect("/dokumente");
}
