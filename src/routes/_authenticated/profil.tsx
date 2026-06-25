import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({ meta: [{ title: "Profil · FlowBudget AI" }] }),
  component: ProfilPage,
});

function ProfilPage() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("nom")
        .eq("id", user.id)
        .maybeSingle();
      if (data) setNom(data.nom);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("profiles").update({ nom }).eq("id", user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Profil mis à jour");
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl">Profil</h1>
        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles.</p>
      </div>
      <form onSubmit={save} className="space-y-4 rounded-2xl bg-white border border-border p-6">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</span>
          <input
            disabled
            value={email}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary text-muted-foreground"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground mb-1.5 block">Nom</span>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border outline-none focus:border-foreground"
          />
        </label>
        <button
          disabled={loading}
          className="rounded-full bg-cta text-cta-foreground px-5 py-2.5 text-sm font-semibold cta-glow disabled:opacity-60"
        >
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
