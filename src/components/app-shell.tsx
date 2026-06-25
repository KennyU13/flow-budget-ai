import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  BarChart3,
  BrainCircuit,
  Bell,
  Settings,
  CreditCard,
  LogOut,
  Sparkles,
  Search,
  Menu,
  X,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const nav = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/depenses", label: "Dépenses", icon: Receipt },
  { to: "/budgets", label: "Budgets", icon: Wallet },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/ia", label: "IA Financière", icon: BrainCircuit },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

const bottomNav = [
  { to: "/profil", label: "Profil", icon: User },
  { to: "/parametres", label: "Paramètres", icon: Settings },
  { to: "/abonnement", label: "Abonnement", icon: CreditCard },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState<string>("");
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("À bientôt !");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-secondary/50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border flex flex-col transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-6 h-16 flex items-center justify-between border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="size-7 rounded-lg bg-foreground grid place-items-center">
              <Sparkles className="size-4 text-background" />
            </div>
            FlowBudget
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map((it) => (
            <NavItem key={it.to} {...it} active={pathname === it.to} />
          ))}
          <div className="h-px bg-border my-3 mx-3" />
          {bottomNav.map((it) => (
            <NavItem key={it.to} {...it} active={pathname === it.to} />
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="size-9 rounded-full bg-foreground text-background grid place-items-center text-sm font-semibold">
              {(email[0] || "U").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{email || "Utilisateur"}</p>
            </div>
            <button
              onClick={signOut}
              title="Se déconnecter"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border">
          <div className="px-6 h-16 flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden">
              <Menu className="size-5" />
            </button>
            <div className="flex-1 max-w-md relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Rechercher une dépense, catégorie…"
                className="w-full pl-9 pr-3 py-2 rounded-full bg-secondary border border-transparent focus:bg-white focus:border-border outline-none text-sm transition"
              />
            </div>
            <button className="size-9 rounded-full hover:bg-secondary grid place-items-center transition">
              <Bell className="size-4" />
            </button>
          </div>
        </header>
        <main className="p-6 lg:p-10 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition relative ${
        active
          ? "bg-cta text-cta-foreground font-medium"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="size-4" /> {label}
    </Link>
  );
}
