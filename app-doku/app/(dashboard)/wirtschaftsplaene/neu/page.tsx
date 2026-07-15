import { prisma } from "@/lib/db";
import { createWirtschaftsplan } from "@/lib/actions/wirtschaftsplaene";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default async function NeuerWirtschaftsplanPage({
  searchParams,
}: {
  searchParams: Promise<{ objektId?: string }>;
}) {
  const params = await searchParams;

  const [objekte, versammlungen] = await Promise.all([
    prisma.objekt.findMany({ orderBy: { name: "asc" } }),
    prisma.versammlung.findMany({ orderBy: { datum: "desc" }, include: { objekt: true } }),
  ]);

  const naechstesJahr = new Date().getFullYear() + 1;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Wirtschaftsplan anlegen</h1>

      <form action={createWirtschaftsplan} className="flex max-w-md flex-col gap-4">
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

        <Field label="Wirtschaftsjahr" htmlFor="wirtschaftsjahr" required>
          <input
            id="wirtschaftsjahr"
            name="wirtschaftsjahr"
            type="number"
            required
            defaultValue={naechstesJahr}
            className={inputClassName}
          />
        </Field>

        <Field label="Versammlung (optional)" htmlFor="versammlungId">
          <select id="versammlungId" name="versammlungId" className={inputClassName} defaultValue="">
            <option value="">Keine Versammlung</option>
            {versammlungen.map((v) => (
              <option key={v.id} value={v.id}>
                {v.objekt.name} - {v.titel}
              </option>
            ))}
          </select>
        </Field>

        <Button type="submit">Anlegen</Button>
      </form>
    </div>
  );
}
