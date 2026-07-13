# Extended Financial Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un profil personnel et financier facultatif, privé, validé et responsive sans perdre les profils existants.

**Architecture:** Étendre `profiles` par migration additive, centraliser le schéma et le calcul de complétion dans un module pur testé, puis reconstruire le formulaire de profil autour d'un brouillon sauvegardé atomiquement. Les données autorisées pour Gemini sont filtrées par une fonction distincte et conditionnées par le consentement.

**Tech Stack:** PostgreSQL/Supabase RLS, React 19, TypeScript, TanStack Start, Zod, Vitest, Testing Library.

---

### Task 1: Configurer les tests unitaires

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Installer l'outillage**

Run:

```bash
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom
```

Expected: les dépendances apparaissent dans `devDependencies`.

- [ ] **Step 2: Ajouter les scripts**

Ajouter dans `package.json` :

```json
"test": "vitest run --passWithNoTests",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 3: Créer la configuration**

Créer `vitest.config.ts` :

```ts
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "jsdom", setupFiles: ["./src/test/setup.ts"], css: true },
});
```

Créer `src/test/setup.ts` :

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Vérifier et committer**

Run: `npm run typecheck && npm test`

Expected: exit 0.

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts
git commit -m "test: configurer les tests du profil"
```

### Task 2: Étendre le schéma Supabase

**Files:**
- Create: `supabase/migrations/20260713150000_extend_financial_profile.sql`
- Modify: `src/integrations/supabase/types.ts`

- [ ] **Step 1: Créer la migration additive**

Créer `supabase/migrations/20260713150000_extend_financial_profile.sql` :

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS profession TEXT,
  ADD COLUMN IF NOT EXISTS employment_status TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS income_range TEXT,
  ADD COLUMN IF NOT EXISTS monthly_savings_goal NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS dependents SMALLINT,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS ai_profile_consent BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_birth_date_check CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE),
  ADD CONSTRAINT profiles_bio_length_check CHECK (bio IS NULL OR char_length(bio) <= 300),
  ADD CONSTRAINT profiles_savings_goal_check CHECK (monthly_savings_goal IS NULL OR monthly_savings_goal >= 0),
  ADD CONSTRAINT profiles_dependents_check CHECK (dependents IS NULL OR dependents BETWEEN 0 AND 20),
  ADD CONSTRAINT profiles_language_check CHECK (language IN ('fr', 'mg', 'en')),
  ADD CONSTRAINT profiles_employment_check CHECK (
    employment_status IS NULL OR employment_status IN ('student', 'employed', 'self_employed', 'unemployed', 'retired', 'other')
  ),
  ADD CONSTRAINT profiles_income_range_check CHECK (
    income_range IS NULL OR income_range IN ('under_500k', '500k_1500k', '1500k_3000k', '3000k_5000k', 'over_5000k', 'prefer_not_to_say')
  );
```

- [ ] **Step 2: Mettre à jour les types TypeScript**

Ajouter les quatorze propriétés aux sections `Row`, `Insert` et `Update` de `profiles` dans `src/integrations/supabase/types.ts`. Utiliser `string | null`, `number | null`, `boolean` et leurs variantes optionnelles, avec `language: string` et `ai_profile_consent: boolean` dans `Row`.

- [ ] **Step 3: Vérifier et committer**

Run: `npm run typecheck`

Expected: exit 0.

```bash
git add supabase/migrations/20260713150000_extend_financial_profile.sql src/integrations/supabase/types.ts
git commit -m "feat: étendre le schéma du profil financier"
```

### Task 3: Centraliser validation, complétion et consentement IA

**Files:**
- Create: `src/lib/profile.ts`
- Create: `src/lib/profile.test.ts`

- [ ] **Step 1: Écrire les tests en échec**

Créer `src/lib/profile.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { getAiProfileContext, getProfileCompletion, profileSchema } from "./profile";

const profile = {
  first_name: "Kenny", last_name: "U", nom: "Kenny", birth_date: null,
  phone: null, country: "MG", city: "Antananarivo", profession: "Développeur",
  employment_status: "self_employed", bio: null, income_range: "1500k_3000k",
  monthly_savings_goal: 200000, dependents: 1, language: "fr", devise: "MGA",
  ai_profile_consent: false,
};

describe("profile", () => {
  it("rejects future birth dates and invalid dependents", () => {
    expect(profileSchema.safeParse({ ...profile, birth_date: "2999-01-01", dependents: 21 }).success).toBe(false);
  });

  it("computes completion from optional fields", () => {
    expect(getProfileCompletion(profile)).toBeGreaterThan(0);
    expect(getProfileCompletion(profile)).toBeLessThanOrEqual(100);
  });

  it("does not expose financial context without consent", () => {
    expect(getAiProfileContext(profile)).toBeNull();
    expect(getAiProfileContext({ ...profile, ai_profile_consent: true })).toEqual({
      incomeRange: "1500k_3000k",
      savingsGoal: 200000,
      employmentStatus: "self_employed",
      dependents: 1,
    });
  });
});
```

- [ ] **Step 2: Confirmer l'échec**

Run: `npm test -- src/lib/profile.test.ts`

Expected: FAIL car `profile.ts` n'existe pas.

- [ ] **Step 3: Implémenter le module**

Créer `src/lib/profile.ts` avec `z.object` pour les champs décrits, `birth_date` raffiné contre la date courante, `bio.max(300)`, `dependents.int().min(0).max(20)`, `monthly_savings_goal.min(0)`, les enums définis dans la migration, `getProfileCompletion()` calculant le ratio de champs renseignés, et `getAiProfileContext()` retournant uniquement les quatre champs financiers si `ai_profile_consent` est vrai.

- [ ] **Step 4: Vérifier et committer**

Run: `npm test -- src/lib/profile.test.ts`

Expected: 3 tests PASS.

```bash
git add src/lib/profile.ts src/lib/profile.test.ts
git commit -m "feat: valider et filtrer le profil financier"
```

### Task 4: Construire le formulaire étendu

**Files:**
- Modify: `src/routes/_authenticated/profil.tsx`
- Create: `src/components/profile/profile-field.tsx`
- Create: `src/components/profile/profile-section.tsx`

- [ ] **Step 1: Créer les composants de formulaire**

`ProfileField` rend un label, une description, un contrôle et une erreur liée par `aria-describedby`. `ProfileSection` rend une carte `rounded-2xl border bg-white p-4 sm:p-6` avec titre et grille `grid grid-cols-1 gap-4 sm:grid-cols-2`.

- [ ] **Step 2: Charger tous les champs**

Étendre le `select()` Supabase de `profil.tsx` avec toutes les colonnes de la migration et initialiser un objet brouillon conforme au schéma. Conserver l'email Auth en lecture seule.

- [ ] **Step 3: Rendre les sections**

Rendre identité, localisation/activité et profil financier. Ajouter compteur `bio.length/300`, selects typés, objectif avec `type="number" min="0"`, personnes à charge avec `min="0" max="20"`, et case de consentement avec explication.

- [ ] **Step 4: Sauvegarder atomiquement**

Valider le brouillon avec `profileSchema.safeParse`. En cas de succès, appeler `.from("profiles").update(validated.data).eq("id", user.id)`, mettre à jour l'état enregistré seulement après réponse Supabase réussie, notifier les préférences si langue ou devise changent, et conserver le brouillon en cas d'erreur.

- [ ] **Step 5: Ajouter complétion et responsive**

Afficher `getProfileCompletion(draft)%` dans l'aperçu, utiliser `grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]`, et donner au bouton une largeur `w-full sm:w-auto` et hauteur minimale `min-h-11`.

- [ ] **Step 6: Vérifier et committer**

Run: `npm run typecheck && npm test && npm run build`

Expected: exit 0.

```bash
git add src/routes/_authenticated/profil.tsx src/components/profile
git commit -m "feat: ajouter le formulaire de profil étendu"
```

### Task 5: Appliquer, vérifier et déployer

**Files:**
- No additional source files.

- [ ] **Step 1: Appliquer la migration dans Supabase**

Dans SQL Editor, exécuter intégralement `supabase/migrations/20260713150000_extend_financial_profile.sql` et vérifier `Success`.

- [ ] **Step 2: Vérifier la sécurité**

Créer deux comptes de test et confirmer que chacun ne peut sélectionner ou modifier que sa ligne `profiles` grâce à `profiles_self`.

- [ ] **Step 3: Validation complète**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Expected: toutes les commandes terminent avec le code 0.

- [ ] **Step 4: Synchroniser et pousser**

Run:

```bash
git fetch origin
git rebase origin/main
git push origin main
```

Expected: push accepté sans `--force`, puis déploiement Vercel Production déclenché.

- [ ] **Step 5: Vérifier la production**

Sur Vercel, attendre `Ready`, enregistrer un profil partiel puis complet, recharger la page, vérifier la persistance et contrôler les largeurs 320 px et 1440 px.
