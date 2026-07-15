import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { inputClassName } from "@/components/ui/Field";
import {
  WIRTSCHAFTSPLAN_STATUS_LABELS,
  wirtschaftsplanStatusValues,
} from "@/lib/validation/wirtschaftsplan";

type SearchParams = {
  objektId?: string;
  wirtschaftsjahr?: string;
  status?: string;
};

export default async function WirtschaftsplaenePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.objektId) where.objektId = params.objektId;
  if (params.wirtschaftsjahr) where.wirtschaftsjahr = Number(params.wirtschaftsjahr);
  if (params.status) where.status = params.status;

  const [plaene, objekte] = await Promise.all([
    prisma.wirtschaftsplan.findMany({
      where,
      orderBy: { wirtschaftsjahr: "desc" },
      include: { objekt: true, _count: { select: { hausgeldSollPositionen: true } } },
    }),
    prisma.objekt.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Wirtschaftsplaene</h1>
        <Link href="/wirtschaftsplaene/neu">
          <Button>Wirtschaftsplan anlegen</Button>
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Objekt</label>
          <select name="objektId" defaultValue={params.objektId ?? ""} className={inputClassName}>
            <option value="">Alle</option>
            {objekte.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Wirtschaftsjahr</label>
          <input
            type="number"
            name="wirtschaftsjahr"
            defaultValue={params.wirtschaftsjahr}
            placeholder="z. B. 2026"
            className={inputClassName}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Status</label>
          <select name="status" defaultValue={params.status ?? ""} className={inputClassName}>
            <option value="">Alle</option>
            {wirtschaftsplanStatusValues.map((status) => (
              <option key={status} value={status}>
                {WIRTSCHAFTSPLAN_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Filtern
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {plaene.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Keine Wirtschaftsplaene gefunden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">Objekt</th>
                <th className="px-4 py-2 font-medium">Wirtschaftsjahr</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Positionen</th>
              </tr>
            </thead>
            <tbody>
              {plaene.map((plan) => (
                <tr key={plan.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">
                    <Link href={`/wirtschaftsplaene/${plan.id}`} className="text-zinc-900 hover:underline">
                      {plan.objekt.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{plan.wirtschaftsjahr}</td>
                  <td className="px-4 py-2 text-zinc-500">
                    {WIRTSCHAFTSPLAN_STATUS_LABELS[plan.status]}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{plan._count.hausgeldSollPositionen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
