import { createFileRoute, redirect } from "@tanstack/react-router";
import { validateC } from "@/components/SubPage";

export const Route = createFileRoute("/convite_/bebidas")({
  validateSearch: validateC,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/catalogo", search: { c: search.c } });
  },
  component: () => null,
});
