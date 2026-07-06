import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

interface TemplateListItem {
  id: string;
  name: string;
  icon: string | null;
  currentVersion: { status: string; versionNumber: number } | null;
}

export function TemplatesHomePage() {
  const { apiClient, user } = useAuth();
  const [templates, setTemplates] = useState<TemplateListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.templates.list
      .query()
      .then((data) => setTemplates(data))
      .catch(() => setError("Vorlagen konnten nicht geladen werden."));
  }, [apiClient]);

  return (
    <div>
      <h1>Meine Vorlagen</h1>
      <p className="hint">Ersatz für smaps — Formular-Vorlagen für Protokolle wie Übergabe, Abnahme, Objektbegehung.</p>
      {error && <div className="error-box">{error}</div>}
      {!templates && !error && <p>Lädt…</p>}
      {templates && (
        <div className="tile-grid">
          {user?.role === "ADMIN" && (
            <Link to="/templates/new" className="tile new-tile" title="Neue Vorlage anlegen">
              +
            </Link>
          )}
          {templates.map((t) => (
            <Link key={t.id} to={`/templates/${t.id}`} className="tile">
              <div style={{ fontSize: "1.5rem" }}>📄</div>
              <div>{t.name}</div>
              {t.currentVersion ? (
                <span className={`badge ${t.currentVersion.status}`}>
                  v{t.currentVersion.versionNumber} · {t.currentVersion.status}
                </span>
              ) : (
                <span className="badge">kein Entwurf veröffentlicht</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
