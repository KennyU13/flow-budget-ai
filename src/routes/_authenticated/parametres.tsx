import { createFileRoute } from "@tanstack/react-router";
import { Bell, Globe2, Moon, Palette, Save, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getFrenchErrorMessage } from "@/lib/french-errors";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({ meta: [{ title: "Paramètres · FlowBudget AI" }] }),
  component: ParametresPage,
});

function ParametresPage() {
  const [language, setLanguage] = useState("fr");
  const [currency, setCurrency] = useState("MGA");
  const [theme, setTheme] = useState("light");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLanguage(localStorage.getItem("flowbudget:language") || "fr");
    setCurrency(localStorage.getItem("flowbudget:currency") || "MGA");
    setTheme(localStorage.getItem("flowbudget:theme") || "light");
    setEmailNotifications(localStorage.getItem("flowbudget:emailNotifications") !== "false");
    setPushNotifications(localStorage.getItem("flowbudget:pushNotifications") !== "false");
    setBudgetAlerts(localStorage.getItem("flowbudget:budgetAlerts") !== "false");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  async function saveSettings() {
    setSaving(true);
    try {
      localStorage.setItem("flowbudget:language", language);
      localStorage.setItem("flowbudget:currency", currency);
      localStorage.setItem("flowbudget:theme", theme);
      localStorage.setItem("flowbudget:emailNotifications", String(emailNotifications));
      localStorage.setItem("flowbudget:pushNotifications", String(pushNotifications));
      localStorage.setItem("flowbudget:budgetAlerts", String(budgetAlerts));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({ devise: currency })
          .eq("id", user.id);
        if (error) throw error;
      }
      toast.success("Paramètres enregistrés.");
    } catch (error) {
      toast.error(getFrenchErrorMessage(error, "Impossible d'enregistrer les paramètres."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Paramètres</h1>
          <p className="text-muted-foreground mt-1">
            Personnalisez votre expérience FlowBudget AI.
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-cta text-cta-foreground px-4 py-2.5 text-sm font-semibold cta-glow disabled:opacity-60"
        >
          <Save className="size-4" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <SettingCard icon={Globe2} title="Langue" desc="Préférence d'interface.">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="select">
            <option value="fr">Français</option>
            <option value="mg">Malagasy</option>
            <option value="en">English</option>
          </select>
        </SettingCard>
        <SettingCard icon={WalletCards} title="Devise" desc="Format d'affichage des montants.">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="select">
            <option value="MGA">Ariary malgache (MGA)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">Dollar US (USD)</option>
          </select>
        </SettingCard>
        <SettingCard icon={Palette} title="Thème" desc="Apparence de l'application.">
          <div className="grid grid-cols-2 gap-2">
            <Choice active={theme === "light"} onClick={() => setTheme("light")}>
              Clair
            </Choice>
            <Choice active={theme === "dark"} onClick={() => setTheme("dark")}>
              Sombre
            </Choice>
          </div>
        </SettingCard>
        <SettingCard
          icon={Moon}
          title="Confort visuel"
          desc="Le thème sombre réduit la fatigue visuelle."
        >
          <p className="text-sm text-muted-foreground">
            Le thème choisi est appliqué immédiatement sur cet appareil.
          </p>
        </SettingCard>
      </section>

      <section className="rounded-2xl bg-white border border-border divide-y divide-border">
        <ToggleRow
          icon={Bell}
          title="Notifications email"
          desc="Recevoir les résumés et alertes importantes."
          checked={emailNotifications}
          onChange={setEmailNotifications}
        />
        <ToggleRow
          icon={Bell}
          title="Notifications dans l'application"
          desc="Afficher les alertes de budget dans FlowBudget."
          checked={pushNotifications}
          onChange={setPushNotifications}
        />
        <ToggleRow
          icon={WalletCards}
          title="Alertes de dépassement"
          desc="Prévenir lorsqu'une catégorie dépasse le seuil prévu."
          checked={budgetAlerts}
          onChange={setBudgetAlerts}
        />
      </section>

      <style>{`
        .select {
          width: 100%;
          padding: .65rem .85rem;
          border-radius: .75rem;
          border: 1px solid var(--color-border);
          background: white;
          outline: none;
          font-size: .9rem;
        }
        .select:focus { border-color: var(--color-foreground); }
      `}</style>
    </div>
  );
}

function SettingCard({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-border p-5">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-secondary grid place-items-center">
          <Icon className="size-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-medium ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="p-5 flex items-center gap-4">
      <div className="size-10 rounded-xl bg-secondary grid place-items-center">
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full p-1 transition ${checked ? "bg-foreground" : "bg-border"}`}
      >
        <span
          className={`block size-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
