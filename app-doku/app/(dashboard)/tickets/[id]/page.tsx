import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateTicketStatus, updateTicketZuweisung } from "@/lib/actions/tickets";
import { createTicketKommentar } from "@/lib/actions/ticketKommentare";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  TICKET_KATEGORIE_LABELS,
  TICKET_PRIORITAET_LABELS,
  TICKET_STATUS_LABELS,
  ticketStatusValues,
} from "@/lib/validation/ticket";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      objekt: true,
      einheit: true,
      mieter: true,
      eigentuemer: true,
      zugewiesenAn: true,
      kommentare: { orderBy: { createdAt: "asc" }, include: { erstelltVon: true } },
    },
  });

  if (!ticket) notFound();

  const mitarbeiter = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{ticket.titel}</h1>
        <p className="text-sm text-zinc-500">
          {TICKET_KATEGORIE_LABELS[ticket.kategorie]} - {TICKET_PRIORITAET_LABELS[ticket.prioritaet]} -{" "}
          {TICKET_STATUS_LABELS[ticket.status]}
        </p>
      </div>

      {ticket.beschreibung && <p className="text-sm text-zinc-700">{ticket.beschreibung}</p>}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-zinc-500">Objekt</dt>
        <dd>
          <Link href={`/objekte/${ticket.objekt.id}`} className="text-zinc-900 hover:underline">
            {ticket.objekt.name}
          </Link>
        </dd>

        <dt className="text-zinc-500">Einheit</dt>
        <dd>{ticket.einheit?.bezeichnung ?? "-"}</dd>

        <dt className="text-zinc-500">Mieter/Melder</dt>
        <dd>{ticket.mieter?.name ?? "-"}</dd>

        <dt className="text-zinc-500">Eigentuemer/Melder</dt>
        <dd>{ticket.eigentuemer?.name ?? "-"}</dd>

        <dt className="text-zinc-500">Gemeldet am</dt>
        <dd>{ticket.gemeldetAm.toLocaleDateString("de-DE")}</dd>

        <dt className="text-zinc-500">Erledigt am</dt>
        <dd>{ticket.erledigtAm ? ticket.erledigtAm.toLocaleDateString("de-DE") : "-"}</dd>
      </dl>

      <div className="flex flex-wrap items-end gap-6">
        <form action={updateTicketStatus} className="flex items-end gap-3">
          <input type="hidden" name="id" value={ticket.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-sm font-medium text-zinc-700">
              Status
            </label>
            <select id="status" name="status" defaultValue={ticket.status} className={inputClassName}>
              {ticketStatusValues.map((status) => (
                <option key={status} value={status}>
                  {TICKET_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Speichern
          </Button>
        </form>

        <form action={updateTicketZuweisung} className="flex items-end gap-3">
          <input type="hidden" name="id" value={ticket.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor="zugewiesenAnId" className="text-sm font-medium text-zinc-700">
              Zugewiesen an
            </label>
            <select
              id="zugewiesenAnId"
              name="zugewiesenAnId"
              defaultValue={ticket.zugewiesenAnId ?? ""}
              className={inputClassName}
            >
              <option value="">Niemand</option>
              {mitarbeiter.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Speichern
          </Button>
        </form>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-700">Verlauf</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {ticket.kommentare.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Noch keine Kommentare vorhanden.</p>
          ) : (
            <ul>
              {ticket.kommentare.map((kommentar) => (
                <li key={kommentar.id} className="border-t border-zinc-100 p-4 first:border-t-0">
                  <p className="text-sm text-zinc-700">{kommentar.text}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {kommentar.erstelltVon.name} - {kommentar.createdAt.toLocaleString("de-DE")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form action={createTicketKommentar} className="flex flex-col gap-3">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <Field label="Neuer Kommentar" htmlFor="text" required>
            <textarea id="text" name="text" required rows={3} className={inputClassName} />
          </Field>
          <Button type="submit" variant="secondary" className="self-start">
            Kommentar hinzufuegen
          </Button>
        </form>
      </section>
    </div>
  );
}
