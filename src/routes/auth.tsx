import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion · FlowBudget AI" },
      { name: "description", content: "Connectez-vous ou créez votre compte FlowBudget AI." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { nom } },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre email si la confirmation est requise.");
        navigate({ to: "/dashboard" });
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenue !");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Email envoyé. Consultez votre boîte de réception.");
        setMode("signin");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth",
      },
    });
    if (error) {
      toast.error("Connexion Google impossible.");
    }
  }

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-foreground text-background relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg relative z-10">
          <div className="size-7 rounded-lg bg-cta grid place-items-center">
            <Sparkles className="size-4 text-cta-foreground" />
          </div>
          FlowBudget AI
        </Link>
        <div className="absolute -bottom-32 -right-32 size-[500px] rounded-full bg-cta/30 blur-3xl" />
        <div className="relative z-10">
          <p className="text-3xl font-semibold leading-tight max-w-md">
            « FlowBudget AI m'a fait économiser 280 000 Ar dès le premier mois. »
          </p>
          <p className="mt-4 text-sm text-background/60">Yacine M. — Consultant indépendant</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="size-4" /> Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-semibold">
            {mode === "signup"
              ? "Créez votre compte"
              : mode === "forgot"
                ? "Mot de passe oublié"
                : "Bon retour !"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Quelques secondes suffisent."
              : mode === "forgot"
                ? "Nous vous enverrons un lien de réinitialisation."
                : "Connectez-vous pour accéder à votre tableau de bord."}
          </p>

          {mode !== "forgot" && (
            <button
              onClick={handleGoogle}
              className="mt-8 w-full inline-flex items-center justify-center gap-3 rounded-full border border-border bg-white py-3 text-sm font-medium hover:bg-secondary transition"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.2-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.6 16 18.9 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-4.9c-2 1.4-4.4 2.3-6.9 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39 16.3 43.5 24 43.5z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6 4.9c-.4.4 6.7-4.9 6.7-14.5 0-1.2-.1-2.3-.4-3.5z"
                />
              </svg>
              Continuer avec Google
            </button>
          )}

          {mode !== "forgot" && (
            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px bg-border flex-1" /> OU <div className="h-px bg-border flex-1" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Nom">
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  className="input-base"
                  placeholder="Camille Dupont"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-base"
                placeholder="vous@email.com"
              />
            </Field>
            {mode !== "forgot" && (
              <Field label="Mot de passe">
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input-base pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-full bg-cta text-cta-foreground py-3 text-sm font-semibold cta-glow disabled:opacity-60 transition"
            >
              {loading
                ? "Patientez…"
                : mode === "signup"
                  ? "Créer mon compte"
                  : mode === "forgot"
                    ? "Envoyer le lien"
                    : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            {mode === "signin" ? (
              <>
                <button
                  onClick={() => setMode("forgot")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Mot de passe oublié ?
                </button>
                <button onClick={() => setMode("signup")} className="text-foreground font-medium">
                  Créer un compte
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode("signin")}
                className="text-muted-foreground hover:text-foreground mx-auto"
              >
                Retour à la connexion
              </button>
            )}
          </div>
        </motion.div>
      </div>

      <style>{`
        .input-base {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.875rem;
          border: 1px solid var(--color-border);
          background: white;
          font-size: 0.95rem;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input-base:focus { border-color: var(--color-foreground); box-shadow: 0 0 0 4px rgba(0,0,0,0.05); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
