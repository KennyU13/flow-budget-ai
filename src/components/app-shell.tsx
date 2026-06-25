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
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getFrenchErrorMessage } from "@/lib/french-errors";

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

type UserProfile = {
  nom: string;
  email: string;
  avatar_url: string | null;
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    nom: "",
    email: "",
    avatar_url: null,
  });
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const theme = window.localStorage.getItem("flowbudget:theme") || "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || !active) return;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nom,email,avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!active) return;
      setProfile({
        nom: profileData?.nom || data.user.user_metadata?.nom || "Utilisateur",
        email: profileData?.email || data.user.email || "",
        avatar_url: profileData?.avatar_url ?? null,
      });
    });
    return () => {
      active = false;
    };
  }, [pathname]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await qc.cancelQueries();
      qc.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Déconnexion réussie.");
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(getFrenchErrorMessage(error, "Déconnexion impossible."));
    } finally {
      setSigningOut(false);
    }
  }

  const initial = (profile.nom || profile.email || "U").trim()[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-secondary/50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-border flex flex-col transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-5 h-16 flex items-center justify-between border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="size-7 rounded-lg bg-foreground grid place-items-center">
              <Sparkles className="size-4 text-background" />
            </div>
            FlowBudget
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden" aria-label="Fermer">
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
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="size-10 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="size-10 rounded-full bg-foreground text-background grid place-items-center text-sm font-semibold">
                {initial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.nom || "Utilisateur"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
            <button
              onClick={signOut}
              disabled={signingOut}
              title="Se déconnecter"
              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border">
          <div className="px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden" aria-label="Menu">
              <Menu className="size-5" />
            </button>
            <div className="flex-1 max-w-md relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Rechercher une dépense, catégorie..."
                className="w-full pl-9 pr-3 py-2 rounded-full bg-secondary border border-transparent focus:bg-white focus:border-border outline-none text-sm transition"
              />
            </div>
            <Link
              to="/notifications"
              className="relative size-9 rounded-full hover:bg-secondary grid place-items-center transition"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-cta" />
            </Link>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">{children}</main>
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
