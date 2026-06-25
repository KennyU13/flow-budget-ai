import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({ meta: [{ title: "Paramètres · FlowBudget AI" }] }),
  component: () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Personnalisez votre expérience FlowBudget AI.</p>
      </div>
      <div className="rounded-2xl bg-white border border-border divide-y divide-border">
        <Row title="Langue" value="Français" />
        <Row title="Devise" value="MGA (Ariary)" />
        <Row title="Notifications email" value="Activées" />
        <Row title="Thème" value="Clair" />
      </div>
    </div>
  ),
});

function Row({ title, value }: { title: string; value: string }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <span className="font-medium">{title}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}
