import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { templateSchemaSchema } from "@hgi/form-schema";
import { useAuth } from "../lib/auth";

const EXAMPLE_SCHEMA = {
  sections: [
    {
      id: "protokollinformationen",
      title: "Protokollinformationen",
      collapsible: true,
      fields: [
        { id: "datum", type: "datetime", label: "Datum", required: true, quickActions: ["captureCurrentTime"] },
        { id: "objekt", type: "reference", label: "Objekt", required: true, referenceKind: "property" },
      ],
    },
  ],
  repeatableGroups: [],
};

interface TemplateVersionDto {
  id: string;
  versionNumber: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  schema?: unknown;
}

interface TemplateDto {
  id: string;
  key: string;
  name: string;
  description: string | null;
  versions: TemplateVersionDto[];
}

export function TemplateEditorPage({ mode }: { mode: "create" | "edit" }) {
  const { apiClient, user } = useAuth();
  const params = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<TemplateDto | null>(null);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schemaText, setSchemaText] = useState(JSON.stringify(EXAMPLE_SCHEMA, null, 2));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (mode !== "edit" || !params.id) return;
    apiClient.templates.getById.query({ id: params.id }).then((t) => {
      setTemplate(t);
      setName(t.name);
      setDescription(t.description ?? "");
      const latest = t.versions[0];
      if (latest) setSchemaText(JSON.stringify(latest.schema, null, 2));
    });
  }, [apiClient, mode, params.id]);

  const latestVersion = template?.versions[0] ?? null;
  const isEditable = mode === "create" || latestVersion?.status === "DRAFT";

  const parsedSchemaResult = useMemo(() => {
    try {
      const json = JSON.parse(schemaText);
      const result = templateSchemaSchema.safeParse(json);
      if (!result.success) {
        return { ok: false as const, error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n") };
      }
      return { ok: true as const, value: result.data };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Ungültiges JSON" };
    }
  }, [schemaText]);

  async function handleCreate() {
    setSaveError(null);
    if (!parsedSchemaResult.ok) {
      setSaveError(parsedSchemaResult.error);
      return;
    }
    setIsSaving(true);
    try {
      const created = await apiClient.templates.create.mutate({
        key,
        name,
        description: description || undefined,
        schema: parsedSchemaResult.value,
      });
      navigate(`/templates/${created.id}/edit`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveDraft() {
    if (!template) return;
    setSaveError(null);
    if (!parsedSchemaResult.ok) {
      setSaveError(parsedSchemaResult.error);
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.templates.updateDraft.mutate({
        templateId: template.id,
        schema: parsedSchemaResult.value,
        name,
        description,
      });
      const refreshed = await apiClient.templates.getById.query({ id: template.id });
      setTemplate(refreshed);
      setNotice("Entwurf gespeichert.");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    if (!template) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await apiClient.templates.publish.mutate({ templateId: template.id });
      const refreshed = await apiClient.templates.getById.query({ id: template.id });
      setTemplate(refreshed);
      setNotice("Vorlage veröffentlicht.");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Veröffentlichen fehlgeschlagen");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStartNewVersion() {
    if (!template || !latestVersion) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await apiClient.templates.updateDraft.mutate({
        templateId: template.id,
        schema: latestVersion.schema,
      });
      const refreshed = await apiClient.templates.getById.query({ id: template.id });
      setTemplate(refreshed);
      const newLatest = refreshed.versions[0];
      if (newLatest) setSchemaText(JSON.stringify(newLatest.schema, null, 2));
      setNotice("Neue Entwurfs-Version angelegt — Änderungen wirken sich erst nach Veröffentlichen auf neue Protokolle aus.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isAdmin) {
    return <p>Nur Administratoren können Vorlagen bearbeiten.</p>;
  }

  return (
    <div>
      <h1>{mode === "create" ? "Neue Vorlage" : name || "Vorlage bearbeiten"}</h1>
      {latestVersion && (
        <p className="hint">
          Aktueller Stand: Version {latestVersion.versionNumber} · <span className={`badge ${latestVersion.status}`}>{latestVersion.status}</span>
          {latestVersion.status === "PUBLISHED" && " — veröffentlichte Versionen sind unveränderlich."}
        </p>
      )}
      {notice && <div className="card">{notice}</div>}

      <div className="card">
        <form className="stacked" onSubmit={(e) => e.preventDefault()}>
          {mode === "create" && (
            <label>
              Schlüssel (Slug)
              <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="uebergabeprotokoll" required />
            </label>
          )}
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Beschreibung
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </form>
      </div>

      <div className="card">
        <h2>Formular-Schema (Sections, Felder, Bestehend-aus-Unterformulare)</h2>
        {!isEditable && (
          <p className="hint">
            Diese Version ist veröffentlicht und unveränderlich.{" "}
            <button className="secondary" onClick={handleStartNewVersion} disabled={isSaving}>
              Neue Entwurfs-Version zum Bearbeiten anlegen
            </button>
          </p>
        )}
        <textarea
          className="schema-editor"
          value={schemaText}
          onChange={(e) => setSchemaText(e.target.value)}
          disabled={!isEditable}
          spellCheck={false}
        />
        {!parsedSchemaResult.ok && <div className="error-box">{parsedSchemaResult.error}</div>}
        {saveError && <div className="error-box">{saveError}</div>}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          {mode === "create" ? (
            <button onClick={handleCreate} disabled={isSaving || !key || !name}>
              Als Entwurf anlegen
            </button>
          ) : (
            isEditable && (
              <>
                <button className="secondary" onClick={handleSaveDraft} disabled={isSaving}>
                  Entwurf speichern
                </button>
                <button onClick={handlePublish} disabled={isSaving || !parsedSchemaResult.ok}>
                  Veröffentlichen
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
