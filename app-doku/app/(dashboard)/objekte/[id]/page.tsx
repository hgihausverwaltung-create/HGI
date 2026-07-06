import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createEinheit } from "@/lib/actions/einheiten";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default async function ObjektDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const objekt = await prisma.objekt.findUnique({
    where: { id },
    include: {
      einheiten: { orderBy: { bezeichnung: "asc" } },
      dokumente: { orderBy: { hochgeladenAm: "desc" }, include: { kategorie: true } },
    },
  });

  if (!objekt) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{objekt.name}</h1>
        <p className="text-sm text-zinc-500">
          {objekt.strasse}, {objekt.plz} {objekt.ort}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-700">Einheiten</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {objekt.einheiten.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Noch keine Einheiten vorhanden.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {objekt.einheiten.map((einheit) => (
                  <tr key={einheit.id} className="border-t border-zinc-100 first:border-t-0">
                    <td className="px-4 py-2">{einheit.bezeichnung}</td>
                    <td className="px-4 py-2 text-zinc-500">{einheit.typ ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form action={createEinheit} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="objektId" value={objekt.id} />
          <Field label="Neue Einheit" htmlFor="bezeichnung">
            <input
              id="bezeichnung"
              name="bezeichnung"
              placeholder="z. B. WE 3"
              required
              className={inputClassName}
            />
          </Field>
          <Field label="Typ" htmlFor="typ">
            <select id="typ" name="typ" className={inputClassName} defaultValue="">
              <option value="">-</option>
              <option value="WOHNUNG">Wohnung</option>
              <option value="GEWERBE">Gewerbe</option>
              <option value="STELLPLATZ">Stellplatz</option>
              <option value="SONSTIGES">Sonstiges</option>
            </select>
          </Field>
          <Button type="submit" variant="secondary">
            Einheit hinzufuegen
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-700">Dokumente</h2>
          <Link href={`/dokumente/neu?objektId=${objekt.id}`}>
            <Button variant="secondary">Dokument hochladen</Button>
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {objekt.dokumente.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Noch keine Dokumente vorhanden.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {objekt.dokumente.map((doc) => (
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
