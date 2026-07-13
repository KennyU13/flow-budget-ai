# Conception de l'enregistrement des paramètres

## Objectif

Appliquer la langue, le thème, la devise et les préférences de notification uniquement après un enregistrement réussi, puis répercuter immédiatement le nouvel état dans toute l'application sans rechargement.

## Comportement

Au chargement, la page lit les préférences persistées et initialise deux états : les valeurs enregistrées et le brouillon éditable. Modifier un sélecteur ou un interrupteur ne change que le brouillon. L'interface globale reste inchangée jusqu'au clic sur `Enregistrer`.

Le bouton est désactivé pendant la sauvegarde et lorsqu'il n'existe aucune différence entre brouillon et valeurs enregistrées.

## Enregistrement atomique

Lors du clic :

1. valider langue, thème et devise ;
2. récupérer l'utilisateur authentifié ;
3. mettre à jour `profiles.devise` dans Supabase ;
4. si Supabase réussit, écrire toutes les préférences dans `localStorage` ;
5. appliquer la langue et le thème ;
6. publier `flowbudget:preferences-changed` avec les nouvelles préférences ;
7. invalider les requêtes financières concernées ;
8. remplacer les valeurs enregistrées par le brouillon ;
9. afficher la confirmation.

Si une étape distante échoue, aucune valeur du brouillon n'est écrite dans `localStorage`, aucun événement global n'est publié et l'ancienne configuration reste active.

## Propagation globale

L'événement de préférences transporte un objet typé contenant `language`, `theme` et `currency`. Un fournisseur de préférences partagé écoute cet événement et expose l'état courant aux composants. Les pages financières ne lisent plus directement `localStorage` pendant leur rendu.

La future conversion monétaire utilisera ce même fournisseur. Le changement de devise après sauvegarde déclenchera le reformatage et la reconversion de tous les montants visibles.

## Erreurs

- session absente : redirection vers l'authentification ou message de reconnexion ;
- écriture Supabase refusée : conserver l'ancien état et afficher l'erreur française ;
- stockage local indisponible après succès distant : afficher une erreur locale et conserver la préférence Supabase comme source au prochain chargement ;
- clics répétés : bloqués par l'état `saving`.

## Tests

- changer un champ ne modifie pas le thème ou la devise active ;
- le bouton reste désactivé sans changement ;
- une sauvegarde réussie applique toutes les préférences et publie un seul événement ;
- une erreur Supabase n'applique aucune préférence ;
- après succès, le bouton redevient désactivé ;
- les consommateurs reçoivent la nouvelle devise sans rechargement ;
- le comportement reste utilisable à 320 px.

## Critères de livraison

- aucune préférence n'est appliquée avant `Enregistrer` ;
- l'application entière reflète le nouvel état après succès ;
- aucune divergence locale n'est créée lors d'un échec Supabase ;
- lint, TypeScript, tests et build réussissent.
