import { prisma } from "@/lib/db";
import { createEigentuemer } from "@/lib/actions/eigentuemer";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ANREDE_LABELS, anredeTypValues } from "@/lib/validation/anrede";

export default async function NeuerEigentuemerPage() {
  const einheiten = await prisma.einheit.findMany({
    orderBy: { bezeichnung: "asc" },
    include: { objekt: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Eigentuemer anlegen</h1>

      <form action={createEigentuemer} className="flex max-w-md flex-col gap-4">
        <Field label="Name" htmlFor="name" required>
          <input id="name" name="name" required className={inputClassName} />
        </Field>
        <Field label="Anrede (optional)" htmlFor="anrede">
          <select id="anrede" name="anrede" className={inputClassName} defaultValue="">
            <option value="">Keine Angabe</option>
            {anredeTypValues.map((a) => (
              <option key={a} value={a}>
                {ANREDE_LABELS[a]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="E-Mail" htmlFor="email">
          <input id="email" name="email" type="email" className={inputClassName} />
        </Field>
        <Field label="Telefon" htmlFor="telefon">
          <input id="telefon" name="telefon" className={inputClassName} />
        </Field>
        <Field label="IBAN (optional)" htmlFor="iban">
          <input id="iban" name="iban" className={inputClassName} />
        </Field>
        <Field label="Bankname (optional)" htmlFor="bankname">
          <input id="bankname" name="bankname" className={inputClassName} />
        </Field>
        <Field label="Einheit (optional)" htmlFor="einheitId">
          <select id="einheitId" name="einheitId" className={inputClassName} defaultValue="">
            <option value="">Keine Zuordnung</option>
            {einheiten.map((einheit) => (
              <option key={einheit.id} value={einheit.id}>
                {einheit.objekt.name} - {einheit.bezeichnung}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit">Anlegen</Button>
      </form>
    </div>
  );
}
