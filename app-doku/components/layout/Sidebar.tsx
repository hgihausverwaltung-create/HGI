import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/dokumente", label: "Dokumente" },
  { href: "/objekte", label: "Objekte" },
  { href: "/eigentuemer", label: "Eigentuemer" },
  { href: "/mieter", label: "Mieter" },
];

export function Sidebar() {
  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-zinc-200 bg-white p-4">
      <div className="mb-4 px-2 text-lg font-semibold text-zinc-900">HGI Dokumente</div>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
