import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";

export default async function MieterListePage() {
  const mieter = await prisma.mieter.findMany({
    orderBy: { name: "asc" },
    include: { einheit: { include: { objekt: true } }, _count: { select: { dokumente: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Mieter</h1>
        <Link href="/mieter/neu">
          <Button>Mieter anlegen</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {mieter.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Noch keine Mieter vorhanden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Einheit</th>
                <th className="px-4 py-2 font-medium">Dokumente</th>
              </tr>
            </thead>
            <tbody>
              {mieter.map((m) => (
                <tr key={m.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">
                    <Link href={`/mieter/${m.id}`} className="text-zinc-900 hover:underline">
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    {m.einheit.objekt.name} - {m.einheit.bezeichnung}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{m._count.dokumente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
