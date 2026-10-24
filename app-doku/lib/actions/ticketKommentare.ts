"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { ticketKommentarCreateSchema } from "@/lib/validation/ticketKommentar";

export async function createTicketKommentar(formData: FormData) {
  const session = await requireSession();

  const parsed = ticketKommentarCreateSchema.safeParse({
    ticketId: formData.get("ticketId"),
    text: formData.get("text"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await prisma.ticketKommentar.create({
    data: {
      ticketId: parsed.data.ticketId,
      text: parsed.data.text,
      erstelltVonId: session.user.id,
    },
  });

  revalidatePath(`/tickets/${parsed.data.ticketId}`);
}
