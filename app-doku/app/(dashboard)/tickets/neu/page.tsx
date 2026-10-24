import { prisma } from "@/lib/db";
import { createTicket } from "@/lib/actions/tickets";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  TICKET_KATEGORIE_LABELS,
  TICKET_PRIORITAET_LABELS,
  ticketKategorieValues,
  ticketPrioritaetValues,
} from "@/lib/validation/ticket";

export default async function NeuesTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ objektId?: string }>;
}) {
  const params = await searchParams;

  const [objekte, einheiten, mieter, eigentuemer, mitarbeiter] = await Promise.all([
    prisma.objekt.findMany({ orderBy: { name: "asc" } }),
    prisma.einheit.findMany({ orderBy: { bezeichnung: "asc" }, include: { objekt: true } }),
    prisma.mieter.findMany({ orderBy: { name: "asc" }, include: { einheit: { include: { objekt: true } } } }),
    prisma.eigentuemer.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Ticket anlegen</h1>

      <form action={createTicket} className="flex max-w-md flex-col gap-4">
        <Field label="Titel" htmlFor="titel" required>
          <input id="titel" name="titel" required className={inputClassName} />
        </Field>

        <Field label="Beschreibung" htmlFor="beschreibung">
          <textarea id="beschreibung" name="beschreibung" rows={4} className={inputClassName} />
        </Field>

        <Field label="Kategorie" htmlFor="kategorie" required>
          <select id="kategorie" name="kategorie" required className={inputClassName} defaultValue="SONSTIGES">
            {ticketKategorieValues.map((kategorie) => (
              <option key={kategorie} value={kategorie}>
                {TICKET_KATEGORIE_LABELS[kategorie]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Prioritaet" htmlFor="prioritaet" required>
          <select id="prioritaet" name="prioritaet" required className={inputClassName} defaultValue="NORMAL">
            {ticketPrioritaetValues.map((prioritaet) => (
              <option key={prioritaet} value={prioritaet}>
                {TICKET_PRIORITAET_LABELS[prioritaet]}
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
            <option value="">Keine Einheit</option>
            {einheiten.map((einheit) => (
              <option key={einheit.id} value={einheit.id}>
                {einheit.objekt.name} - {einheit.bezeichnung}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mieter/Melder (optional)" htmlFor="mieterId">
          <select id="mieterId" name="mieterId" className={inputClassName} defaultValue="">
            <option value="">Kein Mieter</option>
            {mieter.map((m) => (
              <option key={m.id} value={m.id}>
                {m.einheit.objekt.name} - {m.einheit.bezeichnung} - {m.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Eigentuemer/Melder (optional)" htmlFor="eigentuemerId">
          <select id="eigentuemerId" name="eigentuemerId" className={inputClassName} defaultValue="">
            <option value="">Kein Eigentuemer</option>
            {eigentuemer.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Zugewiesen an (optional)" htmlFor="zugewiesenAnId">
          <select id="zugewiesenAnId" name="zugewiesenAnId" className={inputClassName} defaultValue="">
            <option value="">Niemand</option>
            {mitarbeiter.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </Field>

        <Button type="submit">Anlegen</Button>
      </form>
    </div>
  );
}
