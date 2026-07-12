import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";

export default async function EigentuemerListePage() {
  const eigentuemer = await prisma.eigentuemer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { dokumente: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Eigentuemer</h1>
        <Link href="/eigentuemer/neu">
          <Button>Eigentuemer anlegen</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {eigentuemer.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Noch keine Eigentuemer vorhanden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">E-Mail</th>
                <th className="px-4 py-2 font-medium">Dokumente</th>
              </tr>
            </thead>
            <tbody>
              {eigentuemer.map((e) => (
                <tr key={e.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">
                    <Link href={`/eigentuemer/${e.id}`} className="text-zinc-900 hover:underline">
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{e.email ?? "-"}</td>
                  <td className="px-4 py-2 text-zinc-500">{e._count.dokumente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
