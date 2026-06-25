import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, CheckCircle2, CreditCard, Wallet } from "lucide-react";
import { budgetsQuery, expensesQuery, fmtMGA } from "@/lib/expenses.queries";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications · FlowBudget AI" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(budgetsQuery),
      context.queryClient.ensureQueryData(expensesQuery),
    ]),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data: budgets } = useSuspenseQuery(budgetsQuery);
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const now = new Date();
  const spentByCat = new Map<string, number>();

  expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .forEach((e) =>
      spentByCat.set(e.category, (spentByCat.get(e.category) || 0) + Number(e.amount)),
    );

  const alerts = budgets
    .map((budget) => {
      const spent = spentByCat.get(budget.category) || 0;
      const limit = Number(budget.monthly_limit);
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      if (pct >= 100) {
        return {
          icon: AlertTriangle,
          tone: "danger",
          title: `Budget dépassé : ${budget.category}`,
          desc: `${fmtMGA(spent)} dépensés pour une limite de ${fmtMGA(limit)}.`,
          to: "/budgets",
        };
      }
      if (pct >= 80) {
        return {
          icon: Bell,
          tone: "warning",
          title: `Budget bientôt atteint : ${budget.category}`,
          desc: `${Math.round(pct)}% de la limite mensuelle utilisée.`,
          to: "/budgets",
        };
      }
      return null;
    })
    .filter(Boolean);

  const recentExpenses = expenses.slice(0, 3).map((expense) => ({
    icon: CreditCard,
    tone: "info",
    title: `Dépense enregistrée : ${expense.description}`,
    desc: `${fmtMGA(Number(expense.amount))} · ${expense.category}`,
    to: "/depenses",
  }));

  const items = [...alerts, ...recentExpenses];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Notifications</h1>
        <p className="text-muted-foreground mt-1">Alertes financières et activité récente.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Metric title="Alertes budget" value={alerts.length} icon={AlertTriangle} />
        <Metric title="Dépenses récentes" value={recentExpenses.length} icon={Wallet} />
        <Metric title="État" value={alerts.length ? "À vérifier" : "OK"} icon={CheckCircle2} />
      </div>

      <div className="rounded-2xl bg-white border border-border overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <Bell className="size-8 mx-auto mb-3 text-muted-foreground" />
            Vous êtes à jour. Aucune notification.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <Link
                key={`${item.title}-${item.desc}`}
                to={item.to}
                className="flex gap-4 p-5 hover:bg-secondary/60 transition"
              >
                <div
                  className={`size-10 rounded-xl grid place-items-center ${
                    item.tone === "danger"
                      ? "bg-destructive/10 text-destructive"
                      : item.tone === "warning"
                        ? "bg-cta/30 text-foreground"
                        : "bg-secondary text-foreground"
                  }`}
                >
                  <item.icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl bg-white border border-border p-5">
      <Icon className="size-5 text-muted-foreground" />
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
