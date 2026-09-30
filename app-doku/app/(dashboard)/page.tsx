import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const [dokumentAnzahl, objektAnzahl, letzteDokumente] = await Promise.all([
    prisma.dokument.count(),
    prisma.objekt.count(),
    prisma.dokument.findMany({
      orderBy: { hochgeladenAm: "desc" },
      take: 5,
      include: { kategorie: true, objekt: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <Link href="/dokumente/neu">
          <Button>Dokument hochladen</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-2xl font-semibold text-zinc-900">{dokumentAnzahl}</div>
          <div className="text-sm text-zinc-500">Dokumente</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-2xl font-semibold text-zinc-900">{objektAnzahl}</div>
          <div className="text-sm text-zinc-500">Objekte</div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-700">Letzte Uploads</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {letzteDokumente.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Noch keine Dokumente vorhanden.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {letzteDokumente.map((doc) => (
                  <tr key={doc.id} className="border-t border-zinc-100 first:border-t-0">
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
    </div>
  );
}
