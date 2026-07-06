import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { inputClassName } from "@/components/ui/Field";

type SearchParams = {
  kategorieId?: string;
  objektId?: string;
  q?: string;
};

export default async function DokumentePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.kategorieId) where.kategorieId = params.kategorieId;
  if (params.objektId) where.objektId = params.objektId;
  if (params.q) {
    where.dateiname = { contains: params.q, mode: "insensitive" };
  }

  const [dokumente, kategorien, objekte] = await Promise.all([
    prisma.dokument.findMany({
      where,
      orderBy: { hochgeladenAm: "desc" },
      include: { kategorie: true, objekt: true },
    }),
    prisma.dokumentKategorie.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.objekt.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Dokumente</h1>
        <Link href="/dokumente/neu">
          <Button>Dokument hochladen</Button>
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Dateiname</label>
          <input
            type="text"
            name="q"
            defaultValue={params.q}
            placeholder="Suchen..."
            className={inputClassName}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Kategorie</label>
          <select name="kategorieId" defaultValue={params.kategorieId ?? ""} className={inputClassName}>
            <option value="">Alle</option>
            {kategorien.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
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
        {dokumente.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Keine Dokumente gefunden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">Dateiname</th>
                <th className="px-4 py-2 font-medium">Kategorie</th>
                <th className="px-4 py-2 font-medium">Objekt</th>
                <th className="px-4 py-2 font-medium">Hochgeladen am</th>
              </tr>
            </thead>
            <tbody>
              {dokumente.map((doc) => (
                <tr key={doc.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">
                    <Link href={`/dokumente/${doc.id}`} className="text-zinc-900 hover:underline">
                      {doc.dateiname}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{doc.kategorie.name}</td>
                  <td className="px-4 py-2 text-zinc-500">{doc.objekt.name}</td>
                  <td className="px-4 py-2 text-zinc-500">
                    {doc.hochgeladenAm.toLocaleDateString("de-DE")}
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
