import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  payment_method: string;
  notes: string | null;
  date: string;
  created_at: string;
};

export type Budget = {
  id: string;
  category: string;
  monthly_limit: number;
  alerts: boolean;
};

export const expensesQuery = queryOptions({
  queryKey: ["expenses"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []) as Expense[];
  },
});

export const budgetsQuery = queryOptions({
  queryKey: ["budgets"],
  queryFn: async () => {
    const { data, error } = await supabase.from("budgets").select("*").order("category");
    if (error) throw error;
    return (data ?? []) as Budget[];
  },
});

export const CATEGORIES = [
  "Logement",
  "Alimentation",
  "Transport",
  "Loisirs",
  "Santé",
  "Abonnements",
  "Shopping",
  "Restaurants",
  "Voyages",
  "Autres",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Logement: "#2563eb",
  Alimentation: "#16a34a",
  Transport: "#f97316",
  Loisirs: "#8b5cf6",
  Santé: "#dc2626",
  Abonnements: "#0891b2",
  Shopping: "#db2777",
  Restaurants: "#f59e0b",
  Voyages: "#0d9488",
  Autres: "#64748b",
};

export function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Autres;
}

export const PAYMENT_METHODS = ["Carte", "Espèces", "Virement", "Prélèvement"] as const;

export function fmtMGA(n: number) {
  const currency =
    typeof window === "undefined"
      ? "MGA"
      : window.localStorage.getItem("flowbudget:currency") || "MGA";

  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "MGA" ? 0 : 2,
  }).format(n);
}
