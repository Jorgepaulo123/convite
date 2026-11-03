import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function SubPage({ title, c, children }: { title: string; c?: string | undefined; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-md px-6 pb-16 pt-6 text-center">
      <ThemeToggle />
      <Link to="/convite" search={{ c }} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-primary">
        <ArrowLeft size={16} /> Voltar ao convite
      </Link>
      <h1 className="font-script text-gold-gradient mt-8 text-6xl">{title}</h1>
      <div className="mx-auto my-4 h-px w-24 bg-gold-gradient" />
      {children}
    </main>
  );
}

export const validateC = (s: Record<string, unknown>): { c?: string | undefined } => ({
  c: typeof s["c"] === "string" ? (s["c"] as string) : undefined,
});
