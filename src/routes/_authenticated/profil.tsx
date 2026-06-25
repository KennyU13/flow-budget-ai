import { createFileRoute } from "@tanstack/react-router";
import { Camera, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getFrenchErrorMessage } from "@/lib/french-errors";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({ meta: [{ title: "Profil · FlowBudget AI" }] }),
  component: ProfilPage,
});

function ProfilPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("nom,email,avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setNom(data.nom);
        setEmail(data.email || user.email || "");
        setAvatarUrl(data.avatar_url);
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée.");

      const { error } = await supabase
        .from("profiles")
        .update({ nom: nom.trim() })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profil mis à jour.");
    } catch (error) {
      toast.error(getFrenchErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez une image valide.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La photo ne doit pas dépasser 5 Mo.");
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée.");

      const extension = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Photo de profil mise à jour.");
    } catch (error) {
      toast.error(getFrenchErrorMessage(error, "Impossible d'envoyer la photo."));
    } finally {
      setUploading(false);
    }
  }

  const initial = (nom || email || "U").trim()[0]?.toUpperCase() ?? "U";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl">Profil</h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre identité et vos informations personnelles.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-5">
        <section className="rounded-2xl bg-white border border-border p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-28 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="size-28 rounded-full bg-foreground text-background grid place-items-center text-3xl font-semibold">
                  {initial}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 size-10 rounded-full bg-cta text-cta-foreground grid place-items-center border-4 border-white disabled:opacity-60"
                aria-label="Changer la photo"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
                e.currentTarget.value = "";
              }}
            />
            <h2 className="mt-4 text-xl font-semibold">{nom || "Utilisateur"}</h2>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>

          <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="size-4" />
              Compte sécurisé
            </div>
            <p className="mt-1 text-muted-foreground">
              Vos données sont isolées par utilisateur avec les politiques de sécurité Supabase.
            </p>
          </div>
        </section>

        <form onSubmit={save} className="space-y-4 rounded-2xl bg-white border border-border p-6">
          <div className="flex items-center gap-2">
            <UserRound className="size-5" />
            <h2 className="text-lg font-semibold">Informations du compte</h2>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</span>
            <input
              disabled
              value={email}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary text-muted-foreground"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Nom affiché
            </span>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border outline-none focus:border-foreground"
              placeholder="RAKOTONDRAZANDRY Kenny Urvano"
            />
          </label>
          <button
            disabled={loading}
            className="rounded-full bg-cta text-cta-foreground px-5 py-2.5 text-sm font-semibold cta-glow disabled:opacity-60"
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
