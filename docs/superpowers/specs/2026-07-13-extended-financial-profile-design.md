# Conception du profil financier étendu

## Objectif

Enrichir le profil FlowBudget AI avec des informations personnelles et financières facultatives utiles à la personnalisation, tout en protégeant les données sensibles et en conservant une interface responsive.

## Informations collectées

### Identité

- prénom ;
- nom ;
- nom affiché ;
- date de naissance ;
- téléphone ;
- photo de profil existante.

L'email reste issu de Supabase Auth et n'est pas modifiable dans ce formulaire.

### Localisation et activité

- pays ;
- ville ;
- profession ;
- situation professionnelle ;
- biographie courte.

### Profil financier

- tranche de revenus mensuels ;
- objectif d'épargne mensuel ;
- nombre de personnes à charge ;
- devise préférée ;
- langue préférée ;
- consentement à l'utilisation des données financières de profil par l'assistant IA.

Toutes les nouvelles informations sont facultatives. La tranche de revenus propose : moins de 500 000 Ar, 500 000 à 1 500 000 Ar, 1 500 000 à 3 000 000 Ar, 3 000 000 à 5 000 000 Ar, plus de 5 000 000 Ar et préfère ne pas répondre.

## Modèle de données

Une migration additive complète `profiles` avec :

- `first_name` TEXT ;
- `last_name` TEXT ;
- `birth_date` DATE ;
- `phone` TEXT ;
- `country` TEXT ;
- `city` TEXT ;
- `profession` TEXT ;
- `employment_status` TEXT ;
- `bio` TEXT ;
- `income_range` TEXT ;
- `monthly_savings_goal` NUMERIC(12,2) ;
- `dependents` SMALLINT ;
- `language` TEXT avec défaut `fr` ;
- `ai_profile_consent` BOOLEAN avec défaut `false`.

Les contraintes imposent une date de naissance non future, une biographie de 300 caractères maximum, un objectif d'épargne positif ou nul, zéro à vingt personnes à charge, et des valeurs autorisées pour langue, tranche de revenus et situation professionnelle.

La politique RLS `profiles_self` existante continue d'isoler chaque profil. Aucun accès public n'est ajouté.

## Interface

La page utilise quatre cartes : aperçu, identité, localisation/activité et profil financier. À partir de `lg`, l'aperçu reste dans une colonne latérale et les formulaires utilisent la colonne principale. Sous `lg`, toutes les cartes s'empilent.

L'aperçu montre photo, nom affiché, profession, ville et pourcentage de complétion. Le calcul de complétion ignore l'email et compte uniquement les champs facultatifs renseignés.

Le formulaire maintient un état enregistré et un brouillon. Le bouton `Enregistrer` est désactivé sans modification. Une sauvegarde réussie met à jour Supabase puis l'interface globale ; une erreur conserve les anciennes valeurs actives et le brouillon afin que l'utilisateur puisse corriger ou réessayer.

## Validation

- prénom, nom, profession, ville et pays : 100 caractères maximum ;
- téléphone : 30 caractères maximum, chiffres, espaces et préfixe international autorisés ;
- date de naissance : non future ;
- biographie : 300 caractères maximum avec compteur ;
- objectif d'épargne : positif ou nul ;
- personnes à charge : entier de 0 à 20 ;
- devise : MGA, EUR ou USD ;
- langue : français, malagasy ou anglais.

La validation client améliore l'expérience, mais les contraintes PostgreSQL restent la protection de référence.

## Confidentialité et IA

Le téléphone, la date de naissance, le nom complet, la biographie, le pays et la ville ne sont jamais transmis à Gemini. Si `ai_profile_consent` vaut `true`, le serveur IA peut utiliser uniquement : tranche de revenus, objectif d'épargne, situation professionnelle et nombre de personnes à charge.

Le consentement est désactivé par défaut, expliqué en langage clair et révocable. Sa révocation empêche les futurs appels IA d'utiliser ces champs.

## Accessibilité et responsive

Chaque champ possède un label visible, une description pour les données sensibles et un message d'erreur associé. Les champs sont sur une colonne à 320 px puis deux colonnes à partir de `sm` lorsque leur contenu le permet. Les actions gardent une hauteur tactile minimale de 44 px et aucun débordement horizontal n'est accepté.

## Tests

- migration appliquée avec données existantes conservées ;
- chargement d'un profil partiellement rempli ;
- validation de chaque contrainte ;
- sauvegarde réussie et bouton redevenu inactif ;
- échec Supabase conservant le brouillon ;
- calcul de complétion ;
- isolation RLS entre deux utilisateurs ;
- consentement IA désactivé par défaut et révocable ;
- filtrage des champs transmis à Gemini ;
- interface utilisable à 320, 375, 768, 1024 et 1440 px.

## Déploiement

1. Appliquer la migration additive Supabase.
2. Régénérer les types Supabase TypeScript.
3. Déployer le nouveau formulaire.
4. Tester avec un profil ancien et un profil nouvellement créé.
5. Vérifier les politiques RLS et les journaux avant le déploiement général.

La migration ne supprime aucune colonne et reste compatible avec les profils existants.

## Critères de livraison

- toutes les nouvelles informations peuvent être enregistrées et rechargées ;
- aucune information sensible n'est publique ;
- le consentement IA contrôle réellement les données transmises ;
- le bouton ne sauvegarde que les modifications valides ;
- aucune donnée existante n'est perdue ;
- lint, TypeScript, tests et build réussissent.
