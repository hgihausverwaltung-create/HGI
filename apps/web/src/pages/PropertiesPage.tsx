import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../lib/auth";

interface Unit {
  id: string;
  label: string;
  floor: string | null;
}

interface Property {
  id: string;
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  kind: string;
  units: Unit[];
}

export function PropertiesPage() {
  const { apiClient, user } = useAuth();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", street: "", houseNumber: "", postalCode: "", city: "" });
  const [unitLabels, setUnitLabels] = useState<Record<string, string>>({});
  const isAdmin = user?.role === "ADMIN";

  async function refresh() {
    const data = await apiClient.properties.list.query();
    setProperties(data);
  }

  useEffect(() => {
    refresh().catch(() => setError("Objekte konnten nicht geladen werden."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateProperty(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await apiClient.properties.create.mutate(form);
      setForm({ name: "", street: "", houseNumber: "", postalCode: "", city: "" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Anlegen fehlgeschlagen");
    }
  }

  async function handleAddUnit(propertyId: string) {
    const label = unitLabels[propertyId]?.trim();
    if (!label) return;
    await apiClient.properties.addUnit.mutate({ propertyId, label });
    setUnitLabels((prev) => ({ ...prev, [propertyId]: "" }));
    await refresh();
  }

  return (
    <div>
      <h1>Objekte &amp; Wohnungen</h1>
      {error && <div className="error-box">{error}</div>}

      {isAdmin && (
        <div className="card">
          <h2>Neues Objekt</h2>
          <form className="stacked" onSubmit={handleCreateProperty}>
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Straße
              <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
            </label>
            <label>
              Hausnummer
              <input value={form.houseNumber} onChange={(e) => setForm({ ...form, houseNumber: e.target.value })} required />
            </label>
            <label>
              PLZ
              <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required />
            </label>
            <label>
              Ort
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </label>
            <button type="submit">Anlegen</button>
          </form>
        </div>
      )}

      {!properties && <p>Lädt…</p>}
      {properties?.map((property) => (
        <div className="card" key={property.id}>
          <h3>
            {property.name} — {property.street} {property.houseNumber}, {property.postalCode} {property.city}
          </h3>
          <table>
            <thead>
              <tr>
                <th>Wohnung</th>
                <th>Etage</th>
              </tr>
            </thead>
            <tbody>
              {property.units.map((unit) => (
                <tr key={unit.id}>
                  <td>{unit.label}</td>
                  <td>{unit.floor ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {isAdmin && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <input
                placeholder="z.B. WE 4, 3. OG links"
                value={unitLabels[property.id] ?? ""}
                onChange={(e) => setUnitLabels((prev) => ({ ...prev, [property.id]: e.target.value }))}
              />
              <button className="secondary" onClick={() => handleAddUnit(property.id)}>
                Wohnung hinzufügen
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
