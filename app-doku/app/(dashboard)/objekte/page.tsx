import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";

export default async function ObjektePage() {
  const objekte = await prisma.objekt.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { einheiten: true, dokumente: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Objekte</h1>
        <Link href="/objekte/neu">
          <Button>Objekt anlegen</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {objekte.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Noch keine Objekte vorhanden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Adresse</th>
                <th className="px-4 py-2 font-medium">Einheiten</th>
                <th className="px-4 py-2 font-medium">Dokumente</th>
              </tr>
            </thead>
            <tbody>
              {objekte.map((objekt) => (
                <tr key={objekt.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">
                    <Link href={`/objekte/${objekt.id}`} className="text-zinc-900 hover:underline">
                      {objekt.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    {objekt.strasse}, {objekt.plz} {objekt.ort}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{objekt._count.einheiten}</td>
                  <td className="px-4 py-2 text-zinc-500">{objekt._count.dokumente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
