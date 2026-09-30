import { prisma } from "@/lib/db";
import { createVersammlung } from "@/lib/actions/versammlungen";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default async function NeueVersammlungPage({
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
      <h1 className="text-xl font-semibold text-zinc-900">Versammlung anlegen</h1>

      <form action={createVersammlung} className="flex max-w-md flex-col gap-4">
        <Field label="Titel" htmlFor="titel" required>
          <input id="titel" name="titel" required className={inputClassName} />
        </Field>

        <Field label="Datum" htmlFor="datum" required>
          <input id="datum" name="datum" type="date" required className={inputClassName} />
        </Field>

        <Field label="Einladungsdatum (optional)" htmlFor="einladungsdatum">
          <input id="einladungsdatum" name="einladungsdatum" type="date" className={inputClassName} />
        </Field>

        <Field label="Objekt" htmlFor="objektId" required>
          <select
            id="objektId"
            name="objektId"
            required
            className={inputClassName}
            defaultValue={params.objektId ?? ""}
          >
            <option value="" disabled>
              Bitte waehlen
            </option>
            {objekte.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Protokoll-Dokument (optional)" htmlFor="dokumentId">
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
