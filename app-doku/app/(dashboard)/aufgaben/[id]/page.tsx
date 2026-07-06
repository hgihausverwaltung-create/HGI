import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateAufgabeStatus, deleteAufgabe } from "@/lib/actions/aufgaben";
import { Button } from "@/components/ui/Button";
import { inputClassName } from "@/components/ui/Field";
import {
  AUFGABE_STATUS_LABELS,
  AUFGABE_PRIORITAET_LABELS,
  aufgabeStatusValues,
} from "@/lib/validation/aufgabe";

export default async function AufgabeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const aufgabe = await prisma.aufgabe.findUnique({
    where: { id },
    include: { objekt: true, dokument: true, erstelltVon: true },
  });

  if (!aufgabe) notFound();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{aufgabe.titel}</h1>
        <p className="text-sm text-zinc-500">
          {AUFGABE_STATUS_LABELS[aufgabe.status]} - {AUFGABE_PRIORITAET_LABELS[aufgabe.prioritaet]}
        </p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {aufgabe.beschreibung && (
          <>
            <dt className="text-zinc-500">Beschreibung</dt>
            <dd>{aufgabe.beschreibung}</dd>
          </>
        )}

        <dt className="text-zinc-500">Faellig am</dt>
        <dd>{aufgabe.faelligkeitsdatum ? aufgabe.faelligkeitsdatum.toLocaleDateString("de-DE") : "-"}</dd>

        <dt className="text-zinc-500">Objekt</dt>
        <dd>
          {aufgabe.objekt ? (
            <Link href={`/objekte/${aufgabe.objekt.id}`} className="text-zinc-900 hover:underline">
              {aufgabe.objekt.name}
            </Link>
          ) : (
            "-"
          )}
        </dd>

        <dt className="text-zinc-500">Dokument</dt>
        <dd>
          {aufgabe.dokument ? (
            <Link href={`/dokumente/${aufgabe.dokument.id}`} className="hover:underline">
              {aufgabe.dokument.dateiname}
            </Link>
          ) : (
            "-"
          )}
        </dd>

        <dt className="text-zinc-500">Erstellt von</dt>
        <dd>{aufgabe.erstelltVon.name}</dd>

        <dt className="text-zinc-500">Erstellt am</dt>
        <dd>{aufgabe.createdAt.toLocaleString("de-DE")}</dd>
      </dl>

      <div className="flex flex-wrap items-end gap-3">
        <form action={updateAufgabeStatus} className="flex items-end gap-3">
          <input type="hidden" name="id" value={aufgabe.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-sm font-medium text-zinc-700">
              Status
            </label>
            <select id="status" name="status" defaultValue={aufgabe.status} className={inputClassName}>
              {aufgabeStatusValues.map((status) => (
                <option key={status} value={status}>
                  {AUFGABE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Speichern
          </Button>
        </form>

        <form action={deleteAufgabe}>
          <input type="hidden" name="id" value={aufgabe.id} />
          <Button type="submit" variant="danger">
            Loeschen
          </Button>
        </form>
      </div>
    </div>
  );
}
