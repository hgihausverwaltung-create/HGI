import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateVersammlungStatus, updateVersammlungDokument } from "@/lib/actions/versammlungen";
import { createTagesordnungspunkt, updateTagesordnungspunktErgebnis } from "@/lib/actions/tagesordnungspunkte";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { VERSAMMLUNG_STATUS_LABELS, versammlungStatusValues } from "@/lib/validation/versammlung";
import {
  TAGESORDNUNGS_ERGEBNIS_LABELS,
  tagesordnungsErgebnisValues,
} from "@/lib/validation/tagesordnungspunkt";

export default async function VersammlungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const versammlung = await prisma.versammlung.findUnique({
    where: { id },
    include: {
      objekt: true,
      dokument: true,
      tagesordnungspunkte: { orderBy: { reihenfolge: "asc" } },
    },
  });

  if (!versammlung) notFound();

  const dokumente = await prisma.dokument.findMany({
    where: { objektId: versammlung.objektId },
    orderBy: { dateiname: "asc" },
  });

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{versammlung.titel}</h1>
        <p className="text-sm text-zinc-500">{VERSAMMLUNG_STATUS_LABELS[versammlung.status]}</p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-zinc-500">Objekt</dt>
        <dd>
          <Link href={`/objekte/${versammlung.objekt.id}`} className="text-zinc-900 hover:underline">
            {versammlung.objekt.name}
          </Link>
        </dd>

        <dt className="text-zinc-500">Datum</dt>
        <dd>{versammlung.datum.toLocaleDateString("de-DE")}</dd>

        <dt className="text-zinc-500">Einladungsdatum</dt>
        <dd>
          {versammlung.einladungsdatum
            ? versammlung.einladungsdatum.toLocaleDateString("de-DE")
            : "-"}
        </dd>

        <dt className="text-zinc-500">Protokoll</dt>
        <dd>
          {versammlung.dokument ? (
            <Link href={`/dokumente/${versammlung.dokument.id}`} className="hover:underline">
              {versammlung.dokument.dateiname}
            </Link>
          ) : (
            "Kein Dokument verknuepft"
          )}
        </dd>
      </dl>

      <div className="flex flex-wrap items-end gap-6">
        <form action={updateVersammlungStatus} className="flex items-end gap-3">
          <input type="hidden" name="id" value={versammlung.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-sm font-medium text-zinc-700">
              Status
            </label>
            <select id="status" name="status" defaultValue={versammlung.status} className={inputClassName}>
              {versammlungStatusValues.map((status) => (
                <option key={status} value={status}>
                  {VERSAMMLUNG_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Speichern
          </Button>
        </form>

        <form action={updateVersammlungDokument} className="flex items-end gap-3">
          <input type="hidden" name="id" value={versammlung.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor="dokumentId" className="text-sm font-medium text-zinc-700">
              Protokoll-Dokument
            </label>
            <select
              id="dokumentId"
              name="dokumentId"
              defaultValue={versammlung.dokumentId ?? ""}
              className={inputClassName}
            >
              <option value="">Kein Dokument</option>
              {dokumente.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.dateiname}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Speichern
          </Button>
        </form>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-700">Tagesordnung</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {versammlung.tagesordnungspunkte.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Noch keine Tagesordnungspunkte vorhanden.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500">
                  <th className="px-4 py-2 font-medium">Nr.</th>
                  <th className="px-4 py-2 font-medium">Titel</th>
                  <th className="px-4 py-2 font-medium">Beschlussvorschlag</th>
                  <th className="px-4 py-2 font-medium">Ergebnis</th>
                </tr>
              </thead>
              <tbody>
                {versammlung.tagesordnungspunkte.map((top) => (
                  <tr key={top.id} className="border-t border-zinc-100">
                    <td className="px-4 py-2 text-zinc-500">{top.reihenfolge}</td>
                    <td className="px-4 py-2">{top.titel}</td>
                    <td className="px-4 py-2 text-zinc-500">{top.beschlussvorschlag ?? "-"}</td>
                    <td className="px-4 py-2">
                      <form action={updateTagesordnungspunktErgebnis} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={top.id} />
                        <input type="hidden" name="versammlungId" value={versammlung.id} />
                        <select
                          name="ergebnis"
                          defaultValue={top.ergebnis ?? ""}
                          className={inputClassName}
                        >
                          {!top.ergebnis && <option value="">-</option>}
                          {tagesordnungsErgebnisValues.map((ergebnis) => (
                            <option key={ergebnis} value={ergebnis}>
                              {TAGESORDNUNGS_ERGEBNIS_LABELS[ergebnis]}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" variant="secondary">
                          Speichern
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form action={createTagesordnungspunkt} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="versammlungId" value={versammlung.id} />
          <Field label="Neuer Tagesordnungspunkt" htmlFor="top-titel">
            <input id="top-titel" name="titel" required className={inputClassName} />
          </Field>
          <Field label="Beschreibung (optional)" htmlFor="top-beschreibung">
            <input id="top-beschreibung" name="beschreibung" className={inputClassName} />
          </Field>
          <Field label="Beschlussvorschlag (optional)" htmlFor="top-beschlussvorschlag">
            <input id="top-beschlussvorschlag" name="beschlussvorschlag" className={inputClassName} />
          </Field>
          <Button type="submit" variant="secondary">
            Hinzufuegen
          </Button>
        </form>
      </section>
    </div>
  );
}
