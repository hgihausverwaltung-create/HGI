import { prisma } from "@/lib/db";
import { uploadDokument } from "@/lib/actions/dokumente";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default async function DokumentHochladenPage({
  searchParams,
}: {
  searchParams: Promise<{ objektId?: string }>;
}) {
  const params = await searchParams;

  const [kategorien, objekte, einheiten, eigentuemer, mieter] = await Promise.all([
    prisma.dokumentKategorie.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.objekt.findMany({ orderBy: { name: "asc" } }),
    prisma.einheit.findMany({ orderBy: { bezeichnung: "asc" }, include: { objekt: true } }),
    prisma.eigentuemer.findMany({ orderBy: { name: "asc" } }),
    prisma.mieter.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Dokument hochladen</h1>

      <form
        action={uploadDokument}
        encType="multipart/form-data"
        className="flex max-w-md flex-col gap-4"
      >
        <Field label="Datei" htmlFor="datei" required>
          <input id="datei" name="datei" type="file" required className={inputClassName} />
        </Field>

        <Field label="Kategorie" htmlFor="kategorieId" required>
          <select id="kategorieId" name="kategorieId" required className={inputClassName} defaultValue="">
            <option value="" disabled>
              Bitte waehlen
            </option>
            {kategorien.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
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

        <Field label="Einheit (optional)" htmlFor="einheitId">
          <select id="einheitId" name="einheitId" className={inputClassName} defaultValue="">
            <option value="">Keine</option>
            {einheiten.map((einheit) => (
              <option key={einheit.id} value={einheit.id}>
                {einheit.objekt.name} - {einheit.bezeichnung}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Eigentuemer (optional)" htmlFor="eigentuemerId">
          <select id="eigentuemerId" name="eigentuemerId" className={inputClassName} defaultValue="">
            <option value="">Keiner</option>
            {eigentuemer.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mieter (optional)" htmlFor="mieterId">
          <select id="mieterId" name="mieterId" className={inputClassName} defaultValue="">
            <option value="">Keiner</option>
            {mieter.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Beschreibung (optional)" htmlFor="beschreibung">
          <textarea id="beschreibung" name="beschreibung" rows={3} className={inputClassName} />
        </Field>

        <Button type="submit">Hochladen</Button>
      </form>
    </div>
  );
}
