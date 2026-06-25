import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/abonnement")({
  head: () => ({ meta: [{ title: "Abonnement · FlowBudget AI" }] }),
  component: AbonnementPage,
});

const plans = [
  {
    name: "Gratuit",
    price: "0 €",
    features: ["50 dépenses/mois", "1 budget", "Analytics de base"],
  },
  {
    name: "Pro",
    price: "9 €",
    features: ["Dépenses illimitées", "Budgets illimités", "IA financière", "Rapports mensuels"],
    highlight: true,
  },
  {
    name: "Business",
    price: "29 €",
    features: ["Tout Pro", "Multi-utilisateurs", "Export comptable", "Support prioritaire"],
  },
];

function AbonnementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Abonnement</h1>
        <p className="text-muted-foreground mt-1">
          Plan actuel : <span className="font-medium text-foreground">Gratuit</span>
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl border p-6 bg-white relative ${p.highlight ? "border-foreground" : "border-border"}`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full bg-cta text-cta-foreground font-semibold">
                Populaire
              </span>
            )}
            <p className="text-sm text-muted-foreground">{p.name}</p>
            <p className="text-3xl font-semibold mt-2">
              {p.price}
              <span className="text-sm text-muted-foreground font-normal">/mois</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="size-4" /> {f}
                </li>
              ))}
            </ul>
            <button
              className={`mt-6 w-full rounded-full py-2.5 text-sm font-semibold ${p.highlight ? "bg-cta text-cta-foreground cta-glow" : "bg-foreground text-background"}`}
            >
              Choisir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
