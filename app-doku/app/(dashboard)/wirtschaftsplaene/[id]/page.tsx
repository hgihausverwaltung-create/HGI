import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  updateWirtschaftsplanStatus,
  updateWirtschaftsplanVersammlung,
} from "@/lib/actions/wirtschaftsplaene";
import { createHausgeldSoll } from "@/lib/actions/hausgeldSoll";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatEuro } from "@/lib/format";
import {
  WIRTSCHAFTSPLAN_STATUS_LABELS,
  wirtschaftsplanStatusValues,
} from "@/lib/validation/wirtschaftsplan";

// Ist-Betraege/Zahlungsabgleich/Jahresabrechnung sind bewusst kein Teil dieses Grundgeruests.
export default async function WirtschaftsplanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const plan = await prisma.wirtschaftsplan.findUnique({
    where: { id },
    include: {
      objekt: { include: { einheiten: { orderBy: { bezeichnung: "asc" } } } },
      versammlung: true,
      hausgeldSollPositionen: {
        include: { einheit: true },
        orderBy: { einheit: { bezeichnung: "asc" } },
      },
    },
  });

  if (!plan) notFound();

  const versammlungen = await prisma.versammlung.findMany({
    orderBy: { datum: "desc" },
    include: { objekt: true },
  });

  const erfassteEinheitIds = new Set(plan.hausgeldSollPositionen.map((p) => p.einheitId));
  const verfuegbareEinheiten = plan.objekt.einheiten.filter((e) => !erfassteEinheitIds.has(e.id));

  const summe = plan.hausgeldSollPositionen.reduce(
    (sum, p) => sum.plus(p.betragMonatlich),
    new Prisma.Decimal(0)
  );

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">
          {plan.objekt.name} - Wirtschaftsjahr {plan.wirtschaftsjahr}
        </h1>
        <p className="text-sm text-zinc-500">{WIRTSCHAFTSPLAN_STATUS_LABELS[plan.status]}</p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-zinc-500">Objekt</dt>
        <dd>
          <Link href={`/objekte/${plan.objekt.id}`} className="text-zinc-900 hover:underline">
            {plan.objekt.name}
          </Link>
        </dd>

        <dt className="text-zinc-500">Versammlung</dt>
        <dd>
          {plan.versammlung ? (
            <Link href={`/versammlungen/${plan.versammlung.id}`} className="hover:underline">
              {plan.versammlung.titel}
            </Link>
          ) : (
            "Keine Versammlung verknuepft"
          )}
        </dd>
      </dl>

      <div className="flex flex-wrap items-end gap-6">
        <form action={updateWirtschaftsplanStatus} className="flex items-end gap-3">
          <input type="hidden" name="id" value={plan.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-sm font-medium text-zinc-700">
              Status
            </label>
            <select id="status" name="status" defaultValue={plan.status} className={inputClassName}>
              {wirtschaftsplanStatusValues.map((status) => (
                <option key={status} value={status}>
                  {WIRTSCHAFTSPLAN_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Speichern
          </Button>
        </form>

        <form action={updateWirtschaftsplanVersammlung} className="flex items-end gap-3">
          <input type="hidden" name="id" value={plan.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor="versammlungId" className="text-sm font-medium text-zinc-700">
              Versammlung
            </label>
            <select
              id="versammlungId"
              name="versammlungId"
              defaultValue={plan.versammlungId ?? ""}
              className={inputClassName}
            >
              <option value="">Keine Versammlung</option>
              {versammlungen.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.objekt.name} - {v.titel}
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
        <h2 className="text-sm font-medium text-zinc-700">Hausgeld-Sollbetraege</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {plan.hausgeldSollPositionen.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Noch keine Positionen vorhanden.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {plan.hausgeldSollPositionen.map((position) => (
                  <tr key={position.id} className="border-t border-zinc-100 first:border-t-0">
                    <td className="px-4 py-2">{position.einheit.bezeichnung}</td>
                    <td className="px-4 py-2 text-zinc-500">{formatEuro(position.betragMonatlich)}</td>
                  </tr>
                ))}
                <tr className="border-t border-zinc-200 font-medium">
                  <td className="px-4 py-2">Summe</td>
                  <td className="px-4 py-2">{formatEuro(summe)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {verfuegbareEinheiten.length === 0 ? (
          <p className="text-sm text-zinc-500">Alle Einheiten sind bereits erfasst.</p>
        ) : (
          <form action={createHausgeldSoll} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="wirtschaftsplanId" value={plan.id} />
            <Field label="Einheit" htmlFor="einheitId" required>
              <select id="einheitId" name="einheitId" required className={inputClassName} defaultValue="">
                <option value="" disabled>
                  Bitte waehlen
                </option>
                {verfuegbareEinheiten.map((einheit) => (
                  <option key={einheit.id} value={einheit.id}>
                    {einheit.bezeichnung}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Betrag monatlich (EUR)" htmlFor="betragMonatlich" required>
              <input
                id="betragMonatlich"
                name="betragMonatlich"
                type="number"
                step="0.01"
                min="0"
                required
                className={inputClassName}
              />
            </Field>
            <Button type="submit" variant="secondary">
              Hinzufuegen
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
