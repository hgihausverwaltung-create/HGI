import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { inputClassName } from "@/components/ui/Field";
import { VERSAMMLUNG_STATUS_LABELS, versammlungStatusValues } from "@/lib/validation/versammlung";

type SearchParams = {
  objektId?: string;
  status?: string;
};

export default async function VersammlungenPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.objektId) where.objektId = params.objektId;
  if (params.status) where.status = params.status;

  const [versammlungen, objekte] = await Promise.all([
    prisma.versammlung.findMany({
      where,
      orderBy: { datum: "desc" },
      include: { objekt: true },
    }),
    prisma.objekt.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Versammlungen</h1>
        <Link href="/versammlungen/neu">
          <Button>Versammlung anlegen</Button>
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
            {versammlungStatusValues.map((status) => (
              <option key={status} value={status}>
                {VERSAMMLUNG_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Filtern
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {versammlungen.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Keine Versammlungen gefunden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">Titel</th>
                <th className="px-4 py-2 font-medium">Objekt</th>
                <th className="px-4 py-2 font-medium">Datum</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {versammlungen.map((versammlung) => (
                <tr key={versammlung.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">
                    <Link
                      href={`/versammlungen/${versammlung.id}`}
                      className="text-zinc-900 hover:underline"
                    >
                      {versammlung.titel}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    <Link href={`/objekte/${versammlung.objekt.id}`} className="hover:underline">
                      {versammlung.objekt.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    {versammlung.datum.toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    {VERSAMMLUNG_STATUS_LABELS[versammlung.status]}
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
