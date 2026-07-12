"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, inputClassName } from "@/components/ui/Field";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-Mail oder Passwort ist falsch.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-zinc-900">HGI Dokumentenverwaltung</h1>

        <Field label="E-Mail" htmlFor="email" required>
          <input id="email" name="email" type="email" required className={inputClassName} />
        </Field>

        <Field label="Passwort" htmlFor="password" required>
          <input
            id="password"
            name="password"
            type="password"
            required
            className={inputClassName}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Anmelden..." : "Anmelden"}
        </Button>
      </form>
    </div>
  );
}
