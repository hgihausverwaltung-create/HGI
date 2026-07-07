import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ANREDE_LABELS } from "@/lib/validation/anrede";

export default async function EigentuemerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const eigentuemer = await prisma.eigentuemer.findUnique({
    where: { id },
    include: {
      einheiten: { include: { einheit: { include: { objekt: true } } } },
      dokumente: { orderBy: { hochgeladenAm: "desc" }, include: { kategorie: true } },
    },
  });

  if (!eigentuemer) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">
          {eigentuemer.anrede ? `${ANREDE_LABELS[eigentuemer.anrede]} ` : ""}
          {eigentuemer.name}
        </h1>
        <p className="text-sm text-zinc-500">
          {eigentuemer.email ?? "keine E-Mail"} {eigentuemer.telefon ? `- ${eigentuemer.telefon}` : ""}
        </p>
        {(eigentuemer.iban || eigentuemer.bankname) && (
          <p className="text-sm text-zinc-500">
            {eigentuemer.bankname ?? "-"} {eigentuemer.iban ? `- ${eigentuemer.iban}` : ""}
          </p>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-700">Einheiten</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {eigentuemer.einheiten.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Keine Einheiten zugeordnet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {eigentuemer.einheiten.map((zuordnung) => (
                <li key={zuordnung.einheitId} className="px-4 py-2 text-sm">
                  <Link
                    href={`/objekte/${zuordnung.einheit.objektId}`}
                    className="text-zinc-900 hover:underline"
                  >
                    {zuordnung.einheit.objekt.name} - {zuordnung.einheit.bezeichnung}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-700">Dokumente</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {eigentuemer.dokumente.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Noch keine Dokumente vorhanden.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {eigentuemer.dokumente.map((doc) => (
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
