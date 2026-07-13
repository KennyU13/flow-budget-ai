# Conception multidevise et responsive de FlowBudget AI

## Objectif

Permettre la saisie et l'affichage fiables des dépenses et budgets en MGA, EUR et USD, avec des taux actuels ou historiques fournis par Frankfurter, tout en rendant l'ensemble de l'application utilisable de 320 px jusqu'aux grands écrans.

## Périmètre

Cette évolution couvre :

- la saisie multidevise des dépenses et des budgets ;
- la conservation du montant et de la devise d'origine ;
- la normalisation comptable en MGA au taux du jour de l'opération ;
- la conversion de l'affichage vers la devise préférée ;
- le cache et le repli des taux de change ;
- les tableaux de bord, graphiques, alertes et recommandations utilisant les mêmes conversions ;
- l'adaptation responsive de la page publique, de l'authentification et de toutes les routes authentifiées.

Sont exclus de cette première version : les cryptomonnaies, la conversion bancaire en temps réel, la modification manuelle des taux et les devises autres que MGA, EUR et USD.

## Modèle monétaire

### Règle comptable

MGA est la devise de normalisation interne, mais pas une contrainte de saisie. Chaque dépense et budget conserve :

- `original_amount` : montant saisi par l'utilisateur ;
- `original_currency` : `MGA`, `EUR` ou `USD` ;
- `exchange_rate_to_mga` : nombre de MGA pour une unité de la devise d'origine ;
- `amount_mga` : montant normalisé en MGA ;
- `exchange_rate_date` : date effective du taux utilisé.

Une saisie en MGA utilise un taux de `1`. Une saisie en EUR ou USD utilise le taux disponible pour la date de l'opération. Les calculs comptables utilisent toujours `amount_mga`. Le montant original n'est jamais réécrit lors d'un changement de devise d'affichage.

### Données existantes

Les colonnes `amount` des dépenses et `monthly_limit` des budgets existants sont interprétées comme des MGA. La migration initialise les nouveaux champs avec la valeur existante, la devise `MGA`, le taux `1` et la date de l'enregistrement ou du jour courant selon les données disponibles.

Les anciennes colonnes restent présentes pendant cette évolution pour limiter le risque de déploiement. Elles contiennent la valeur normalisée en MGA et deviennent des colonnes de compatibilité. Une suppression éventuelle fera l'objet d'une migration distincte après stabilisation.

### Devise d'affichage

La préférence `profiles.devise` reste la source persistante. Le stockage local sert uniquement de cache immédiat. Au chargement d'une session, la préférence Supabase est prioritaire puis synchronisée localement.

Toutes les valeurs visibles passent par un service monétaire unique. Ce service reçoit un montant MGA et une devise cible, applique le taux en cache, puis utilise `Intl.NumberFormat` avec un arrondi adapté : zéro décimale pour MGA, deux pour EUR et USD.

## Source et cycle de vie des taux

### Source principale

Frankfurter v2 est la source principale. Les paires nécessaires sont EUR/MGA, USD/MGA et EUR/USD. L'intégration utilise les taux historiques pour la date d'une dépense et les derniers taux disponibles pour les préférences d'affichage.

### Accès serveur

Le navigateur ne contacte pas directement Frankfurter. Une fonction serveur TanStack valide les devises et la date, consulte d'abord Supabase, puis appelle Frankfurter uniquement si le taux demandé manque ou est périmé.

Une table `exchange_rates` contient :

- `base_currency` ;
- `quote_currency` ;
- `rate` ;
- `rate_date` ;
- `source`, fixé à `frankfurter` ;
- `fetched_at`.

La contrainte unique porte sur `(base_currency, quote_currency, rate_date)`. Les clients authentifiés peuvent lire les taux. Seul le serveur peut les insérer ou les mettre à jour.

### Repli et erreurs

Pour une nouvelle dépense datée :

1. utiliser le taux exact si disponible ;
2. sinon utiliser le dernier taux officiel antérieur renvoyé par Frankfurter ;
3. si Frankfurter est indisponible, utiliser le dernier taux mis en cache datant de sept jours maximum ;
4. si aucun taux acceptable n'existe, bloquer l'enregistrement avec un message précis et conserver le formulaire rempli.

Pour l'affichage, le dernier taux connu peut toujours être utilisé. L'interface affiche la date du taux et un indicateur « taux ancien » au-delà de 48 heures.

## Flux de données

### Création d'une dépense

1. L'utilisateur saisit le montant, la devise et la date.
2. Le formulaire valide un montant strictement positif et une devise autorisée.
3. La fonction serveur récupère le taux vers MGA pour la date choisie.
4. Elle calcule `amount_mga` avec une précision décimale, sans calcul flottant cumulatif.
5. Elle écrit les données originales, le taux et le montant normalisé dans Supabase sous l'identité de l'utilisateur.
6. React Query invalide les dépenses, budgets, analytics, notifications et insights.

### Création d'un budget

Le même flux s'applique, mais avec le taux courant au moment de la création. Les dépenses sont comparées au budget à partir des valeurs normalisées en MGA. Une modification du budget crée une nouvelle normalisation avec le taux courant et conserve la devise choisie.

### Affichage

Les requêtes récupèrent les montants normalisés. Un contexte monétaire fournit la devise préférée, les taux actuels, la fonction de conversion et les métadonnées de fraîcheur. Toutes les pages utilisent cette interface au lieu de lire directement `localStorage`.

## Architecture du code

Les responsabilités seront séparées ainsi :

- `src/lib/money.ts` : types, arrondis, conversion pure et formatage ;
- `src/lib/exchange-rates.server.ts` : accès Frankfurter et cache Supabase ;
- `src/lib/exchange-rates.queries.ts` : requêtes client pour les taux d'affichage ;
- `src/components/money-provider.tsx` : préférence et service d'affichage partagé ;
- `src/components/money.tsx` : affichage accessible d'un montant et de la date du taux si nécessaire ;
- migration Supabase dédiée : colonnes multidevises, table de taux, contraintes et politiques ;
- formulaires dépenses et budgets : sélecteur MGA/EUR/USD et aperçu converti ;
- pages financières : remplacement de `fmtMGA` par le service partagé.

Les clés Supabase privilégiées et les écritures du cache ne sont jamais exposées au navigateur.

## Responsive global

### Règles communes

- largeur minimale prise en charge : 320 px ;
- contenu principal avec marges de 16 px sur mobile, 24 px sur tablette et 40 px sur desktop ;
- aucune page ne doit créer un débordement horizontal global ;
- zones interactives d'au moins 44 px sur mobile ;
- titres fluides et textes financiers autorisés à revenir à la ligne ;
- modales limitées à la hauteur de l'écran, avec contenu défilable et actions visibles ;
- formulaires sur une colonne en mobile puis deux colonnes lorsque l'espace le permet ;
- graphiques avec largeur dynamique, hauteur mobile réduite et légendes repliables.

### Navigation

La barre latérale desktop reste inchangée au-dessus du breakpoint `lg`. Sur mobile, elle s'ouvre en panneau, se ferme après navigation et conserve le focus clavier. L'en-tête réduit ou masque la recherche quand l'espace manque afin de préserver le menu et les actions essentielles.

### Dépenses

Le tableau desktop reste disponible à partir de `md`. Sous `md`, chaque dépense devient une carte indiquant description, montant original, montant converti, catégorie, date et actions. Les filtres et le bouton d'ajout occupent toute la largeur sur petit écran.

### Dashboard, analytics et budgets

Les cartes statistiques passent de trois colonnes à une colonne. Les graphiques ne descendent pas sous une hauteur lisible et les infobulles utilisent le service monétaire. Les budgets empilent leurs actions et protègent les montants longs contre le débordement.

### Authentification, profil, paramètres, IA et abonnement

Les panneaux, cartes, boutons et formulaires sont empilés sur mobile. Les sélecteurs de devise restent accessibles au pouce. Les offres d'abonnement et recommandations IA utilisent une seule colonne avant les breakpoints existants.

## Accessibilité

- chaque sélecteur de devise possède un label explicite ;
- les montants annoncés par lecteur d'écran incluent le code ISO ;
- les boutons icônes reçoivent un nom accessible ;
- les panneaux mobiles gèrent focus, touche Échap et retour du focus ;
- les états de chargement et d'erreur des taux sont annoncés sans dépendre uniquement de la couleur ;
- le contraste du thème clair et sombre est vérifié pour les nouveaux éléments.

## Tests et validation

### Tests unitaires

- conversion MGA, EUR et USD ;
- conversion croisée via MGA ;
- arrondis et formatage ;
- taux historique, taux antérieur et repli de sept jours ;
- rejet d'un montant nul, négatif ou d'une devise inconnue.

### Tests d'intégration

- création d'une dépense dans chaque devise ;
- création et modification d'un budget multidevise ;
- isolation RLS des taux en écriture et des données utilisateur ;
- changement de préférence mettant à jour toutes les pages ;
- panne Frankfurter avec cache valide et sans cache valide.

### Tests responsive

Les parcours principaux sont vérifiés à 320, 375, 768, 1024 et 1440 px : accueil, inscription, dashboard, dépenses, budgets, analytics, IA, notifications, profil, paramètres et abonnement. Aucun débordement horizontal n'est accepté. Les formulaires, modales, tableaux/cartes et menus doivent rester entièrement utilisables au clavier et au tactile.

### Critères de livraison

- lint, vérification TypeScript, tests et build réussissent ;
- une dépense EUR et une dépense USD produisent des totaux MGA cohérents ;
- changer la devise d'affichage ne modifie aucune valeur stockée ;
- la date et la source du taux sont consultables ;
- l'application reste utilisable avec Frankfurter indisponible lorsqu'un cache admissible existe ;
- toutes les routes sont utilisables sans défilement horizontal à 320 px ;
- la version Vercel est testée après application des migrations et variables d'environnement.

## Déploiement

1. Déployer la migration additive Supabase.
2. Déployer le code sachant lire les anciennes et nouvelles colonnes.
3. Vérifier la conversion et la saisie sur un compte de test.
4. Contrôler les journaux Supabase et Vercel.
5. Activer l'expérience multidevise pour tous les utilisateurs.

Le déploiement reste réversible côté application puisque les anciennes colonnes sont conservées. La migration n'effectue aucune suppression destructive.
