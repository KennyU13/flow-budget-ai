import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { budgetsQuery, expensesQuery, CATEGORIES, fmtMGA } from "@/lib/expenses.queries";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({ meta: [{ title: "Budgets · FlowBudget AI" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(budgetsQuery),
      context.queryClient.ensureQueryData(expensesQuery),
    ]),
  component: BudgetsPage,
});

function BudgetsPage() {
  const { data: budgets } = useSuspenseQuery(budgetsQuery);
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

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

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget supprimé");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl">Budgets</h1>
          <p className="text-muted-foreground mt-1">
            Définissez vos limites mensuelles par catégorie.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-cta text-cta-foreground px-4 py-2.5 text-sm font-semibold cta-glow"
        >
          <Plus className="size-4" /> Nouveau budget
        </button>
      </div>
      {budgets.length === 0 ? (
        <div className="rounded-2xl bg-white border border-border p-12 text-center text-sm text-muted-foreground">
          Aucun budget. Créez-en un pour suivre vos limites mensuelles.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const spent = spentByCat.get(b.category) || 0;
            const pct = Math.min(100, (spent / Number(b.monthly_limit)) * 100);
            const over = spent > Number(b.monthly_limit);
            return (
              <div key={b.id} className="rounded-2xl bg-white border border-border p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{b.category}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmtMGA(spent)} sur {fmtMGA(Number(b.monthly_limit))}
                    </p>
                  </div>
                  <button
                    onClick={() => del.mutate(b.id)}
                    className="p-1.5 rounded-lg hover:bg-secondary"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over ? "bg-destructive" : "bg-foreground"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p
                  className={`mt-2 text-xs ${over ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {over
                    ? `Dépassé de ${fmtMGA(spent - Number(b.monthly_limit))}`
                    : `Reste ${fmtMGA(Number(b.monthly_limit) - spent)}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
      {open && <BudgetDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function BudgetDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [limit, setLimit] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const { error } = await supabase.from("budgets").upsert(
        {
          user_id: user.id,
          category,
          monthly_limit: Number(limit),
          alerts: true,
        },
        { onConflict: "user_id,category" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget enregistré");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-border p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nouveau budget</h3>
          <button onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-3"
        >
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Catégorie
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border outline-none focus:border-foreground bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Limite mensuelle (Ar)
            </span>
            <input
              required
              type="number"
              min="1"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border outline-none focus:border-foreground"
            />
          </label>
          <button
            disabled={save.isPending}
            className="w-full rounded-full bg-cta text-cta-foreground py-3 text-sm font-semibold cta-glow disabled:opacity-60"
          >
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}
