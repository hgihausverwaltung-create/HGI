import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { KONTAKT_TYP_LABELS } from "@/lib/validation/kontakt";

export default async function KontaktDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const kontakt = await prisma.kontakt.findUnique({
    where: { id },
    include: { objekt: true },
  });

  if (!kontakt) notFound();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{kontakt.name}</h1>
        <p className="text-sm text-zinc-500">{KONTAKT_TYP_LABELS[kontakt.typ]}</p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-zinc-500">E-Mail</dt>
        <dd>{kontakt.email ?? "-"}</dd>

        <dt className="text-zinc-500">Telefon</dt>
        <dd>{kontakt.telefon ?? "-"}</dd>

        <dt className="text-zinc-500">Objekt</dt>
        <dd>
          {kontakt.objekt ? (
            <Link href={`/objekte/${kontakt.objekt.id}`} className="text-zinc-900 hover:underline">
              {kontakt.objekt.name}
            </Link>
          ) : (
            "Kein Objekt zugeordnet"
          )}
        </dd>
      </dl>
    </div>
  );
}
