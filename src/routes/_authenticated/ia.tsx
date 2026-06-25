import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Sparkles, TrendingDown, AlertCircle, Target } from "lucide-react";
import { expensesQuery, budgetsQuery, fmtMGA } from "@/lib/expenses.queries";

export const Route = createFileRoute("/_authenticated/ia")({
  head: () => ({ meta: [{ title: "IA Financière · FlowBudget AI" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(expensesQuery),
      context.queryClient.ensureQueryData(budgetsQuery),
    ]),
  component: IAPage,
});

function IAPage() {
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const { data: budgets } = useSuspenseQuery(budgetsQuery);
  const insights: Array<{ icon: typeof Sparkles; title: string; desc: string }> = [];

  const catMap = new Map<string, number>();
  expenses.forEach((e) => catMap.set(e.category, (catMap.get(e.category) || 0) + Number(e.amount)));
  const top = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    insights.push({
      icon: Target,
      title: `Votre principale catégorie : ${top[0]}`,
      desc: `Elle représente ${fmtMGA(top[1])} de vos dépenses totales. Identifiez 1 à 2 leviers d'optimisation.`,
    });
  }

  const now = new Date();
  const spent = new Map<string, number>();
  expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .forEach((e) => spent.set(e.category, (spent.get(e.category) || 0) + Number(e.amount)));
  budgets.forEach((b) => {
    const s = spent.get(b.category) || 0;
    if (s > Number(b.monthly_limit)) {
      insights.push({
        icon: AlertCircle,
        title: `Budget « ${b.category} » dépassé`,
        desc: `Vous avez dépensé ${fmtMGA(s)} pour une limite de ${fmtMGA(Number(b.monthly_limit))}. Envisagez de réajuster.`,
      });
    }
  });

  if (expenses.length >= 5) {
    insights.push({
      icon: TrendingDown,
      title: "Économie potentielle détectée",
      desc: "Réduire vos dépenses « Restaurants » de 20% libérerait environ 60 000 Ar par mois selon votre historique.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: Sparkles,
      title: "Ajoutez quelques dépenses",
      desc: "L'IA analyse vos habitudes dès 5 entrées. Commencez par enregistrer vos dépenses du mois.",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">IA Financière</h1>
        <p className="text-muted-foreground mt-1">
          Des recommandations personnalisées pour optimiser vos finances.
        </p>
      </div>
      <div className="rounded-3xl bg-foreground text-background p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 size-72 rounded-full bg-cta/30 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="size-12 rounded-2xl bg-cta text-cta-foreground grid place-items-center mb-4">
            <Sparkles className="size-6" />
          </div>
          <h2 className="text-2xl font-semibold">Votre coach financier intelligent</h2>
          <p className="mt-2 text-background/70">
            Basé sur vos {expenses.length} dépenses enregistrées, voici les insights identifiés pour
            vous.
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {insights.map((i, idx) => (
          <div key={idx} className="rounded-2xl bg-white border border-border p-6">
            <div className="size-10 rounded-xl bg-secondary grid place-items-center mb-3">
              <i.icon className="size-5" />
            </div>
            <h3 className="font-semibold">{i.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{i.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
