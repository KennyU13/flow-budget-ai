import { createFileRoute } from "@tanstack/react-router";
import { Bell, Globe2, Moon, Palette, Save, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getFrenchErrorMessage } from "@/lib/french-errors";
import {
  applyLanguage,
  applyTheme,
  getStoredLanguage,
  getStoredTheme,
  notifyPreferencesChanged,
  settingsCopy,
  type AppLanguage,
  type AppTheme,
} from "@/lib/preferences";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({ meta: [{ title: "Paramètres · FlowBudget AI" }] }),
  component: ParametresPage,
});

function ParametresPage() {
  const [language, setLanguage] = useState<AppLanguage>("fr");
  const [currency, setCurrency] = useState("MGA");
  const [theme, setTheme] = useState<AppTheme>("light");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const copy = settingsCopy[language];

  useEffect(() => {
    const storedLanguage = getStoredLanguage();
    const storedTheme = getStoredTheme();
    setLanguage(storedLanguage);
    setCurrency(localStorage.getItem("flowbudget:currency") || "MGA");
    setTheme(storedTheme);
    setEmailNotifications(localStorage.getItem("flowbudget:emailNotifications") !== "false");
    setPushNotifications(localStorage.getItem("flowbudget:pushNotifications") !== "false");
    setBudgetAlerts(localStorage.getItem("flowbudget:budgetAlerts") !== "false");
    applyLanguage(storedLanguage);
    applyTheme(storedTheme);
  }, []);

  function updateLanguage(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    localStorage.setItem("flowbudget:language", nextLanguage);
    applyLanguage(nextLanguage);
    notifyPreferencesChanged();
  }

  function updateTheme(nextTheme: AppTheme) {
    setTheme(nextTheme);
    localStorage.setItem("flowbudget:theme", nextTheme);
    applyTheme(nextTheme);
    notifyPreferencesChanged();
  }

  function updateCurrency(nextCurrency: string) {
    setCurrency(nextCurrency);
    localStorage.setItem("flowbudget:currency", nextCurrency);
    notifyPreferencesChanged();
  }

  async function saveSettings() {
    setSaving(true);
    try {
      localStorage.setItem("flowbudget:language", language);
      localStorage.setItem("flowbudget:currency", currency);
      localStorage.setItem("flowbudget:theme", theme);
      localStorage.setItem("flowbudget:emailNotifications", String(emailNotifications));
      localStorage.setItem("flowbudget:pushNotifications", String(pushNotifications));
      localStorage.setItem("flowbudget:budgetAlerts", String(budgetAlerts));
      applyLanguage(language);
      applyTheme(theme);
      notifyPreferencesChanged();

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
      toast.success(copy.saved);
    } catch (error) {
      toast.error(getFrenchErrorMessage(error, copy.saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{copy.title}</h1>
          <p className="text-muted-foreground mt-1">{copy.subtitle}</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-cta text-cta-foreground px-4 py-2.5 text-sm font-semibold cta-glow disabled:opacity-60"
        >
          <Save className="size-4" />
          {saving ? copy.saving : copy.save}
        </button>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <SettingCard icon={Globe2} title={copy.language} desc={copy.languageDesc}>
          <select
            value={language}
            onChange={(e) => updateLanguage(e.target.value as AppLanguage)}
            className="select"
          >
            <option value="fr">Français</option>
            <option value="mg">Malagasy</option>
            <option value="en">English</option>
          </select>
        </SettingCard>
        <SettingCard icon={WalletCards} title={copy.currency} desc={copy.currencyDesc}>
          <select
            value={currency}
            onChange={(e) => updateCurrency(e.target.value)}
            className="select"
          >
            <option value="MGA">Ariary malgache (MGA)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">Dollar US (USD)</option>
          </select>
        </SettingCard>
        <SettingCard icon={Palette} title={copy.theme} desc={copy.themeDesc}>
          <div className="grid grid-cols-2 gap-2">
            <Choice active={theme === "light"} onClick={() => updateTheme("light")}>
              {copy.light}
            </Choice>
            <Choice active={theme === "dark"} onClick={() => updateTheme("dark")}>
              {copy.dark}
            </Choice>
          </div>
        </SettingCard>
        <SettingCard icon={Moon} title={copy.comfort} desc={copy.comfortDesc}>
          <p className="text-sm text-muted-foreground">{copy.comfortText}</p>
        </SettingCard>
      </section>

      <section className="rounded-2xl bg-white border border-border divide-y divide-border">
        <ToggleRow
          icon={Bell}
          title={copy.emailNotifications}
          desc={copy.emailNotificationsDesc}
          checked={emailNotifications}
          onChange={setEmailNotifications}
        />
        <ToggleRow
          icon={Bell}
          title={copy.appNotifications}
          desc={copy.appNotificationsDesc}
          checked={pushNotifications}
          onChange={setPushNotifications}
        />
        <ToggleRow
          icon={WalletCards}
          title={copy.budgetAlerts}
          desc={copy.budgetAlertsDesc}
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
          background: var(--color-card);
          color: var(--color-foreground);
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
