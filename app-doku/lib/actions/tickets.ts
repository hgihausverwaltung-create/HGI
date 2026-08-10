"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  ticketCreateSchema,
  ticketStatusUpdateSchema,
  ticketZuweisungUpdateSchema,
} from "@/lib/validation/ticket";

function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function createTicket(formData: FormData) {
  await requireSession();

  const parsed = ticketCreateSchema.safeParse({
    titel: formData.get("titel"),
    beschreibung: formData.get("beschreibung") ?? "",
    kategorie: formData.get("kategorie"),
    prioritaet: formData.get("prioritaet"),
    objektId: formData.get("objektId"),
    einheitId: formData.get("einheitId") ?? "",
    mieterId: formData.get("mieterId") ?? "",
    eigentuemerId: formData.get("eigentuemerId") ?? "",
    zugewiesenAnId: formData.get("zugewiesenAnId") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const ticket = await prisma.ticket.create({
    data: {
      titel: parsed.data.titel,
      beschreibung: orNull(parsed.data.beschreibung),
      kategorie: parsed.data.kategorie,
      prioritaet: parsed.data.prioritaet,
      objektId: parsed.data.objektId,
      einheitId: orNull(parsed.data.einheitId),
      mieterId: orNull(parsed.data.mieterId),
      eigentuemerId: orNull(parsed.data.eigentuemerId),
      zugewiesenAnId: orNull(parsed.data.zugewiesenAnId),
    },
  });

  revalidatePath("/tickets");
  revalidatePath(`/objekte/${ticket.objektId}`);
  redirect(`/tickets/${ticket.id}`);
}

export async function updateTicketStatus(formData: FormData) {
  await requireSession();

  const parsed = ticketStatusUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await prisma.ticket.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      erledigtAm: parsed.data.status === "ERLEDIGT" ? new Date() : null,
    },
  });

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${parsed.data.id}`);
}

export async function updateTicketZuweisung(formData: FormData) {
  await requireSession();

  const parsed = ticketZuweisungUpdateSchema.safeParse({
    id: formData.get("id"),
    zugewiesenAnId: formData.get("zugewiesenAnId") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await prisma.ticket.update({
    where: { id: parsed.data.id },
    data: { zugewiesenAnId: orNull(parsed.data.zugewiesenAnId) },
  });

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${parsed.data.id}`);
}
