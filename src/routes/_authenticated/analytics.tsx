import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { expensesQuery, fmtMGA, getCategoryColor } from "@/lib/expenses.queries";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics · FlowBudget AI" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(expensesQuery),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    return { k, label: d.toLocaleDateString("fr-FR", { month: "short" }) };
  });
  const monthly = months.map((m) => ({
    name: m.label,
    total: expenses
      .filter((e) => {
        const d = new Date(e.date);
        return `${d.getFullYear()}-${d.getMonth()}` === m.k;
      })
      .reduce((s, e) => s + Number(e.amount), 0),
  }));

  const catMap = new Map<string, number>();
  expenses.forEach((e) => catMap.set(e.category, (catMap.get(e.category) || 0) + Number(e.amount)));
  const catData = Array.from(catMap.entries()).map(([name, value]) => ({
    name,
    value,
    color: getCategoryColor(name),
  }));

  const totalAll = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const avg = monthly.reduce((s, m) => s + m.total, 0) / Math.max(1, monthly.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Analytics</h1>
        <p className="text-muted-foreground mt-1">Visualisez vos tendances financières.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Total cumulé">{fmtMGA(totalAll)}</Card>
        <Card title="Moyenne mensuelle">{fmtMGA(avg)}</Card>
        <Card title="Catégories actives">{catData.length}</Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-border p-6">
          <h3 className="font-semibold mb-4">Dépenses par mois</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} />
                <Tooltip
                  formatter={(v) => fmtMGA(Number(v))}
                  contentStyle={{ borderRadius: 12, border: "1px solid #eee" }}
                />
                <Bar dataKey="total" fill="#111" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-border p-6">
          <h3 className="font-semibold mb-4">Répartition par catégorie</h3>
          <div className="h-72">
            {catData.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">
                Aucune donnée
              </div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={catData}
                    dataKey="value"
                    outerRadius={100}
                    label={(p) => p.name as string}
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
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-border p-6">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-3xl font-semibold mt-2">{children}</p>
    </div>
  );
}
