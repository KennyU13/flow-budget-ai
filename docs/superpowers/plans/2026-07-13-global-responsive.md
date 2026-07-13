# Global Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre toutes les routes de FlowBudget AI entièrement utilisables sans débordement horizontal entre 320 px et 1440 px.

**Architecture:** Ajouter d'abord une base de tests responsive reproductibles, puis introduire de petits composants de mise en page partagés et adapter les routes par groupes cohérents. Conserver la barre latérale desktop, transformer les listes complexes en cartes mobiles et limiter les changements aux comportements de mise en page.

**Tech Stack:** React 19, TypeScript, TanStack Start, Tailwind CSS 4, Vitest, Testing Library, Playwright.

---

## Structure des fichiers

- `package.json` : scripts de tests unitaires et responsive.
- `vitest.config.ts` : environnement de tests React.
- `playwright.config.ts` : serveur local et tailles de viewport.
- `src/test/setup.ts` : matchers DOM.
- `src/components/responsive-page.tsx` : en-tête, actions et grille réutilisables.
- `src/components/responsive-page.test.tsx` : comportement structurel des composants partagés.
- `src/styles.css` : protections globales contre les débordements et styles tactiles.
- `src/components/app-shell.tsx` : navigation mobile, recherche et conteneur principal.
- `src/routes/index.tsx` et `src/routes/auth.tsx` : accueil et authentification.
- `src/routes/_authenticated/depenses.tsx` : cartes mobiles et tableau desktop.
- `src/routes/_authenticated/dashboard.tsx`, `analytics.tsx`, `budgets.tsx` : cartes et graphiques financiers.
- `src/routes/_authenticated/ia.tsx`, `notifications.tsx`, `profil.tsx`, `parametres.tsx`, `abonnement.tsx` : routes secondaires.
- `e2e/responsive.spec.ts` : contrôle des débordements et des interactions aux largeurs cibles.

### Task 1: Installer l'infrastructure de test

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Ajouter les dépendances de test**

Run:

```bash
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @playwright/test
```

Expected: `package.json` et `package-lock.json` contiennent les cinq dépendances.

- [ ] **Step 2: Ajouter les scripts de contrôle**

Ajouter dans `package.json` :

```json
"test": "vitest run --passWithNoTests",
"test:watch": "vitest",
"test:responsive": "playwright test e2e/responsive.spec.ts",
"typecheck": "tsc --noEmit",
"format:check": "prettier --check ."
```

- [ ] **Step 3: Configurer Vitest**

Créer `vitest.config.ts` :

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
```

Créer `src/test/setup.ts` :

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Configurer Playwright**

Créer `playwright.config.ts` :

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

- [ ] **Step 5: Vérifier l'infrastructure**

Run:

```bash
npm run typecheck
npm test
```

Expected: TypeScript réussit et Vitest indique qu'aucun fichier de test n'est encore présent sans erreur de configuration.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts playwright.config.ts src/test/setup.ts
git commit -m "test: configurer les contrôles responsive"
```

### Task 2: Créer les primitives responsive partagées

**Files:**
- Create: `src/components/responsive-page.tsx`
- Create: `src/components/responsive-page.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Écrire le test en échec**

Créer `src/components/responsive-page.test.tsx` :

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader, ResponsiveGrid } from "./responsive-page";

describe("responsive page primitives", () => {
  it("exposes a wrapping header and a single-column mobile grid", () => {
    render(
      <>
        <PageHeader title="Dépenses" actions={<button>Ajouter</button>} />
        <ResponsiveGrid data-testid="grid"><div>Carte</div></ResponsiveGrid>
      </>,
    );
    expect(screen.getByRole("heading", { name: "Dépenses" }).parentElement?.parentElement)
      .toHaveClass("flex-col", "sm:flex-row");
    expect(screen.getByTestId("grid")).toHaveClass("grid-cols-1");
  });
});
```

- [ ] **Step 2: Confirmer l'échec**

Run: `npm test -- src/components/responsive-page.test.tsx`

Expected: FAIL car `responsive-page.tsx` n'existe pas.

- [ ] **Step 3: Implémenter les primitives**

Créer `src/components/responsive-page.tsx` :

```tsx
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm sm:text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div>}
    </header>
  );
}

export function ResponsiveGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", className)} {...props} />;
}
```

- [ ] **Step 4: Ajouter les protections globales**

Dans `src/styles.css`, sous `@layer base`, ajouter :

```css
html, body { min-width: 320px; overflow-x: clip; }
img, svg, canvas { max-width: 100%; }
button, a, input, select, textarea { touch-action: manipulation; }
@media (max-width: 639px) {
  input, select, textarea { font-size: 16px; }
}
```

- [ ] **Step 5: Vérifier et committer**

Run: `npm test -- src/components/responsive-page.test.tsx`

Expected: 1 test PASS.

```bash
git add src/components/responsive-page.tsx src/components/responsive-page.test.tsx src/styles.css
git commit -m "feat: ajouter les primitives responsive"
```

### Task 3: Adapter le shell, l'accueil et l'authentification

**Files:**
- Modify: `src/components/app-shell.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/auth.tsx`

- [ ] **Step 1: Rendre le shell robuste à 320 px**

Dans `app-shell.tsx`, appliquer ces classes aux zones correspondantes :

```tsx
<aside className="fixed inset-y-0 left-0 z-40 flex w-[min(18rem,88vw)] flex-col ..." />
<div className="min-w-0 lg:pl-72">
<div className="flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-6">
<div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md">
<main className="mx-auto min-w-0 max-w-7xl p-4 sm:p-6 lg:p-10">
```

Fermer le panneau mobile dans le gestionnaire de clic de chaque lien et conserver `aria-label` sur menu et fermeture.

- [ ] **Step 2: Adapter la page publique**

Dans `index.tsx`, remplacer les espacements et titres fixes par :

```tsx
<div className="mx-auto h-16 max-w-7xl px-4 sm:px-6 ...">
<div className="mx-auto max-w-7xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-32 sm:pt-24">
<h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.05] sm:text-5xl md:text-7xl">
```

Appliquer `px-4 sm:px-6` aux sections, `text-3xl sm:text-4xl md:text-5xl` aux titres et `grid-cols-1` explicitement aux grilles mobiles.

- [ ] **Step 3: Adapter l'authentification**

Dans `auth.tsx`, utiliser :

```tsx
<div className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center sm:p-12">
<motion.div className="w-full min-w-0 max-w-md">
<h1 className="text-2xl font-semibold sm:text-3xl">
```

Donner `aria-label="Afficher le mot de passe"` au bouton œil et une hauteur minimale de 44 px aux boutons principaux.

- [ ] **Step 4: Vérifier et committer**

Run:

```bash
npm run typecheck
npm test
```

Expected: exit 0.

```bash
git add src/components/app-shell.tsx src/routes/index.tsx src/routes/auth.tsx
git commit -m "feat: adapter la navigation et les pages publiques"
```

### Task 4: Transformer les dépenses pour mobile

**Files:**
- Modify: `src/routes/_authenticated/depenses.tsx`

- [ ] **Step 1: Extraire un rendu de carte mobile**

Ajouter dans `depenses.tsx` :

```tsx
function ExpenseMobileCard({ expense, onEdit, onDelete }: {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-white p-4 md:hidden">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words font-medium">{expense.description}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{expense.category} · {expense.date}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold">{fmtMGA(Number(expense.amount))}</p>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="min-h-11 flex-1 rounded-xl border" onClick={() => onEdit(expense)}>Modifier</button>
        <button className="min-h-11 flex-1 rounded-xl border" onClick={() => onDelete(expense)}>Supprimer</button>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Basculer carte/tableau selon le viewport**

Rendre les cartes dans `div className="space-y-3 md:hidden"` et envelopper le tableau existant dans `div className="hidden overflow-x-auto md:block"`.

- [ ] **Step 3: Adapter filtres et modale**

Utiliser `flex-col sm:flex-row`, retirer `min-w-[240px]`, passer les groupes de formulaire en `grid-cols-1 sm:grid-cols-2`, et donner à la modale :

```tsx
className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl ..."
```

- [ ] **Step 4: Vérifier et committer**

Run: `npm run typecheck && npm test`

Expected: exit 0.

```bash
git add src/routes/_authenticated/depenses.tsx
git commit -m "feat: rendre les dépenses adaptées au mobile"
```

### Task 5: Adapter les pages financières et les graphiques

**Files:**
- Modify: `src/routes/_authenticated/dashboard.tsx`
- Modify: `src/routes/_authenticated/analytics.tsx`
- Modify: `src/routes/_authenticated/budgets.tsx`

- [ ] **Step 1: Uniformiser les en-têtes et grilles**

Utiliser `PageHeader` sur les trois pages. Remplacer les grilles statistiques par `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3` et les sections analytiques par `grid grid-cols-1 gap-4 xl:grid-cols-2`.

- [ ] **Step 2: Rendre les graphiques lisibles**

Pour chaque conteneur de graphique, appliquer :

```tsx
<div className="h-64 min-w-0 sm:h-72 lg:h-80">
  <ResponsiveContainer width="100%" height="100%">...</ResponsiveContainer>
</div>
```

Réduire les marges Recharts sur mobile, utiliser `tick={{ fontSize: 11 }}` et permettre aux légendes personnalisées de revenir à la ligne avec `flex flex-wrap gap-3`.

- [ ] **Step 3: Adapter budgets et modale**

Utiliser une colonne mobile, protéger chaque montant avec `break-words`, empiler les actions sous 400 px et donner à la modale le même contrat `max-h`/`overflow-y-auto` que les dépenses.

- [ ] **Step 4: Vérifier et committer**

Run: `npm run typecheck && npm test && npm run build`

Expected: exit 0 pour les trois commandes.

```bash
git add src/routes/_authenticated/dashboard.tsx src/routes/_authenticated/analytics.tsx src/routes/_authenticated/budgets.tsx
git commit -m "feat: adapter les vues financières à tous les écrans"
```

### Task 6: Adapter les routes secondaires

**Files:**
- Modify: `src/routes/_authenticated/ia.tsx`
- Modify: `src/routes/_authenticated/notifications.tsx`
- Modify: `src/routes/_authenticated/profil.tsx`
- Modify: `src/routes/_authenticated/parametres.tsx`
- Modify: `src/routes/_authenticated/abonnement.tsx`

- [ ] **Step 1: Appliquer les en-têtes partagés**

Remplacer les en-têtes de page par `PageHeader`, avec des actions `w-full sm:w-auto` et des boutons `w-full sm:w-auto`.

- [ ] **Step 2: Adapter IA, notifications et abonnement**

Utiliser `p-5 sm:p-8` pour le héros IA, `grid-cols-1 md:grid-cols-2` pour les recommandations, `grid-cols-1 sm:grid-cols-3` pour les métriques, et `grid-cols-1 lg:grid-cols-3` pour les abonnements. Dans les notifications, ajouter `min-w-0` aux textes et `break-words` aux descriptions.

- [ ] **Step 3: Adapter profil et paramètres**

Remplacer la grille profil par `grid grid-cols-1 gap-5 xl:grid-cols-[320px_1fr]`. Dans les paramètres, utiliser `grid-cols-1 md:grid-cols-2`, rendre les lignes de bascule `items-start sm:items-center`, et empêcher le bouton switch de rétrécir avec `shrink-0`.

- [ ] **Step 4: Vérifier et committer**

Run: `npm run typecheck && npm test && npm run build`

Expected: exit 0.

```bash
git add src/routes/_authenticated/ia.tsx src/routes/_authenticated/notifications.tsx src/routes/_authenticated/profil.tsx src/routes/_authenticated/parametres.tsx src/routes/_authenticated/abonnement.tsx
git commit -m "feat: finaliser le responsive des routes secondaires"
```

### Task 7: Ajouter le contrôle responsive de bout en bout

**Files:**
- Create: `e2e/responsive.spec.ts`

- [ ] **Step 1: Écrire le test de débordement public**

Créer `e2e/responsive.spec.ts` :

```ts
import { expect, test } from "@playwright/test";

const widths = [320, 375, 768, 1024, 1440];

for (const width of widths) {
  test(`public pages fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/auth"]) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
}
```

- [ ] **Step 2: Installer le navigateur Playwright**

Run: `npx playwright install chromium`

Expected: Chromium est installé sans erreur.

- [ ] **Step 3: Exécuter le contrôle responsive**

Run: `npm run test:responsive`

Expected: 5 tests PASS, un par largeur.

- [ ] **Step 4: Exécuter la validation complète**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run test:responsive
npm run build
git diff --check
```

Expected: toutes les commandes terminent avec le code 0. Si le lint échoue uniquement sur les fins de ligne existantes, normaliser les fichiers touchés avec `npx prettier --write` puis relancer toute la séquence.

- [ ] **Step 5: Commit**

```bash
git add e2e/responsive.spec.ts
git commit -m "test: vérifier les largeurs responsive"
```

### Task 8: Intégrer et déployer via GitHub

**Files:**
- No code changes expected.

- [ ] **Step 1: Synchroniser sans écraser le distant**

Run:

```bash
git fetch origin
git rebase origin/main
```

Expected: rebase réussi ou conflits résolus fichier par fichier sans utiliser `git push --force`.

- [ ] **Step 2: Pousser la branche principale**

Run:

```bash
git push origin main
```

Expected: GitHub accepte le fast-forward et Vercel démarre un déploiement Production.

- [ ] **Step 3: Vérifier Vercel**

Dans Vercel, ouvrir `Deployments`, attendre `Ready`, puis vérifier `/`, `/auth` et les routes authentifiées avec un compte de test aux largeurs 320, 375, 768 et 1440 px.

- [ ] **Step 4: Vérifier l'état Git final**

Run:

```bash
git status --short --branch
```

Expected: `main...origin/main` sans fichiers modifiés.
