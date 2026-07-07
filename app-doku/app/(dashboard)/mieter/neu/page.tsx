import { prisma } from "@/lib/db";
import { createMieter } from "@/lib/actions/mieter";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ANREDE_LABELS, anredeTypValues } from "@/lib/validation/anrede";

export default async function NeuerMieterPage() {
  const einheiten = await prisma.einheit.findMany({
    orderBy: { bezeichnung: "asc" },
    include: { objekt: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Mieter anlegen</h1>

      <form action={createMieter} className="flex max-w-md flex-col gap-4">
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
        <Field label="Einheit" htmlFor="einheitId" required>
          <select id="einheitId" name="einheitId" required className={inputClassName} defaultValue="">
            <option value="" disabled>
              Bitte waehlen
            </option>
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
