# Cockpit pharmacien — refonte UX du back-office (design)

Date : 2026-06-17 · Boussole : **cockpit du quotidien** (la vitesse = l'effet whaou).
Périmètre : **vue pharmacien uniquement** (`ADMIN_PHARMACIE`). Le groupement garde
son tableau de bord riche actuel, inchangé.

## Problème
Le back-office pharmacien est dense et passif : tableau de bord = 8 KPI à plat sans
fil d'action ; relance unitaire (pas de lot) ; aucune recherche/filtre sur les listes
(Conseils, Entretiens, Patients) ; page Patients non responsive ; erreurs sans
« Réessayer ». Le pharmacien, pressé et interrompu au comptoir, ne sait pas « par quoi
commencer » et fait trop de clics.

## Principe
Passer d'un mur de KPI à un **flux d'actions du jour**, avec actions en ligne et
ergonomie de listes homogène. Approche **C — cockpit hybride, étagé**.

## Étape 1 (ce qui est construit maintenant)
1. **Accueil « Mon comptoir — Aujourd'hui »** (pharmacien) — remplace le dashboard
   pour ce rôle ; KPI/graphes démotés sous le flux (section « Statistiques » repliable).
   - En-tête (bonjour + officine + date) + indice Ctrl-K (préfigure l'étape 2).
   - 3 cartes : À traiter · CA Ameli aujourd'hui · RDV du jour.
   - Flux « À traiter maintenant » alimenté par `cockpit.today` (agrégateur) :
     missions à valider (`COMPLETEE`/`A_VALIDER`), conseils nouveaux, **relances
     suggérées** (affectations `PROPOSEE`/`EN_COURS` inactives depuis +5 j), prochain RDV.
     Chaque item = action en ligne (Valider / Répondre / Tout relancer / Agenda).
   - État zéro : félicitation + bascule « opportunités de la semaine ».
2. **Relance en lot** — `missions.relanceBatch` (liste d'ids) ; UI sur le cockpit
   (« Tout relancer ») + sur l'inbox missions.
3. **Ergonomie de listes** — composant partagé `ListToolbar` (recherche + filtre
   statut + tri), filtrage client, appliqué à Conseils, Entretiens, Patients, Missions.
4. **Patients responsive** — 2 colonnes empilées < `md` + recherche instantanée.
5. **Résilience** — composant `RetryState` (message + « Réessayer » → refetch) sur
   les requêtes ; `EmptyState` partout.

## Étape 2 (jalon suivant, non bloquant)
Palette de commandes **Ctrl-K** (`cmdk`) : chercher patient/mission et agir sans naviguer.

## Architecture / isolation
- API : `cockpit.today` (pharmacyProcedure, lecture seule, réutilise les requêtes
  existantes : missionAssignment, demandes de conseil, rendez-vous, kpiEvent) ;
  `missions.relanceBatch`. **Aucun nouveau modèle de données.**
- Front admin : `cockpit-client.tsx` (accueil pharmacien) ; routage `/` branche
  pharmacien→Cockpit, groupement→dashboard actuel. Composants partagés
  `ListToolbar` + `RetryState`. Réutilise `Card`/`Button`/`StatCard`/`EmptyState` +
  palette de marque `#009dc5`.

## Données
`cockpit.today` retourne : `counts` (à traiter), `caAmeliToday` (somme forfaits des
missions validées aujourd'hui), `rdvToday`, et `items[]` ({type, title, subtitle,
count, href}) classés par priorité. Pas de donnée de santé en clair (alertes
génériques ; le détail reste derrière les pages tracées existantes).

## Vérification
Typecheck par package + builds prod + parcours live (cockpit, relance en lot, filtres,
responsive). Standard tenu sur tout le projet.
