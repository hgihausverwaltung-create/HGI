import { prisma } from "@/lib/db";
import { createAufgabe } from "@/lib/actions/aufgaben";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AUFGABE_PRIORITAET_LABELS, aufgabePrioritaetValues } from "@/lib/validation/aufgabe";

export default async function NeueAufgabePage({
  searchParams,
}: {
  searchParams: Promise<{ objektId?: string }>;
}) {
  const params = await searchParams;

  const [objekte, dokumente] = await Promise.all([
    prisma.objekt.findMany({ orderBy: { name: "asc" } }),
    prisma.dokument.findMany({ orderBy: { dateiname: "asc" }, include: { objekt: true } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Aufgabe anlegen</h1>

      <form action={createAufgabe} className="flex max-w-md flex-col gap-4">
        <Field label="Titel" htmlFor="titel" required>
          <input id="titel" name="titel" required className={inputClassName} />
        </Field>

        <Field label="Beschreibung (optional)" htmlFor="beschreibung">
          <textarea id="beschreibung" name="beschreibung" rows={3} className={inputClassName} />
        </Field>

        <Field label="Prioritaet" htmlFor="prioritaet" required>
          <select id="prioritaet" name="prioritaet" required className={inputClassName} defaultValue="MITTEL">
            {aufgabePrioritaetValues.map((p) => (
              <option key={p} value={p}>
                {AUFGABE_PRIORITAET_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Faelligkeitsdatum (optional)" htmlFor="faelligkeitsdatum">
          <input
            id="faelligkeitsdatum"
            name="faelligkeitsdatum"
            type="date"
            className={inputClassName}
          />
        </Field>

        <Field label="Objekt (optional)" htmlFor="objektId">
          <select id="objektId" name="objektId" className={inputClassName} defaultValue={params.objektId ?? ""}>
            <option value="">Kein Objekt</option>
            {objekte.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Dokument (optional)" htmlFor="dokumentId">
          <select id="dokumentId" name="dokumentId" className={inputClassName} defaultValue="">
            <option value="">Kein Dokument</option>
            {dokumente.map((d) => (
              <option key={d.id} value={d.id}>
                {d.objekt.name} - {d.dateiname}
              </option>
            ))}
          </select>
        </Field>

        <Button type="submit">Anlegen</Button>
      </form>
    </div>
  );
}
