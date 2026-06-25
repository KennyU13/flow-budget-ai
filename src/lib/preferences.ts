export type AppLanguage = "fr" | "mg" | "en";
export type AppTheme = "light" | "dark";

export const PREFERENCES_EVENT = "flowbudget:preferences-changed";

export function getStoredLanguage(): AppLanguage {
  const value = localStorage.getItem("flowbudget:language");
  return value === "mg" || value === "en" ? value : "fr";
}

export function getStoredTheme(): AppTheme {
  return localStorage.getItem("flowbudget:theme") === "dark" ? "dark" : "light";
}

export function applyTheme(theme: AppTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function applyLanguage(language: AppLanguage) {
  document.documentElement.lang = language;
}

export function notifyPreferencesChanged() {
  window.dispatchEvent(new Event(PREFERENCES_EVENT));
}

export const shellCopy = {
  fr: {
    nav: {
      dashboard: "Tableau de bord",
      expenses: "Dépenses",
      budgets: "Budgets",
      analytics: "Analytics",
      ai: "IA Financière",
      notifications: "Notifications",
      profile: "Profil",
      settings: "Paramètres",
      subscription: "Abonnement",
    },
    search: "Rechercher une dépense, catégorie...",
    close: "Fermer",
    menu: "Menu",
    logout: "Se déconnecter",
    logoutSuccess: "Déconnexion réussie.",
    logoutError: "Déconnexion impossible.",
    user: "Utilisateur",
  },
  mg: {
    nav: {
      dashboard: "Tabilao",
      expenses: "Fandaniam-bola",
      budgets: "Tetibola",
      analytics: "Fanadihadiana",
      ai: "IA ara-bola",
      notifications: "Fampandrenesana",
      profile: "Mombamomba",
      settings: "Kirakira",
      subscription: "Famandrihana",
    },
    search: "Karohy ny fandaniana na sokajy...",
    close: "Hidio",
    menu: "Menio",
    logout: "Hivoaka",
    logoutSuccess: "Tafavoaka soa aman-tsara.",
    logoutError: "Tsy afaka mivoaka.",
    user: "Mpampiasa",
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      expenses: "Expenses",
      budgets: "Budgets",
      analytics: "Analytics",
      ai: "Financial AI",
      notifications: "Notifications",
      profile: "Profile",
      settings: "Settings",
      subscription: "Subscription",
    },
    search: "Search expense or category...",
    close: "Close",
    menu: "Menu",
    logout: "Sign out",
    logoutSuccess: "Signed out successfully.",
    logoutError: "Unable to sign out.",
    user: "User",
  },
} as const;

export const settingsCopy = {
  fr: {
    title: "Paramètres",
    subtitle: "Personnalisez votre expérience FlowBudget AI.",
    save: "Enregistrer",
    saving: "Enregistrement...",
    saved: "Paramètres enregistrés.",
    saveError: "Impossible d'enregistrer les paramètres.",
    language: "Langue",
    languageDesc: "Préférence d'interface.",
    currency: "Devise",
    currencyDesc: "Format d'affichage des montants.",
    theme: "Thème",
    themeDesc: "Apparence de l'application.",
    light: "Clair",
    dark: "Sombre",
    comfort: "Confort visuel",
    comfortDesc: "Le thème sombre réduit la fatigue visuelle.",
    comfortText: "Le thème choisi est appliqué immédiatement sur cet appareil.",
    emailNotifications: "Notifications email",
    emailNotificationsDesc: "Recevoir les résumés et alertes importantes.",
    appNotifications: "Notifications dans l'application",
    appNotificationsDesc: "Afficher les alertes de budget dans FlowBudget.",
    budgetAlerts: "Alertes de dépassement",
    budgetAlertsDesc: "Prévenir lorsqu'une catégorie dépasse le seuil prévu.",
  },
  mg: {
    title: "Kirakira",
    subtitle: "Ovay araka izay tianao ny FlowBudget AI.",
    save: "Tehirizo",
    saving: "Mitahiry...",
    saved: "Voatahiry ny kirakira.",
    saveError: "Tsy afaka mitahiry ny kirakira.",
    language: "Fiteny",
    languageDesc: "Fitenin'ny interface.",
    currency: "Vola",
    currencyDesc: "Endriky ny vola aseho.",
    theme: "Endrika",
    themeDesc: "Fisehon'ny application.",
    light: "Mazava",
    dark: "Maizina",
    comfort: "Fampiononana maso",
    comfortDesc: "Ny endrika maizina dia mampihena ny harerahana.",
    comfortText: "Mihatra avy hatrany amin'ity fitaovana ity ny safidinao.",
    emailNotifications: "Fampandrenesana email",
    emailNotificationsDesc: "Mandray famintinana sy fanairana lehibe.",
    appNotifications: "Fampandrenesana ato anaty application",
    appNotificationsDesc: "Asehoy ato amin'ny FlowBudget ny fanairana tetibola.",
    budgetAlerts: "Fanairana fihoarana",
    budgetAlertsDesc: "Ampandreseo rehefa mihoatra ny fetra ny sokajy iray.",
  },
  en: {
    title: "Settings",
    subtitle: "Customize your FlowBudget AI experience.",
    save: "Save",
    saving: "Saving...",
    saved: "Settings saved.",
    saveError: "Unable to save settings.",
    language: "Language",
    languageDesc: "Interface preference.",
    currency: "Currency",
    currencyDesc: "Amount display format.",
    theme: "Theme",
    themeDesc: "Application appearance.",
    light: "Light",
    dark: "Dark",
    comfort: "Visual comfort",
    comfortDesc: "Dark theme reduces visual fatigue.",
    comfortText: "The selected theme is applied immediately on this device.",
    emailNotifications: "Email notifications",
    emailNotificationsDesc: "Receive summaries and important alerts.",
    appNotifications: "In-app notifications",
    appNotificationsDesc: "Show budget alerts in FlowBudget.",
    budgetAlerts: "Overspending alerts",
    budgetAlertsDesc: "Notify when a category exceeds its threshold.",
  },
} as const;
