import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("E-Mail oder Passwort ist falsch.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-main" style={{ maxWidth: 360, marginTop: "4rem" }}>
      <h1>HGI Protokolle</h1>
      <form className="stacked card" onSubmit={handleSubmit}>
        <label>
          E-Mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Passwort
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <div className="error-box">{error}</div>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}
