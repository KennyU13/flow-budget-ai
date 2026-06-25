import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Trash2, Pencil, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  expensesQuery,
  CATEGORIES,
  PAYMENT_METHODS,
  fmtEUR,
  type Expense,
} from "@/lib/expenses.queries";

export const Route = createFileRoute("/_authenticated/depenses")({
  head: () => ({ meta: [{ title: "Dépenses · FlowBudget AI" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(expensesQuery),
  component: DepensesPage,
});

function DepensesPage() {
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Expense | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");

  const filtered = useMemo(
    () =>
      expenses.filter(
        (e) =>
          (!q || e.description.toLowerCase().includes(q.toLowerCase())) &&
          (!cat || e.category === cat),
      ),
    [expenses, q, cat],
  );

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Dépense supprimée");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Dépenses</h1>
          <p className="text-muted-foreground mt-1">
            {filtered.length} dépenses · total {fmtEUR(total)}
          </p>
        </div>
        <button
          onClick={() => {
            setEdit(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-cta text-cta-foreground px-4 py-2.5 text-sm font-semibold cta-glow"
        >
          <Plus className="size-4" /> Ajouter
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-border outline-none focus:border-foreground text-sm"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white border border-border outline-none focus:border-foreground text-sm"
        >
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-2xl bg-white border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Aucune dépense. Ajoutez la première.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-3">Description</th>
                <th className="text-left font-medium px-5 py-3">Catégorie</th>
                <th className="text-left font-medium px-5 py-3">Paiement</th>
                <th className="text-left font-medium px-5 py-3">Date</th>
                <th className="text-right font-medium px-5 py-3">Montant</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-secondary/40">
                  <td className="px-5 py-3 font-medium">{e.description}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.category}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.payment_method}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{fmtEUR(Number(e.amount))}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setEdit(e);
                          setOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-secondary"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => del.mutate(e.id)}
                        className="p-1.5 rounded-lg hover:bg-secondary"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {open && <ExpenseDialog expense={edit} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ExpenseDialog({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    amount: expense?.amount?.toString() ?? "",
    description: expense?.description ?? "",
    category: expense?.category ?? CATEGORIES[0],
    payment_method: expense?.payment_method ?? (PAYMENT_METHODS[0] as string),
    date: expense?.date ?? new Date().toISOString().slice(0, 10),
    notes: expense?.notes ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const payload = {
        user_id: user.id,
        amount: Number(form.amount),
        description: form.description,
        category: form.category,
        payment_method: form.payment_method,
        date: form.date,
        notes: form.notes || null,
      };
      if (expense) {
        const { error } = await supabase.from("expenses").update(payload).eq("id", expense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expenses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(expense ? "Dépense modifiée" : "Dépense ajoutée");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-2xl border border-border p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{expense ? "Modifier" : "Nouvelle dépense"}</h3>
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
          <Row label="Description">
            <input
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="inp"
            />
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Montant (€)">
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="inp"
              />
            </Row>
            <Row label="Date">
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="inp"
              />
            </Row>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Catégorie">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="inp"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Row>
            <Row label="Paiement">
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="inp"
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Row>
          </div>
          <Row label="Notes (optionnel)">
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="inp min-h-20"
            />
          </Row>
          <button
            disabled={save.isPending}
            type="submit"
            className="w-full rounded-full bg-cta text-cta-foreground py-3 text-sm font-semibold cta-glow disabled:opacity-60"
          >
            {save.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
        <style>{`.inp{width:100%;padding:.6rem .85rem;border:1px solid var(--color-border);border-radius:.75rem;outline:none;background:#fff;font-size:.9rem;transition:border-color .15s}.inp:focus{border-color:var(--color-foreground)}`}</style>
      </motion.div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
