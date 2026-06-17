# Refonte UX/UI — Application patient PWA « WPA » Wellpharma

Date : 2026-06-15 · Statut : validé (design approuvé) · Périmètre : **app patient uniquement** (`apps/patient`). L'admin n'est pas touché.

## Objectif

Élever l'app patient (fonctionnelle mais basique) vers un **healthtech grand public premium, mobile-first**, sans modifier la logique métier, les services ni l'API. Refonte **profonde** : système visuel + navigation/IA + parcours.

Direction visuelle retenue : **B — « Chaleureux & arrondi »** (coins ronds généreux, teintes douces, ligne de vie comme motif récurrent), avec la clarté aérée de la direction A.

Contrainte forte : **aucun changement de logique/services/API**. Les couches `data/*` (services démo↔réel), les routeurs tRPC et les schémas restent intacts. On refait l'UI qui les consomme.

## 1. Système visuel (tokens)

- **Couleurs** (charte) : primary `#009dc5`, primary-600 `#007e9e`, navy texte `#1d243f`, accent turquoise `#37bac9`, succès `#2bad70`, alerte/erreur. Surfaces : blanc + teintes douces `#f4fbfc` / `#f1f9fb`.
- **Rayons** généreux : cartes 20–24px, pills 999px, FAB rond. (signature de la direction B)
- **Élévation** douce : ombres diffuses légères, 1 niveau cartes + 1 niveau FAB/sheets. Pas de bord dur.
- **Typo** : Century Gothic (fallback Questrial). Échelle 12 / 14 / 16 / 19 / 24 / 30. Corps ≥16px, titres 500–600, deux graisses.
- **Icônes** : un seul set outline (lucide-react, déjà présent). Fin des emojis structurels (header, services, badges).
- **Ligne de vie** (`@wellpharma/ui/web` `LifeLine`, déjà fidèle au vrai asset) = motif récurrent : séparateur d'en-tête, états vides, cartes-clés.
- **Motion** (framer-motion, déjà dép.) : 150–300 ms, ease-out entrée / ease-in sortie, transitions d'onglet (cross-fade/slide), press-scale 0.97 sur cartes/boutons, listes en stagger léger. **`prefers-reduced-motion` respecté partout.**
- Mode **clair** en base ; dark mode = phase ultérieure (hors périmètre).

## 2. Navigation & IA

- **AppShell** persistant englobant les routes authentifiées :
  - **Barre de navigation basse**, 4 onglets : `Accueil` · `Mes soins` · `Prévention` · `Profil`. Onglet actif mis en évidence (couleur + indicateur). Cibles ≥44px, safe-area (`env(safe-area-inset-bottom)`).
  - **FAB Assistant** flottant (chatbot), persistant au-dessus de la barre.
- **Routes** :
  - `/` → Accueil
  - `/soins` → hub Mes soins (entrées Conseil `/conseil`, RDV `/rendez-vous`, Entretiens `/entretiens`)
  - `/prevention` → hub Prévention (sections Calendrier `/calendrier` + Défis + Conseils) — l'actuel `/prevention` (défis) et `/calendrier` sont regroupés.
  - `/profil` → Profil (compte, pharmacie de référence, consentements, notifications, installer PWA, déconnexion)
  - `/assistant` reste accessible (ouvert via le FAB, en bottom-sheet ou plein écran)
  - Recherche pharmacie `/pharmacies` : accessible depuis Accueil (si pas de pharmacie de référence) + Profil.
  - **Deep-links conservés** : chaque écran garde une URL.

## 3. Écrans

- **Accueil** : `LifeLine` + bonjour + date ; carte « ma pharmacie » (ouvert/fermé) ; carte « prochain rendez-vous » ; carte « temps fort prévention » (marronnier du mois) ; raccourcis. Si pas de pharmacie de référence → CTA recherche.
- **Mes soins** (hub) : 3 grandes entrées (Conseil, Rendez-vous, Entretiens) + activité récente. Chaque parcours conserve sa logique, restylé.
- **Prévention** (hub) : calendrier marronnier (mois/liste, filtres, vaccination en avant) + défis/quiz (profil points/badges, classement anonyme) + conseils.
- **Profil** : identité, pharmacie de référence, consentements, activer notifications, installer PWA, se déconnecter.
- **Assistant** : chatbot, disclaimer permanent, CTA conseil/RDV sur redirection.
- **Écrans de détail** (fiche pharmacie, recherche+carte, formulaires conseil/RDV/entretien, calendrier) : restylés au nouveau système (cartes rondes, en-têtes ligne de vie, motion).

## 4. Composants (dans `apps/patient`, réutilisables)

`AppShell` (layout + nav + FAB) · `BottomNav` · `AssistantFab` · `ScreenHeader` (titre + ligne de vie + retour) · `Card` / `StatCard` / `ActionTile` · `Sheet`/`BottomSheet` · `Chip` · `Badge` · `EmptyState` (avec ligne de vie) · `Skeleton`. Tokens et classes utilitaires centralisés dans `index.css`.

## 5. Accessibilité (non négociable)

Cibles ≥44px · corps ≥16px · contraste ≥4.5:1 · focus visibles · `prefers-reduced-motion` · labels ARIA (boutons icône, nav) · ordre de lecture logique · pas de troncature destructrice (Dynamic Type).

## 6. Mise en œuvre (incrémentale, vérifiée en preview)

1. **Fondations** : tokens + classes (`index.css`), primitives de composants, motion helpers. (Ligne de vie : déjà refaite, fidèle au vrai asset.)
2. **AppShell** : `BottomNav` + `AssistantFab` + routage IA (`/soins`, `/prevention` hub, `/profil`) + transitions d'onglet.
3. **Écrans** : Accueil → Mes soins → Prévention → Profil → écrans de détail restylés.
4. **Passe finale** : a11y + motion + `reduced-motion`, puis typecheck + build + lint + revue.

Vérification : typecheck/build/lint verts + parcours testés en preview (mode démo). Aucune régression métier (services/API inchangés).
