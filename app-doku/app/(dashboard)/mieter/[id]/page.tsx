import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ANREDE_LABELS } from "@/lib/validation/anrede";

export default async function MieterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const mieter = await prisma.mieter.findUnique({
    where: { id },
    include: {
      einheit: { include: { objekt: true } },
      dokumente: { orderBy: { hochgeladenAm: "desc" }, include: { kategorie: true } },
    },
  });

  if (!mieter) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">
          {mieter.anrede ? `${ANREDE_LABELS[mieter.anrede]} ` : ""}
          {mieter.name}
        </h1>
        <p className="text-sm text-zinc-500">
          {mieter.email ?? "keine E-Mail"} {mieter.telefon ? `- ${mieter.telefon}` : ""}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          <Link href={`/objekte/${mieter.einheit.objektId}`} className="hover:underline">
            {mieter.einheit.objekt.name} - {mieter.einheit.bezeichnung}
          </Link>
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-700">Dokumente</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {mieter.dokumente.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Noch keine Dokumente vorhanden.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {mieter.dokumente.map((doc) => (
                  <tr key={doc.id} className="border-t border-zinc-100 first:border-t-0">
                    <td className="px-4 py-2">
                      <Link href={`/dokumente/${doc.id}`} className="text-zinc-900 hover:underline">
                        {doc.dateiname}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-zinc-500">{doc.kategorie.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
