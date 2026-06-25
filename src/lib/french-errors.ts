export function getFrenchErrorMessage(error: unknown, fallback = "Une erreur est survenue.") {
  const message = error instanceof Error ? error.message : String(error || "");
  const normalized = message.toLowerCase();

  if (normalized.includes("missing oauth secret")) {
    return "La connexion Google n'est pas encore configurée côté Supabase. Ajoutez le Client ID et le Client Secret Google dans Authentication > Providers > Google.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Votre email n'est pas encore confirmé. Vérifiez votre boîte de réception.";
  }
  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "Un compte existe déjà avec cet email.";
  }
  if (normalized.includes("password should be at least")) {
    return "Le mot de passe est trop court.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  if (
    normalized.includes("jwt") ||
    normalized.includes("unauthorized") ||
    normalized.includes("not authenticated")
  ) {
    return "Votre session a expiré. Reconnectez-vous.";
  }
  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Connexion réseau indisponible. Vérifiez votre connexion internet.";
  }
  if (
    normalized.includes("row-level security") ||
    normalized.includes("violates row-level security")
  ) {
    return "Action refusée par les règles de sécurité. Reconnectez-vous puis réessayez.";
  }
  if (normalized.includes("duplicate key")) {
    return "Cette information existe déjà.";
  }

  return message || fallback;
}
