import { Prisma } from "@/app/generated/prisma/client";

export function formatEuro(value: Prisma.Decimal | string | number): string {
  const n = value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}
