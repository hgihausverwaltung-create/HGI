import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { inputClassName } from "@/components/ui/Field";
import {
  TICKET_KATEGORIE_LABELS,
  TICKET_PRIORITAET_LABELS,
  TICKET_STATUS_LABELS,
  ticketKategorieValues,
  ticketPrioritaetValues,
  ticketStatusValues,
} from "@/lib/validation/ticket";

type SearchParams = {
  objektId?: string;
  status?: string;
  prioritaet?: string;
  kategorie?: string;
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.objektId) where.objektId = params.objektId;
  if (params.status) where.status = params.status;
  if (params.prioritaet) where.prioritaet = params.prioritaet;
  if (params.kategorie) where.kategorie = params.kategorie;

  const [tickets, objekte] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: [{ status: "asc" }, { gemeldetAm: "desc" }],
      include: { objekt: true, einheit: true, zugewiesenAn: true },
    }),
    prisma.objekt.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Tickets</h1>
        <Link href="/tickets/neu">
          <Button>Ticket anlegen</Button>
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Objekt</label>
          <select name="objektId" defaultValue={params.objektId ?? ""} className={inputClassName}>
            <option value="">Alle</option>
            {objekte.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Status</label>
          <select name="status" defaultValue={params.status ?? ""} className={inputClassName}>
            <option value="">Alle</option>
            {ticketStatusValues.map((status) => (
              <option key={status} value={status}>
                {TICKET_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Prioritaet</label>
          <select name="prioritaet" defaultValue={params.prioritaet ?? ""} className={inputClassName}>
            <option value="">Alle</option>
            {ticketPrioritaetValues.map((prioritaet) => (
              <option key={prioritaet} value={prioritaet}>
                {TICKET_PRIORITAET_LABELS[prioritaet]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Kategorie</label>
          <select name="kategorie" defaultValue={params.kategorie ?? ""} className={inputClassName}>
            <option value="">Alle</option>
            {ticketKategorieValues.map((kategorie) => (
              <option key={kategorie} value={kategorie}>
                {TICKET_KATEGORIE_LABELS[kategorie]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Filtern
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {tickets.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Keine Tickets gefunden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">Titel</th>
                <th className="px-4 py-2 font-medium">Objekt</th>
                <th className="px-4 py-2 font-medium">Kategorie</th>
                <th className="px-4 py-2 font-medium">Prioritaet</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Zugewiesen an</th>
                <th className="px-4 py-2 font-medium">Gemeldet am</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">
                    <Link href={`/tickets/${ticket.id}`} className="text-zinc-900 hover:underline">
                      {ticket.titel}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    {ticket.objekt.name}
                    {ticket.einheit ? ` - ${ticket.einheit.bezeichnung}` : ""}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{TICKET_KATEGORIE_LABELS[ticket.kategorie]}</td>
                  <td className="px-4 py-2 text-zinc-500">
                    {TICKET_PRIORITAET_LABELS[ticket.prioritaet]}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{TICKET_STATUS_LABELS[ticket.status]}</td>
                  <td className="px-4 py-2 text-zinc-500">{ticket.zugewiesenAn?.name ?? "-"}</td>
                  <td className="px-4 py-2 text-zinc-500">
                    {ticket.gemeldetAm.toLocaleDateString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
