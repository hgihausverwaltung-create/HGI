import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { deleteDokument } from "@/lib/actions/dokumente";
import { Button } from "@/components/ui/Button";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DokumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dokument = await prisma.dokument.findUnique({
    where: { id },
    include: {
      kategorie: true,
      objekt: true,
      einheit: true,
      eigentuemer: true,
      mieter: true,
      hochgeladenVon: true,
    },
  });

  if (!dokument) notFound();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{dokument.dateiname}</h1>
        <p className="text-sm text-zinc-500">
          {dokument.kategorie.name} - {formatBytes(dokument.dateigroesse)}
        </p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-zinc-500">Objekt</dt>
        <dd>
          <Link href={`/objekte/${dokument.objektId}`} className="text-zinc-900 hover:underline">
            {dokument.objekt.name}
          </Link>
        </dd>

        <dt className="text-zinc-500">Einheit</dt>
        <dd>{dokument.einheit?.bezeichnung ?? "-"}</dd>

        <dt className="text-zinc-500">Eigentuemer</dt>
        <dd>
          {dokument.eigentuemer ? (
            <Link href={`/eigentuemer/${dokument.eigentuemer.id}`} className="hover:underline">
              {dokument.eigentuemer.name}
            </Link>
          ) : (
            "-"
          )}
        </dd>

        <dt className="text-zinc-500">Mieter</dt>
        <dd>
          {dokument.mieter ? (
            <Link href={`/mieter/${dokument.mieter.id}`} className="hover:underline">
              {dokument.mieter.name}
            </Link>
          ) : (
            "-"
          )}
        </dd>

        <dt className="text-zinc-500">Hochgeladen von</dt>
        <dd>{dokument.hochgeladenVon.name}</dd>

        <dt className="text-zinc-500">Hochgeladen am</dt>
        <dd>{dokument.hochgeladenAm.toLocaleString("de-DE")}</dd>

        {dokument.beschreibung && (
          <>
            <dt className="text-zinc-500">Beschreibung</dt>
            <dd>{dokument.beschreibung}</dd>
          </>
        )}
      </dl>

      <div className="flex gap-3">
        <a href={`/api/documents/${dokument.id}/download`}>
          <Button>Herunterladen</Button>
        </a>
        <form action={deleteDokument}>
          <input type="hidden" name="id" value={dokument.id} />
          <Button type="submit" variant="danger">
            Loeschen
          </Button>
        </form>
      </div>
    </div>
  );
}
