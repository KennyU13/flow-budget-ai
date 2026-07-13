# Conception du chat financier Gemini

## Objectif

Ajouter à FlowBudget AI un chat financier interactif capable d'expliquer les dépenses, budgets et tendances propres à l'utilisateur, sans exposer les clés, contourner le RLS ou présenter des suggestions comme des conseils financiers professionnels.

## Position dans la feuille de route

L'ordre de livraison est :

1. responsive global ;
2. conversion multidevise ;
3. chat financier Gemini.

Le chat dépend du service monétaire partagé afin que les chiffres transmis et affichés utilisent une devise et des arrondis cohérents.

## Expérience utilisateur

La route `/ia` conserve les insights déterministes existants et ajoute :

- un résumé financier généré à la demande ;
- un fil de conversation récent ;
- une zone de saisie multiligne ;
- des questions suggérées ;
- un indicateur de génération ;
- les faits chiffrés ayant servi à la réponse ;
- une priorité `faible`, `moyenne` ou `élevée` ;
- une liste d'actions proposées ;
- un avertissement permanent indiquant que l'assistant est éducatif.

Le chat est accessible uniquement après authentification. Les réponses sont affichées progressivement si l'API serveur permet le streaming sans fragiliser la validation finale ; sinon un état de chargement explicite est utilisé.

## Architecture

### Frontend

Le composant de chat gère uniquement l'affichage, la saisie et l'état de requête. Il ne connaît ni la clé Gemini ni les tables financières. Il envoie un texte nettoyé à une fonction serveur authentifiée et reçoit une réponse validée.

Les composants sont séparés en :

- conteneur de conversation ;
- liste de messages ;
- message utilisateur ou assistant ;
- formulaire de saisie ;
- faits financiers et actions ;
- état vide, erreur, quota et chargement.

### Serveur TanStack

Une fonction serveur :

1. vérifie la session Supabase ;
2. valide la question et sa longueur ;
3. applique le quota ;
4. charge les dépenses et budgets du seul utilisateur authentifié ;
5. calcule un résumé déterministe ;
6. charge les derniers messages nécessaires ;
7. construit le prompt système et le contexte ;
8. appelle Gemini ;
9. valide la sortie ;
10. enregistre la question, la réponse et les métadonnées ;
11. renvoie uniquement les champs destinés à l'interface.

Gemini n'a aucun outil lui donnant un accès direct à Supabase. Tous les calculs numériques importants sont réalisés par l'application avant l'appel au modèle.

### Modèle Gemini

Le modèle par défaut est `gemini-3.5-flash`, référencé par une variable serveur `GEMINI_MODEL`. La clé est lue depuis `GEMINI_API_KEY` dans Vercel et dans l'environnement serveur local. Aucune variable commençant par `VITE_` ne contient cette clé.

L'intégration utilise le SDK officiel `@google/genai` et une sortie structurée validée par Zod.

## Données transmises au modèle

Le contexte est volontairement agrégé :

- devise d'affichage ;
- mois analysé ;
- total du mois et comparaison au mois précédent ;
- sommes par catégorie ;
- limites de budget, consommation et dépassements ;
- dépenses récurrentes détectées ;
- cinq dépenses récentes au maximum, sans notes libres ;
- derniers messages utiles de la conversation ;
- question courante.

Ne sont jamais transmis : email, nom complet, identifiant Supabase, URL d'avatar, jetons, mots de passe, moyens de paiement complets ou notes susceptibles de contenir des secrets.

## Format de réponse

La réponse validée contient :

- `answer` : explication principale en français ;
- `priority` : `low`, `medium` ou `high` ;
- `facts` : liste de faits avec libellé, valeur formatée et période ;
- `actions` : zéro à trois actions concrètes ;
- `limitations` : hypothèses ou données manquantes ;
- `disclaimerRequired` : booléen imposant l'avertissement renforcé.

Le serveur rejette une réponse vide, hors schéma ou contenant des actions bancaires exécutables. Une tentative de réparation structurée unique est autorisée ; après un second échec, l'utilisateur reçoit une erreur générique et les détails restent dans les journaux serveur.

## Modèle de données

### `ai_conversations`

- `id` UUID ;
- `user_id` UUID ;
- `title` texte court ;
- `created_at` ;
- `updated_at`.

### `ai_messages`

- `id` UUID ;
- `conversation_id` UUID ;
- `user_id` UUID ;
- `role` limité à `user` ou `assistant` ;
- `content` texte ;
- `structured_payload` JSONB nullable ;
- `model` texte nullable ;
- `input_tokens` entier nullable ;
- `output_tokens` entier nullable ;
- `created_at`.

Les deux tables activent le RLS. L'utilisateur peut lire et supprimer ses conversations. Les insertions du rôle assistant et les métadonnées de modèle passent uniquement par le serveur. Une suppression de conversation supprime ses messages en cascade.

## Quotas et maîtrise des coûts

La première version applique :

- question de 3 à 1 000 caractères ;
- 10 messages par tranche de 10 minutes ;
- 30 messages par utilisateur et par jour ;
- cinq messages récents maximum dans le contexte ;
- contexte financier borné aux douze derniers mois ;
- délai maximal de réponse serveur ;
- une seule relance technique en cas de sortie invalide.

Les limites sont contrôlées côté serveur à partir des messages enregistrés. Un dépassement renvoie le prochain moment de disponibilité sans appeler Gemini.

## Garde-fous financiers

Le prompt système impose :

- ne jamais garantir une économie, un rendement ou un résultat ;
- ne pas recommander un produit financier précis ;
- ne pas exécuter de transaction ;
- distinguer les données observées des hypothèses ;
- citer les chiffres fournis dans le contexte ;
- reconnaître les données insuffisantes ;
- encourager un professionnel qualifié pour dette grave, investissement, fiscalité ou situation juridique.

Les actions proposées restent limitées à l'organisation budgétaire, au suivi, à la comparaison et à la réduction volontaire de dépenses.

## Gestion des erreurs

- clé absente : fonctionnalité désactivée avec message administrateur, sans révéler le nom du secret ;
- session absente : redirection vers `/auth` ;
- quota atteint : message avec délai ;
- Gemini indisponible : conservation de la question dans le formulaire et maintien des insights locaux ;
- sortie invalide : erreur contrôlée après une réparation ;
- données financières vides : réponse déterministe invitant à ajouter des dépenses, sans appel Gemini ;
- timeout : annulation de l'appel et possibilité de réessayer.

Les erreurs complètes sont journalisées côté serveur avec un identifiant de corrélation, mais sans prompt financier intégral ni clé.

## Responsive et accessibilité

À 320 px, le fil occupe toute la largeur, les faits et actions sont empilés, et la zone de saisie reste visible sans masquer le dernier message. Sur desktop, le chat et le résumé peuvent former deux colonnes.

La liste utilise une région live non intrusive pour annoncer les nouvelles réponses. Le formulaire possède un label, `Entrée` envoie et `Maj+Entrée` ajoute une ligne. Le focus revient dans la saisie après une réponse. Les priorités utilisent texte et icône en plus de la couleur.

## Tests

### Unitaires

- calcul du résumé transmis à Gemini ;
- suppression des données personnelles ;
- validation du schéma de réponse ;
- classification des demandes nécessitant un avertissement ;
- calcul des quotas ;
- traitement d'une sortie vide ou invalide.

### Intégration

- utilisateur authentifié recevant uniquement ses données ;
- refus sans session ;
- RLS empêchant la lecture croisée ;
- clé absente ;
- réponse Gemini valide ;
- timeout et panne API ;
- quota atteint sans appel externe ;
- conversation supprimée avec ses messages.

### Interface

- envoi au clavier et au bouton ;
- état de génération ;
- rendu des faits, actions, limites et avertissement ;
- conservation de la question en cas d'erreur ;
- absence de débordement horizontal aux largeurs 320, 375, 768, 1024 et 1440 px.

## Déploiement

1. Créer une clé Gemini dédiée et restreinte.
2. Ajouter `GEMINI_API_KEY` comme secret Vercel Production, Preview et Development.
3. Ajouter `GEMINI_MODEL=gemini-3.5-flash`.
4. Appliquer la migration des conversations et politiques RLS.
5. Déployer le serveur et l'interface.
6. Tester avec un compte de démonstration sans données sensibles.
7. Vérifier quotas, erreurs et journaux avant l'ouverture générale.

Le retrait de `GEMINI_API_KEY` désactive l'appel au modèle sans affecter les dépenses, budgets, analytics ou insights déterministes.

## Critères de livraison

- aucune clé Gemini dans le bundle client ou Git ;
- aucune donnée d'un autre utilisateur dans le contexte ou l'historique ;
- réponse validée avant affichage ;
- quotas appliqués avant chaque appel ;
- faits chiffrés calculés par l'application ;
- interface utilisable à partir de 320 px ;
- tests, lint, TypeScript et build réussis ;
- version Vercel testée avec Gemini disponible et indisponible.
