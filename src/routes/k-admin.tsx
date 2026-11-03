import { createFileRoute, redirect } from "@tanstack/react-router";

/** Rota antiga — redireciona para /admin */
export const Route = createFileRoute("/k-admin")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
  component: () => null,
});
