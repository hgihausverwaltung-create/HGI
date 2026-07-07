import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { inputClassName } from "@/components/ui/Field";
import { KONTAKT_TYP_LABELS, kontaktTypValues } from "@/lib/validation/kontakt";

type SearchParams = {
  typ?: string;
  objektId?: string;
};

export default async function KontaktePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.typ) where.typ = params.typ;
  if (params.objektId) where.objektId = params.objektId;

  const [kontakte, objekte] = await Promise.all([
    prisma.kontakt.findMany({
      where,
      orderBy: { name: "asc" },
      include: { objekt: true },
    }),
    prisma.objekt.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Kontakte</h1>
        <Link href="/kontakte/neu">
          <Button>Kontakt anlegen</Button>
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Typ</label>
          <select name="typ" defaultValue={params.typ ?? ""} className={inputClassName}>
            <option value="">Alle</option>
            {kontaktTypValues.map((typ) => (
              <option key={typ} value={typ}>
                {KONTAKT_TYP_LABELS[typ]}
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
        {kontakte.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Keine Kontakte gefunden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Typ</th>
                <th className="px-4 py-2 font-medium">Objekt</th>
                <th className="px-4 py-2 font-medium">E-Mail</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
              </tr>
            </thead>
            <tbody>
              {kontakte.map((kontakt) => (
                <tr key={kontakt.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">
                    <Link href={`/kontakte/${kontakt.id}`} className="text-zinc-900 hover:underline">
                      {kontakt.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{KONTAKT_TYP_LABELS[kontakt.typ]}</td>
                  <td className="px-4 py-2 text-zinc-500">
                    {kontakt.objekt ? (
                      <Link href={`/objekte/${kontakt.objekt.id}`} className="hover:underline">
                        {kontakt.objekt.name}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{kontakt.email ?? "-"}</td>
                  <td className="px-4 py-2 text-zinc-500">{kontakt.telefon ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
