import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications · FlowBudget AI" }] }),
  component: () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Notifications</h1>
        <p className="text-muted-foreground mt-1">Toutes vos alertes financières.</p>
      </div>
      <div className="rounded-2xl bg-white border border-border p-12 text-center text-sm text-muted-foreground">
        <Bell className="size-8 mx-auto mb-3 text-muted-foreground" />
        Vous êtes à jour. Aucune notification.
      </div>
    </div>
  ),
});
