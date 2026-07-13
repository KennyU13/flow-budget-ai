import { createFileRoute } from "@tanstack/react-router";
import { Camera, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ProfileField } from "@/components/profile/profile-field";
import { ProfileSection } from "@/components/profile/profile-section";
import { supabase } from "@/integrations/supabase/client";
import { getFrenchErrorMessage } from "@/lib/french-errors";
import { notifyPreferencesChanged } from "@/lib/preferences";
import { getProfileCompletion, profileSchema, type Profile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({ meta: [{ title: "Profil · FlowBudget AI" }] }),
  component: ProfilPage,
});

const emptyProfile: Profile = {
  first_name: null,
  last_name: null,
  nom: null,
  birth_date: null,
  phone: null,
  country: null,
  city: null,
  profession: null,
  employment_status: null,
  bio: null,
  income_range: null,
  monthly_savings_goal: null,
  dependents: null,
  language: "fr",
  devise: "MGA",
  ai_profile_consent: false,
};

const fieldClass =
  "min-h-11 w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-foreground disabled:bg-secondary disabled:text-muted-foreground";

type ProfileErrors = Partial<Record<keyof Profile, string>>;

function sameProfile(left: Profile, right: Profile) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function ProfilPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState<Profile>(emptyProfile);
  const [draft, setDraft] = useState<Profile>(emptyProfile);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [loadError, setLoadError] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Session expirée.");

        setEmail(user.email ?? "");
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "first_name,last_name,nom,birth_date,phone,country,city,profession,employment_status,bio,income_range,monthly_savings_goal,dependents,language,devise,ai_profile_consent,email,avatar_url",
          )
          .eq("id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return;

        setEmail(user.email ?? data.email ?? "");
        setAvatarUrl(data.avatar_url);
        const parsed = profileSchema.safeParse({
          ...data,
          language: data.language || "fr",
          devise: data.devise || "MGA",
        });
        if (!parsed.success)
          throw new Error("Le profil enregistré contient des données invalides.");
        setSaved(parsed.data);
        setDraft(parsed.data);
      } catch (error) {
        setLoadError(true);
        toast.error(getFrenchErrorMessage(error, "Impossible de charger le profil."), {
          id: "profile-load-error",
        });
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  function updateField<K extends keyof Profile>(field: K, value: Profile[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (loadError) return;
    const result = profileSchema.safeParse(draft);
    if (!result.success) {
      const nextErrors: ProfileErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof Profile | undefined;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      toast.error("Corrigez les champs signalés avant d'enregistrer.");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée.");

      const validated: Profile = {
        ...result.data,
        language: result.data.language ?? "fr",
        devise: result.data.devise ?? "MGA",
      };
      const { error } = await supabase
        .from("profiles")
        .update({
          ...validated,
          nom: validated.nom ?? "",
          language: validated.language ?? "fr",
          devise: validated.devise ?? "MGA",
        })
        .eq("id", user.id);
      if (error) throw error;

      const preferencesChanged =
        validated.language !== saved.language || validated.devise !== saved.devise;
      setSaved(validated);
      setDraft(validated);
      setErrors({});
      if (preferencesChanged) {
        localStorage.setItem("flowbudget:language", validated.language ?? "fr");
        localStorage.setItem("flowbudget:currency", validated.devise ?? "MGA");
        document.documentElement.lang = validated.language ?? "fr";
        notifyPreferencesChanged();
      }
      toast.success("Profil mis à jour.");
    } catch (error) {
      toast.error(getFrenchErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez une image valide.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La photo ne doit pas dépasser 10 Mo.");
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
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;

      setAvatarUrl(data.publicUrl);
      toast.success("Photo de profil mise à jour.");
    } catch (error) {
      toast.error(getFrenchErrorMessage(error, "Impossible d'envoyer la photo."));
    } finally {
      setUploading(false);
    }
  }

  const displayName = draft.nom || [draft.first_name, draft.last_name].filter(Boolean).join(" ");
  const initial = (displayName || email || "U").trim()[0]?.toUpperCase() ?? "U";
  const dirty = !sameProfile(draft, saved);
  const completion = getProfileCompletion(draft);

  return (
    <div className="max-w-6xl space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-3xl">Profil</h1>
        <p className="mt-1 text-muted-foreground">
          Gérez vos informations personnelles et vos préférences financières.
        </p>
      </div>

      {loadError ? (
        <div
          role="alert"
          aria-label="Profil indisponible"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          Le profil enregistré n'a pas pu être chargé de manière sûre. Le formulaire reste bloqué et
          aucune donnée ne sera remplacée. Réessayez après avoir actualisé la page.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-border bg-white p-4 sm:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Photo de profil"
                  className="size-28 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="grid size-28 place-items-center rounded-full bg-foreground text-3xl font-semibold text-background">
                  {initial}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || initializing || saving || loadError}
                className="absolute -bottom-1 -right-1 grid size-11 place-items-center rounded-full border-4 border-white bg-cta text-cta-foreground disabled:opacity-60"
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
              disabled={uploading || initializing || saving || loadError}
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAvatar(file);
                event.currentTarget.value = "";
              }}
            />
            <h2 className="mt-4 break-words text-xl font-semibold">
              {displayName || "Utilisateur"}
            </h2>
            <p className="max-w-full break-all text-sm text-muted-foreground">{email}</p>
            {draft.profession ? <p className="mt-2 text-sm">{draft.profession}</p> : null}
            {draft.city ? <p className="text-sm text-muted-foreground">{draft.city}</p> : null}
          </div>

          <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
            <div className="flex items-center justify-between gap-3 font-medium">
              <span>Profil complété</span>
              <span>{completion}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Profil complété"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completion}
              className="mt-2 h-2 overflow-hidden rounded-full bg-border"
            >
              <div
                className="h-full rounded-full bg-cta transition-[width]"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-secondary p-4 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="size-4" />
              Données privées
            </div>
            <p className="mt-1 text-muted-foreground">
              Vos informations sont isolées par les politiques de sécurité Supabase.
            </p>
          </div>
        </aside>

        <form onSubmit={save} className="min-w-0" noValidate>
          <fieldset disabled={initializing || saving || loadError} className="min-w-0 space-y-5">
            <ProfileSection
              title="Identité"
              description="Les informations qui décrivent votre compte."
            >
              <ProfileField label="Email" description="Adresse issue de votre compte Supabase.">
                <input id="email" type="email" disabled value={email} className={fieldClass} />
              </ProfileField>
              <ProfileField label="Nom affiché" error={errors.nom}>
                <input
                  id="display-name"
                  value={draft.nom ?? ""}
                  onChange={(event) => updateField("nom", event.target.value)}
                  maxLength={100}
                  className={fieldClass}
                />
              </ProfileField>
              <ProfileField label="Prénom" error={errors.first_name}>
                <input
                  id="first-name"
                  value={draft.first_name ?? ""}
                  onChange={(event) => updateField("first_name", event.target.value)}
                  maxLength={100}
                  className={fieldClass}
                />
              </ProfileField>
              <ProfileField label="Nom" error={errors.last_name}>
                <input
                  id="last-name"
                  value={draft.last_name ?? ""}
                  onChange={(event) => updateField("last_name", event.target.value)}
                  maxLength={100}
                  className={fieldClass}
                />
              </ProfileField>
              <ProfileField
                label="Date de naissance"
                description="Cette donnée n'est jamais transmise à l'IA."
                error={errors.birth_date}
              >
                <input
                  id="birth-date"
                  type="date"
                  value={draft.birth_date ?? ""}
                  onChange={(event) => updateField("birth_date", event.target.value || null)}
                  className={fieldClass}
                />
              </ProfileField>
              <ProfileField
                label="Téléphone"
                description="Cette donnée n'est jamais transmise à l'IA."
                error={errors.phone}
              >
                <input
                  id="phone"
                  type="tel"
                  value={draft.phone ?? ""}
                  onChange={(event) => updateField("phone", event.target.value)}
                  maxLength={30}
                  placeholder="+261 34 00 000 00"
                  className={fieldClass}
                />
              </ProfileField>
            </ProfileSection>

            <ProfileSection
              title="Localisation et activité"
              description="Toutes ces informations restent facultatives."
            >
              <ProfileField label="Pays" error={errors.country}>
                <input
                  id="country"
                  value={draft.country ?? ""}
                  onChange={(event) => updateField("country", event.target.value)}
                  maxLength={100}
                  className={fieldClass}
                />
              </ProfileField>
              <ProfileField label="Ville" error={errors.city}>
                <input
                  id="city"
                  value={draft.city ?? ""}
                  onChange={(event) => updateField("city", event.target.value)}
                  maxLength={100}
                  className={fieldClass}
                />
              </ProfileField>
              <ProfileField label="Profession" error={errors.profession}>
                <input
                  id="profession"
                  value={draft.profession ?? ""}
                  onChange={(event) => updateField("profession", event.target.value)}
                  maxLength={100}
                  className={fieldClass}
                />
              </ProfileField>
              <ProfileField label="Situation professionnelle" error={errors.employment_status}>
                <select
                  id="employment-status"
                  value={draft.employment_status ?? ""}
                  onChange={(event) =>
                    updateField(
                      "employment_status",
                      (event.target.value || null) as Profile["employment_status"],
                    )
                  }
                  className={fieldClass}
                >
                  <option value="">Non renseignée</option>
                  <option value="student">Étudiant</option>
                  <option value="employed">Salarié</option>
                  <option value="self_employed">Indépendant</option>
                  <option value="unemployed">Sans emploi</option>
                  <option value="retired">Retraité</option>
                  <option value="other">Autre</option>
                </select>
              </ProfileField>
              <ProfileField label="Biographie" error={errors.bio} className="sm:col-span-2">
                <textarea
                  id="bio"
                  value={draft.bio ?? ""}
                  onChange={(event) => updateField("bio", event.target.value)}
                  maxLength={300}
                  rows={4}
                  className={fieldClass}
                />
              </ProfileField>
              <p
                className="-mt-2 text-right text-xs text-muted-foreground sm:col-span-2"
                aria-live="polite"
              >
                {(draft.bio ?? "").length}/300
              </p>
            </ProfileSection>

            <ProfileSection
              title="Profil financier"
              description="Ces données permettent de personnaliser vos objectifs."
            >
              <ProfileField label="Tranche de revenus mensuels" error={errors.income_range}>
                <select
                  id="income-range"
                  value={draft.income_range ?? ""}
                  onChange={(event) =>
                    updateField(
                      "income_range",
                      (event.target.value || null) as Profile["income_range"],
                    )
                  }
                  className={fieldClass}
                >
                  <option value="">Non renseignée</option>
                  <option value="under_500k">Moins de 500 000 Ar</option>
                  <option value="500k_1500k">500 000 à 1 500 000 Ar</option>
                  <option value="1500k_3000k">1 500 000 à 3 000 000 Ar</option>
                  <option value="3000k_5000k">3 000 000 à 5 000 000 Ar</option>
                  <option value="over_5000k">Plus de 5 000 000 Ar</option>
                  <option value="prefer_not_to_say">Préfère ne pas répondre</option>
                </select>
              </ProfileField>
              <ProfileField label="Objectif d'épargne mensuel" error={errors.monthly_savings_goal}>
                <input
                  id="savings-goal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.monthly_savings_goal ?? ""}
                  onChange={(event) =>
                    updateField(
                      "monthly_savings_goal",
                      event.target.value === "" ? null : event.target.valueAsNumber,
                    )
                  }
                  className={fieldClass}
                />
              </ProfileField>
              <ProfileField label="Personnes à charge" error={errors.dependents}>
                <input
                  id="dependents"
                  type="number"
                  min="0"
                  max="20"
                  step="1"
                  value={draft.dependents ?? ""}
                  onChange={(event) =>
                    updateField(
                      "dependents",
                      event.target.value === "" ? null : event.target.valueAsNumber,
                    )
                  }
                  className={fieldClass}
                />
              </ProfileField>
              <ProfileField label="Devise préférée" error={errors.devise}>
                <select
                  id="currency"
                  value={draft.devise ?? "MGA"}
                  onChange={(event) =>
                    updateField("devise", event.target.value as Profile["devise"])
                  }
                  className={fieldClass}
                >
                  <option value="MGA">Ariary malgache (MGA)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dollar US (USD)</option>
                </select>
              </ProfileField>
              <ProfileField label="Langue préférée" error={errors.language}>
                <select
                  id="language"
                  value={draft.language ?? "fr"}
                  onChange={(event) =>
                    updateField("language", event.target.value as Profile["language"])
                  }
                  className={fieldClass}
                >
                  <option value="fr">Français</option>
                  <option value="mg">Malagasy</option>
                  <option value="en">English</option>
                </select>
              </ProfileField>
              <ProfileField
                label="Personnalisation par l'IA"
                description="Avec votre accord, Gemini utilise uniquement la tranche de revenus, l'objectif d'épargne, la situation professionnelle et le nombre de personnes à charge. Vous pouvez retirer cet accord à tout moment."
                className="sm:col-span-2"
              >
                <input
                  id="ai-profile-consent"
                  type="checkbox"
                  checked={draft.ai_profile_consent}
                  onChange={(event) => updateField("ai_profile_consent", event.target.checked)}
                  className="size-5 accent-foreground"
                />
              </ProfileField>
            </ProfileSection>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={initializing || saving || !dirty}
                className="min-h-11 w-full rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-cta-foreground cta-glow disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
