import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { SignOutButton } from "./SignOutButton";

export function AppShell({
  userName,
  children,
}: {
  userName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
          <span className="text-sm text-zinc-600">Angemeldet als {userName}</span>
          <SignOutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
