import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { inputClassName } from "@/components/ui/Field";
import {
  AUFGABE_STATUS_LABELS,
  AUFGABE_PRIORITAET_LABELS,
  aufgabeStatusValues,
  aufgabePrioritaetValues,
} from "@/lib/validation/aufgabe";

type SearchParams = {
  status?: string;
  prioritaet?: string;
  objektId?: string;
};

export default async function AufgabenPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (params.prioritaet) where.prioritaet = params.prioritaet;
  if (params.objektId) where.objektId = params.objektId;

  const [aufgaben, objekte] = await Promise.all([
    prisma.aufgabe.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { objekt: true, dokument: true, erstelltVon: true },
    }),
    prisma.objekt.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Aufgaben</h1>
        <Link href="/aufgaben/neu">
          <Button>Aufgabe anlegen</Button>
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Status</label>
          <select name="status" defaultValue={params.status ?? ""} className={inputClassName}>
            <option value="">Alle</option>
            {aufgabeStatusValues.map((status) => (
              <option key={status} value={status}>
                {AUFGABE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Prioritaet</label>
          <select name="prioritaet" defaultValue={params.prioritaet ?? ""} className={inputClassName}>
            <option value="">Alle</option>
            {aufgabePrioritaetValues.map((prioritaet) => (
              <option key={prioritaet} value={prioritaet}>
                {AUFGABE_PRIORITAET_LABELS[prioritaet]}
              </option>
            ))}
          </select>
        </div>
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
        <Button type="submit" variant="secondary">
          Filtern
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {aufgaben.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Keine Aufgaben gefunden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">Titel</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Prioritaet</th>
                <th className="px-4 py-2 font-medium">Objekt</th>
                <th className="px-4 py-2 font-medium">Faellig am</th>
                <th className="px-4 py-2 font-medium">Erstellt von</th>
              </tr>
            </thead>
            <tbody>
              {aufgaben.map((aufgabe) => (
                <tr key={aufgabe.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">
                    <Link href={`/aufgaben/${aufgabe.id}`} className="text-zinc-900 hover:underline">
                      {aufgabe.titel}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{AUFGABE_STATUS_LABELS[aufgabe.status]}</td>
                  <td className="px-4 py-2 text-zinc-500">
                    {AUFGABE_PRIORITAET_LABELS[aufgabe.prioritaet]}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    {aufgabe.objekt ? (
                      <Link href={`/objekte/${aufgabe.objekt.id}`} className="hover:underline">
                        {aufgabe.objekt.name}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    {aufgabe.faelligkeitsdatum
                      ? aufgabe.faelligkeitsdatum.toLocaleDateString("de-DE")
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{aufgabe.erstelltVon.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
