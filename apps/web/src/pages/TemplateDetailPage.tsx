import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth";

type DraftStatus = "DRAFT" | "PENDING_SEND" | "SENT" | "FAILED";

interface DraftListItem {
  id: string;
  title: string;
  status: DraftStatus;
  createdBy: { name: string };
  createdAt: string;
  sentAt: string | null;
}

interface TemplateDto {
  id: string;
  name: string;
  description: string | null;
  currentVersion: { versionNumber: number; status: string } | null;
}

const TABS = ["uebersicht", "entwuerfe", "gesendet"] as const;
type Tab = (typeof TABS)[number];

const STATUS_LABEL: Record<DraftStatus, string> = {
  DRAFT: "Entwurf",
  PENDING_SEND: "Wird gesendet…",
  SENT: "Gesendet",
  FAILED: "Fehlgeschlagen",
};

export function TemplateDetailPage() {
  const { apiClient, user } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<TemplateDto | null>(null);
  const [drafts, setDrafts] = useState<DraftListItem[] | null>(null);
  const [tab, setTab] = useState<Tab>("uebersicht");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const templateId = params.id!;

  async function refresh() {
    const [t, d] = await Promise.all([apiClient.templates.getById.query({ id: templateId }), apiClient.drafts.list.query({ templateId })]);
    setTemplate(t);
    setDrafts(d);
  }

  useEffect(() => {
    refresh().catch(() => setError("Vorlage konnte nicht geladen werden."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  async function handleNewDraft() {
    setError(null);
    setIsCreating(true);
    try {
      const draft = await apiClient.drafts.create.mutate({ templateId });
      navigate(`/drafts/${draft.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Entwurf konnte nicht angelegt werden.");
    } finally {
      setIsCreating(false);
    }
  }

  if (!template || !drafts) return <p>Lädt…</p>;

  const openDrafts = drafts.filter((d) => d.status !== "SENT");
  const sentDrafts = drafts.filter((d) => d.status === "SENT");
  const canFill = !!template.currentVersion && template.currentVersion.status === "PUBLISHED";

  return (
    <div>
      <h1>{template.name}</h1>
      {template.description && <p className="hint">{template.description}</p>}
      {user?.role === "ADMIN" && (
        <p>
          <Link to={`/templates/${templateId}/edit`}>Vorlage bearbeiten</Link>
        </p>
      )}
      {error && <div className="error-box">{error}</div>}

      <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid #ddd", marginBottom: "1rem" }}>
        {TABS.map((t) => (
          <button
            key={t}
            className={t === tab ? "" : "secondary"}
            style={{ borderRadius: 0, background: "none", color: t === tab ? "#b3182c" : "#666", padding: "0.5rem 0", borderBottom: t === tab ? "2px solid #b3182c" : "none" }}
            onClick={() => setTab(t)}
          >
            {t === "uebersicht" ? "Übersicht" : t === "entwuerfe" ? `Entwürfe (${openDrafts.length})` : `Gesendet (${sentDrafts.length})`}
          </button>
        ))}
      </div>

      {!canFill && <div className="card">Diese Vorlage hat noch keine veröffentlichte Version und kann noch nicht ausgefüllt werden.</div>}

      {tab === "uebersicht" && (
        <div className="card">
          <h2>{template.name}</h2>
          {canFill && (
            <button onClick={handleNewDraft} disabled={isCreating}>
              + Neuer Entwurf
            </button>
          )}
        </div>
      )}

      {tab === "entwuerfe" && <DraftTable drafts={openDrafts} emptyText="Keine Entwürfe vorhanden." />}
      {tab === "gesendet" && <DraftTable drafts={sentDrafts} emptyText="Noch nichts gesendet." />}
    </div>
  );
}

function DraftTable({ drafts, emptyText }: { drafts: DraftListItem[]; emptyText: string }) {
  if (drafts.length === 0) return <p className="hint">{emptyText}</p>;
  return (
    <table>
      <thead>
        <tr>
          <th>Titel</th>
          <th>Status</th>
          <th>Erstellt von</th>
        </tr>
      </thead>
      <tbody>
        {drafts.map((d) => (
          <tr key={d.id}>
            <td>
              <Link to={`/drafts/${d.id}`}>{d.title}</Link>
            </td>
            <td>
              <span className={`badge ${d.status === "SENT" ? "PUBLISHED" : d.status === "FAILED" ? "" : "DRAFT"}`}>{STATUS_LABEL[d.status]}</span>
            </td>
            <td>{d.createdBy.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
