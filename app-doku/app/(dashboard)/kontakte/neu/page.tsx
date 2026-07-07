import { prisma } from "@/lib/db";
import { createKontakt } from "@/lib/actions/kontakte";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { KONTAKT_TYP_LABELS, kontaktTypValues } from "@/lib/validation/kontakt";

export default async function NeuerKontaktPage({
  searchParams,
}: {
  searchParams: Promise<{ objektId?: string }>;
}) {
  const params = await searchParams;

  const objekte = await prisma.objekt.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Kontakt anlegen</h1>

      <form action={createKontakt} className="flex max-w-md flex-col gap-4">
        <Field label="Name" htmlFor="name" required>
          <input id="name" name="name" required className={inputClassName} />
        </Field>

        <Field label="Typ" htmlFor="typ" required>
          <select id="typ" name="typ" required className={inputClassName} defaultValue="">
            <option value="" disabled>
              Bitte waehlen
            </option>
            {kontaktTypValues.map((typ) => (
              <option key={typ} value={typ}>
                {KONTAKT_TYP_LABELS[typ]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="E-Mail (optional)" htmlFor="email">
          <input id="email" name="email" type="email" className={inputClassName} />
        </Field>

        <Field label="Telefon (optional)" htmlFor="telefon">
          <input id="telefon" name="telefon" className={inputClassName} />
        </Field>

        <Field label="Objekt (optional)" htmlFor="objektId">
          <select
            id="objektId"
            name="objektId"
            className={inputClassName}
            defaultValue={params.objektId ?? ""}
          >
            <option value="">Kein Objekt</option>
            {objekte.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        <Button type="submit">Anlegen</Button>
      </form>
    </div>
  );
}
