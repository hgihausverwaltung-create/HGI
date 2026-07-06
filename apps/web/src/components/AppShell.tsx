import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <nav>
          <NavLink to="/" end>
            Vorlagen
          </NavLink>
          <NavLink to="/properties">Objekte</NavLink>
        </nav>
        <div>
          <span style={{ marginRight: "1rem" }}>
            {user?.name} ({user?.role})
          </span>
          <button className="secondary" onClick={logout}>
            Abmelden
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
