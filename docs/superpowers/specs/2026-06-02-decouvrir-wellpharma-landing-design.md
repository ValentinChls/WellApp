# « Découvrir Wellpharma » — Landing scroll premium

**Date :** 2026-06-02
**Projet :** Parcours Wellpharma — le pitch sur-mesure (`Wellpharma/Parcours-Wellpharma/index.html`)
**Type :** Nouvelle expérience « landing page » interactive, intégrée à l'outil existant.

## 1. Objectif

Ajouter, sur l'écran d'accueil, une 3ᵉ entrée **« Découvrir Wellpharma »** (à côté de « Démarrer le diagnostic » et « Explorer toutes les solutions »). Au clic, ouvrir une **landing page premium parcourue au scroll** qui recode, en version interactive et animée, le PowerPoint **« base prospection 2026.pptx »** (3 slides).

## 2. Contraintes (héritées de l'outil)

- **Fichier unique, hors-ligne, double-clic.** HTML/CSS/JS **vanilla** uniquement.
- **Pas de PrimeNG réel** (= Angular/build, incompatible fichier unique). On reproduit **l'esthétique des composants PrimeNG** (cards, panels, tags, stat tiles, timeline) en vanilla.
- Charte : cyan `#009dc5`, cyan foncé `#0089ac`, marine `#1d243f`, turquoise `#37bac9`, Century Gothic. Réutiliser les tokens et effets déjà en place (`--grad-cyan`, `--shadow`, `--shadow-cyan`, `.stagger`, `countUpAll`, etc.).
- **Logo** : utiliser le **vrai PNG Wellpharma tel quel, sans modification** → `assets/img/logo-groupement.png` (sur fond sombre : cartouche blanche `.cartouche` comme ailleurs dans l'app).
- **Contenu = strictement les 3 slides.** Aucun chiffre inventé.
- `prefers-reduced-motion` respecté (révélations/parallaxe/compteurs neutralisés).
- Intégré au build `_inline.js` (images en data-URI).

## 3. Intégration dans l'app

### 3.1 Entrée
- Accueil (`#accueil .ctas`) : ajouter un bouton **« Découvrir Wellpharma »**.
  - Style : variante premium claire (ex. `btn btn-ghost` avec une nuance ou un nouveau `.btn-discover`), distincte des deux autres CTA. Un seul CTA primaire reste « Démarrer le diagnostic » (règle `primary-action`).
  - `onclick="App.discover()"`.
- `App.discover()` : `renderDiscover()` (idempotent) puis `this.show('discover')`, scroll en haut.

### 3.2 Nouvel écran
- `<section class="screen" id="discover">` contenant :
  - un **en-tête sticky** `.disc-top` (logo cliquable → `App.home()`, mini-nav d'ancres, bouton « Démarrer le diagnostic → » → `App.start()`),
  - le **corps scrollable** `.disc-body` avec les sections.
- Sortie : logo → accueil ; **Échap** → accueil (étendre le handler keydown existant).
- L'écran s'ajoute au cycle `App.show` (déjà générique sur `.screen`). `home()`/`_resetSession()` ne sont pas impactés (la landing ne stocke pas d'état).

## 4. Sections (mapping 1:1 avec le pptx)

### S0 — Hero (slide 1, accroche)
- Plein écran, fond dégradé marine→cyan + photo d'officine (`hero.jpg` ou `P1100164…Salève`), **ligne-vie** en signature, **logo Wellpharma (cartouche)**.
- Titre : **« Notre promesse, votre performance. »**
- Baseline : *« Un groupement coopératif, engagé à vos côtés, pour une officine plus forte aujourd'hui et mieux préparée pour demain. »*
- CTA : « Démarrer le diagnostic → » + **chevron de scroll animé** (indice d'affordance).
- Parallaxe légère du fond au scroll (désactivée si reduced-motion).

### S1 — Les 3 promesses (slide 1)
- Titre de section : **« Notre promesse, votre performance »**.
- 3 **cartes premium** (look p-card, révélées en cascade) :
  1. **Gagner du temps & de l'argent** — *en optimisant vos achats, vos marges et vos ventes, pour vous concentrer sur l'essentiel : vos patients.*
  2. **Piloter votre officine** — *avec des données fiables et des outils performants.*
  3. **Développer votre rentabilité** — *grâce à un accompagnement 360° et des solutions innovantes.*
- Icônes en dégradé cyan (réutiliser le set d'icônes `IC`).

### S2 — 3 leviers à actionner (slide 2)
- Titre : **« Votre performance, 3 leviers à actionner »**.
- 3 blocs (façon p-panel/colonnes premium), chacun avec puces (chips/tags) :
  - **Sell In — Optimiser vos achats** : la force d'un groupement national fédéré (+150 accords partenaires · +10 000 produits sur les CAP · +100 agences de répartition) ; catalogue générique & biosimilaire exclusif (stock dédié au marché français, gestion automatique des commandes, contrôle des conditions commerciales) ; choix stratégiques assumés (compression / orthopédie / nutrition, larges gammes de MDD, le meilleur des filiales de La Coopérative Welcoop).
  - **Sell Out — Développer votre activité** : digitaliser l'expérience client-patient (carte de fidélité, Click & Collect, appli de santé, visibilité web) ; booster la dynamique commerciale (automatisation des promotions, trade dynamique, TG/IC rémunérés) ; développer les catégories produits/services (nouvelles missions, formation des équipes, merchandising / pharma staging).
  - **Analyse / Pilotage — Décider avec la data**.
- **Bandeau de 4 statistiques animées** (count-up) — *source Sloop Data, comparatif vs pharmacies de référence* :
  - **+4 pts** de pondéré générique perçu
  - **28 h** gagnées par mois
  - **+30 %** d'actes sur les nouvelles missions
  - **+10 %** de marge € dégagée (médicaments TVA 2,1 % équivalent)

### S3 — Votre potentiel (slide 3) — « L'analyse Sloop Data »
- Titre : **« Votre potentiel est déjà dans votre pharmacie. Nous l'identifions, vous l'exploitez. »**
- Sous-titre : *« Notre objectif : transformer ce potentiel en performance durable. »*
- **Visualisation data — FIDÈLE À LA SLIDE = barres comparatives horizontales** (pas de donut). Carte « L'analyse Sloop Data » contenant :
  - un **chip d'en-tête** : *« Flux TVA 2,1 % hors MDL 5 identique »* ;
  - un **en-tête de comparaison** : **Généraliste** `VS` **Wellpharma** (badge VS au centre) ;
  - **4 lignes** (une par tranche de TVA), chaque ligne = libellé à gauche + **2 barres horizontales** (Généraliste | Wellpharma) avec la valeur en %, **barres animées en largeur au reveal** (via `transform:scaleX`, origine gauche — perf) :

  | Tranche (libellé) | Généraliste | Wellpharma | Couleur barre (fidèle deck) |
  |---|---|---|---|
  | **TVA 0 %** — Nouvelles missions | **0,4 %** | **0,9 %** | marine |
  | **TVA 5,5 %** — CPAL, CNO… | **13,5 %** | **17,9 %** | bleu clair |
  | **TVA 10 %** — OTC, Matériel médical | **5,2 %** | **9,7 %** | bleu |
  | **TVA 20 %** — Soins, parapharmacie | **13,6 %** | **22,4 %** | gris |

  - Largeur des barres proportionnelle à la valeur (échelle commune, ex. 22,4 % = barre la plus longue). Valeur affichée dans/à côté de la barre. Wellpharma > Généraliste sur chaque tranche (message clé).
- **2 chiffres-clés animés (count-up), mis en avant en bas de la carte** (avec picto) : **+270 K€ de CA potentiel** · **+149 K€ de marge** *(base 1,5 M€ TVA 2,1 %)*.
- Rappel possible : **CA HT 2,05 M€** (contexte).

### S4 — CTA final
- Bandeau premium : **« Transformez ce potentiel en performance durable »**.
- Boutons : **« Démarrer le diagnostic → »** (`App.start`) + **« Prendre rendez-vous »** (`App.openAgenda`).

## 5. Composants « look PrimeNG » (vanilla)

| PrimeNG | Équivalent vanilla |
|---|---|
| `p-card` | `.disc-card` : surface blanche, coins 16px, ombre `--shadow`, en-tête icône dégradé |
| `p-panel` | bloc levier avec barre de titre colorée |
| `p-tag`/`p-chip` | puces des leviers |
| stat tiles | tuiles compteur (réutiliser `countUpAll`) |
| `p-timeline` | étapes (si utile dans S2/S4) |
| `p-button` | boutons premium existants |
| `p-chart` (donut) | donut SVG maison animé |

Tons et typo = charte Wellpharma (pas le bleu PrimeNG par défaut).

## 6. Interactions premium

- **Reveal au scroll** : `IntersectionObserver` ajoute `.in` aux sections/cartes (fade + translateY, easing `--ease`), en **cascade** (delays nth-child).
- **Compteurs** : déclenchés au reveal de leur bloc (réutiliser/adapter `countUpAll`).
- **Donuts** : animation stroke-dashoffset au reveal.
- **Parallaxe hero** : translateY léger du fond sur `scroll` (throttlé via rAF), désactivé si reduced-motion.
- **Nav d'ancres sticky** : surligne la section visible (via l'observer).
- **Scroll fluide** vers les ancres (`scrollIntoView({behavior:'smooth'})`, `auto` si reduced-motion).
- Tous les écouteurs scroll/observer sont attachés une seule fois (à la 1ʳᵉ ouverture) et nettoyés/inertes hors de l'écran `#discover`.

## 7. Accessibilité

- En-tête : logo `alt`, nav d'ancres au clavier, bouton CTA focusable.
- Hiérarchie de titres cohérente (h1 hero → h2 sections).
- Contraste texte ≥ 4.5:1 (texte clair sur fonds sombres, navy sur clair).
- Donuts : fournir une **légende texte** + valeurs lisibles (pas couleur seule).
- `prefers-reduced-motion` : neutralise reveal/parallaxe/compteurs (contenu immédiatement lisible).
- Échap pour quitter (escape-route).

## 8. Build & livrable

- Tout en vanilla dans `index.html`. Images via chemins littéraux `assets/img/...` → inlinées par `_inline.js`.
- Régénérer `Parcours-Wellpharma-standalone.html` après implémentation.
- Tester : ouverture/sortie, reveal au scroll, compteurs, donuts, nav d'ancres, reduced-motion, responsive (≥ 768), 0 erreur JS.

## 9. Hors périmètre (YAGNI)

- Pas de PrimeNG/Angular réel, pas de nouvelle dépendance.
- Pas de nouveau contenu au-delà des 3 slides.
- Pas de refonte des écrans existants (seul ajout : le bouton accueil + l'écran `#discover`).

## 10. Révision 2026-06-02 — 11 corrections (validée)

Après première implémentation, passe de fidélité au PPTX + UX. Décisions retenues :
**routine de performance recréée en vanilla** (icônes charte) ; **couleurs TVA multi-teintes distinctes** (turquoise/cyan/bleu profond/ardoise).

1. **Accueil** — aligner les 3 CTA (`#accueil .ctas`) : centrage vertical, même hauteur/ligne de base ; « Découvrir Wellpharma » homogène avec les deux autres.
2. **Hero** — logo `assets/img/logo-groupement.png` (inchangé) dans une **cartouche blanche** au-dessus du `h1` (fond sombre).
3. **Promesse** — scinder en **4 cartes (2×2)** : *Gagner du temps* · *Gagner de l'argent* · *Piloter votre officine* · *Développer votre rentabilité*, chacune avec une **checklist d'arguments repris du PPT** (catalogue intégré id., gestion auto des commandes, 28 h/mois, 2 pts de marge brute, accord 96 % du répertoire, 50 % de marge MDD, +50 promos/mois, accompagnement 360°…).
4. **Leviers** — agrandir les **titres bleus** de Sell In / Sell Out / Analyse-Pilotage, hiérarchie homogène sur les 3.
5. **Leviers** — remplacer les chips par une **checklist à pastille cyan ✓** identique aux modules (`.plist .it .ck`).
6. **Leviers** — **tuiles cliquables** : Sell In → `openModule('sellin')`, Sell Out → `openModule('sellout')`, Analyse-Pilotage → `openModule('performance')` ; tuile entière focusable (clavier) + lien « Voir le module → ».
7. **Sloop Data** — bandeau pleine largeur sous les leviers : **photo `assets/img/sloop-data.png`** (logo Sloop inclus) + **4 stats animées** (+4 pts · 28 h · +30 % · +10 %) + source.
8. **Potentiel** — ajouter la carte **« LE MARCHÉ — Répartition du CA par taux de TVA »** (donut SVG animé) — valeurs réelles du chart PPT : **TVA 0 % = 0,4 % · 2,1 % = 73,5 % · 5,5 % = 10,3 % · 10 % = 4,3 % · 20 % = 11,5 %** ; centre « CA HT 2,05 M€ (hors MDL 5) ».
9. **Potentiel** — recolorer les barres comparatives TVA en **multi-teintes distinctes** (même palette que le donut).
10. **Potentiel** — ajouter **« Notre routine de performance »** (slide 3) : 4 étapes **Je forme · Je communique · Je théâtralise · Je fidélise** recréées en vanilla (icônes charte, révélées au scroll).

Sources de contenu : `base prospection 2026.pptx` (slides 1-3, `<a:t>` + `ppt/charts/chart1.xml`) et la brochure groupement (`document.txt`). Aucun chiffre inventé.
