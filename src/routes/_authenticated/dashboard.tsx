import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Plus, Sparkles, TrendingDown } from "lucide-react";
import { expensesQuery, budgetsQuery, fmtMGA, getCategoryColor } from "@/lib/expenses.queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord · FlowBudget AI" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(expensesQuery),
      context.queryClient.ensureQueryData(budgetsQuery),
    ]),
  component: Dashboard,
});

function Dashboard() {
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const { data: budgets } = useSuspenseQuery(budgetsQuery);

  const now = new Date();
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const total = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const budgetTotal = budgets.reduce((s, b) => s + Number(b.monthly_limit), 0);

  // Per-day series
  const days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    const v = expenses.filter((e) => e.date === key).reduce((s, e) => s + Number(e.amount), 0);
    return { d: d.getDate().toString(), v };
  });

  // Per category
  const catMap = new Map<string, number>();
  monthExpenses.forEach((e) =>
    catMap.set(e.category, (catMap.get(e.category) || 0) + Number(e.amount)),
  );
  const catData = Array.from(catMap.entries()).map(([name, value]) => ({
    name,
    value,
    color: getCategoryColor(name),
  }));

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-sm text-muted-foreground">Bienvenue 👋</p>
          <h1 className="text-3xl mt-1">Tableau de bord</h1>
        </div>
        <a
          href="/depenses"
          className="inline-flex items-center gap-2 rounded-full bg-cta text-cta-foreground px-4 py-2.5 text-sm font-semibold cta-glow"
        >
          <Plus className="size-4" /> Nouvelle dépense
        </a>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat title="Dépenses du mois" value={fmtMGA(total)} delta="−12% vs M-1" trend="down" />
        <Stat
          title="Budget total"
          value={fmtMGA(budgetTotal)}
          delta={`${budgets.length} budgets`}
        />
        <Stat
          title="Économies estimées"
          value={fmtMGA(Math.max(0, budgetTotal - total))}
          delta="objectif tenu"
          trend="up"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Évolution sur 30 jours</p>
              <p className="text-2xl font-semibold mt-1">{fmtMGA(total)}</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="da" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#111" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #eee" }}
                  formatter={(v) => fmtMGA(Number(v))}
                />
                <Area type="monotone" dataKey="v" stroke="#111" strokeWidth={2} fill="url(#da)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-border p-6">
          <p className="text-xs text-muted-foreground mb-1">Par catégorie</p>
          <div className="h-48">
            {catData.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">
                Aucune dépense ce mois
              </div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={catData}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {catData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtMGA(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-2 mt-4">
            {catData.slice(0, 5).map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: c.color }} /> {c.name}
                </span>
                <span className="text-muted-foreground">{fmtMGA(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Dépenses récentes</h3>
            <a href="/depenses" className="text-sm text-muted-foreground hover:text-foreground">
              Voir tout
            </a>
          </div>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              Aucune dépense. Ajoutez votre première depuis l'onglet « Dépenses ».
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {expenses.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-xl grid place-items-center text-xs font-medium text-white"
                      style={{ background: getCategoryColor(e.category) }}
                    >
                      {e.category[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.category} · {new Date(e.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">−{fmtMGA(Number(e.amount))}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-foreground text-background p-6 relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 size-60 rounded-full bg-cta/30 blur-3xl" />
          <div className="relative">
            <div className="size-10 rounded-xl bg-cta text-cta-foreground grid place-items-center mb-4">
              <Sparkles className="size-5" />
            </div>
            <h3 className="font-semibold text-lg">Recommandation IA</h3>
            <p className="text-sm text-background/70 mt-2 leading-relaxed">
              Vos dépenses « Restaurants » sont en hausse de 18% ce mois. Réduire de 2 sorties
              pourrait économiser environ 60 000 Ar.
            </p>
            <a
              href="/ia"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cta"
            >
              Voir les insights →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  delta,
  trend,
}: {
  title: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="rounded-2xl bg-white border border-border p-6">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-3xl font-semibold mt-2">{value}</p>
      {delta && (
        <p
          className={`text-xs mt-2 inline-flex items-center gap-1 ${trend === "down" ? "text-green-700" : trend === "up" ? "text-foreground" : "text-muted-foreground"}`}
        >
          {trend === "down" && <ArrowDownRight className="size-3" />}
          {trend === "up" && <ArrowUpRight className="size-3" />}
          {!trend && <TrendingDown className="size-3 opacity-0" />}
          {delta}
        </p>
      )}
    </div>
  );
}
