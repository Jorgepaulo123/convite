import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPanel } from "@/components/AdminPanel";
import { isAdminLoggedIn, loginAdmin } from "@/lib/admin-auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Graduação Dra Kayan" },
      { name: "description", content: "Acesso ao painel de gestão." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(() => isAdminLoggedIn());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await loginAdmin(password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPassword("");
    setAuthed(true);
  };

  if (authed) {
    return <AdminPanel onLogout={() => setAuthed(false)} />;
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <ThemeToggle />
      <form onSubmit={submit} className="glass w-full max-w-sm rounded-3xl p-8 text-center">
        <p className="font-script text-gold-gradient text-5xl">Admin</p>
        <p className="mt-2 text-sm text-muted-foreground">Introduza a palavra-passe para abrir o painel.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="Palavra-passe"
          aria-label="Palavra-passe de admin"
          className="mt-6 w-full rounded-full border border-input bg-transparent px-5 py-3 text-center outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-gold-gradient mt-5 w-full rounded-full py-3 font-semibold text-primary-foreground shadow-gold disabled:opacity-50"
        >
          {loading ? "A verificar…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
