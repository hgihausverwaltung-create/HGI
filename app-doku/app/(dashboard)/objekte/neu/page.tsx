import { createObjekt } from "@/lib/actions/objekte";
import { Field, inputClassName } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function NeuesObjektPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Objekt anlegen</h1>

      <form action={createObjekt} className="flex max-w-md flex-col gap-4">
        <Field label="Name" htmlFor="name" required>
          <input id="name" name="name" required className={inputClassName} />
        </Field>
        <Field label="Strasse" htmlFor="strasse" required>
          <input id="strasse" name="strasse" required className={inputClassName} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="PLZ" htmlFor="plz" required>
            <input id="plz" name="plz" required className={inputClassName} />
          </Field>
          <Field label="Ort" htmlFor="ort" required>
            <input id="ort" name="ort" required className={inputClassName} />
          </Field>
        </div>
        <Button type="submit">Anlegen</Button>
      </form>
    </div>
  );
}
