# Parcours Wellpharma — le pitch sur-mesure

**Date :** 2026-05-22 · **Statut :** Design v2 (révisé après ajout du scoring d'adhésion ; en attente de relecture utilisateur)
**Type :** Maquette interactive HTML autonome (outil commercial) · **Confidentialité : INTERNE — « Wellpharma – Confidentiel, ne pas diffuser »**

---

## 1. Objectif & contexte

Fichier **HTML unique, autonome, hors-ligne** que les commerciaux Wellpharma ouvrent en rendez-vous
pharmacien. L'outil **diagnostique les attentes** du pharmacien, en déduit **(a)** un **parcours
sur-mesure** de modules-récits et **(b)** un **niveau d'adhésion recommandé** (score sur 4 solutions),
le tout dans une esthétique premium conforme à la charte. Objectif : **impressionner** + **qualifier**
le prospect (quelle offre lui proposer).

**Sources de contenu (par ordre d'autorité) :**
1. **`Presentation groupement WA.pptx` (52 slides, confidentiel)** — deck corporate maître : chiffres,
   écosystème Welcoop, **les 4 offres**, conditions génériques/grossistes.
2. `Présentation Well Anton mai 2026 v3.pptx` (15 slides) — Sell In/Out, Sloop Data, réussites, missions.
3. Brochure groupement + charte graphique (déc. 2024) + site wellpharma.com.
**+ `Presentation groupement Nouvelle base prospection.pptx` (17 slides) — DECK DE PROSPECTION CANONIQUE** :
pitch prospect + performance affinée (pharmacie témoin 620 K€ vs top performer A&W 811 K€, **+67 %**) +
parcours de vie pro. **Logos officiels fournis** (`.ai` = PDF) : Wellpharma + Anton & Willem.
Données brutes archivées : `_pptx_prosp/`, `_pptx_wa/`, `_pptx_extract/`.

## 2. Utilisateurs & contexte d'usage

- **Utilisateur :** commercial Wellpharma (animateur réseau / dev). **Spectateur :** pharmacien titulaire.
- **Device :** laptop 16:9 (1280–1920 px), face-à-face, écran tourné vers le pharmacien ; lisible en
  projection ; souris/trackpad ; dégradé propre jusqu'à ~1024 px. **Hors-scope : smartphone.**
- **Hors-ligne obligatoire.**

## 3. Principes de design

- **100% charte** (tokens §9). Police Century Gothic (+ fallbacks). Signature animée : la **« ligne de vie »**.
- Base **Clarté Premium** ; **Cockpit Data** sur Performance/Sloop/Génériques (gros chiffres) ;
  chaleur **Humain** sur Réussites/Missions/Enseignes.
- **YAGNI :** pas de framework, backend, multilingue, mobile. Pas de simulateur de marge éditable
  (les chiffres réels sont affichés). Le **scoring** est la seule logique « calculée ».

## 4. Architecture de l'expérience (hybride A→B→C + scoring)

1. **Accueil (Splash).** Logo, tagline « Vous faire gagner du temps et de l'argent · MESUREZ · PILOTEZ ·
   PERFORMEZ », ligne de vie animée, bandeau discret « Confidentiel ». Entrées : **Démarrer le
   diagnostic** (défaut) · **Mode Hub libre**.
2. **Le Profileur (A).** Champ optionnel *nom de la pharmacie*. Grille des **5 portes d'entrée**
   (cartes multi-sélection, §6). Chaque porte alimente **simultanément** le parcours de modules **et**
   le score d'adhésion. Une jauge « niveau d'adhésion » se met à jour **en direct** à chaque clic.
3. **Génération du parcours.** Animation « On construit le parcours de la *Pharmacie X*… » → révèle :
   **(a)** le **niveau d'adhésion recommandé** (gauge 4 paliers + offre conseillée, §7) ; **(b)** le Hub.
4. **Le Hub priorisé (B).** Modules des portes cochées en grandes cartes (triés par priorité) ; reste
   en tuiles. Chrome persistant : logo, nom pharmacie, **mini-jauge d'adhésion**, fil ligne de vie,
   Mode présentation, retour accueil. Navigation non-linéaire.
5. **Modules-récits (C).** Écrans focalisés, KPIs animés, preuves chiffrées sourcées (§7).
6. **Synthèse « Passons à l'action ».** Récap personnalisé : leviers retenus + **offre recommandée**
   (cotisation, bénéfices clés) pour la *Pharmacie X* + CTA « Prenez rendez-vous · C'est signé ».

**État :** `nomPharmacie`, `portesCochees[]`, `scoreParPalier{}`, `positionnementEnseigne`, `paliarRecommande`,
`paliarChoisiManuel?`, `ecranCourant`, `moduleCourant`, `modePresentation`.

## 5. Modèle de contenu

`MODULES[]` (rendu découplé) + `PORTES[]` (5 portes d'entrée, chacune `{ id, libelle, icone,
modules:[...], poidsPaliers:{T1,T2,T3,T4} }`) + `PALIERS[]` (les 4 offres, §7.0) + curseur
`positionnementEnseigne` (généraliste|nature). Ajouter du contenu = éditer ces tableaux. Transparent et ajustable.

## 6. Le Profileur — 5 portes d'entrée → modules + niveau d'adhésion

Le commercial coche **les portes d'entrée** qui font réagir le pharmacien (multi-sélection). Chaque porte
**ouvre des modules** (le parcours) **et** pousse un score d'**intensité d'engagement** (le niveau d'adhésion).

| # | Porte d'entrée (ce que le pharmacien veut) | Modules ouverts |
|---|---|---|
| 1 | 📈 **Développer la dynamique commerciale** | Dynamique commerciale & MDD, Sell Out, Promotions, fidélisation, concept retail |
| 2 | 🚀 **Développer les nouvelles missions** | Nouvelles missions (prévention/vaccination, CPTS, parcours patient), D Medica |
| 3 | 💊 **Obtenir les meilleures conditions génériques** | Génériques (Cristers n°1 / Biogaran n°2), accord 96 % |
| 4 | 🛒 **Meilleures conditions d'achats & de négociation** | Conditions commerciales (CAP, grossistes, labos), PharmaLab, Marque Verte |
| 5 | 🤝 **Être accompagné & mener vos projets managériaux** | Accompagnement, Audit & Pactes de Progrès, MyPilot, Formation, Projets & financement, Pharm'Access |

**Du score au niveau d'adhésion (les 4 solutions).** L'intensité cumulée positionne le prospect sur l'échelle :
- conditions seules (portes 3-4) → **T1 Liberté** (profiter des conditions sans enseigne) ;
- besoin d'accompagnement/pilotage (porte 5, ± missions) → **T2 Privilège Performance** ;
- volonté de **dynamique commerciale complète** (porte 1 : MDD, app santé, promos, concept) → niveau **Enseigne** ;
- au niveau Enseigne, un **curseur de positionnement** tranche entre les 2 enseignes :
  **généraliste → T3 Enseigne Wellpharma** · **spécialiste médecines naturelles → T4 Anton & Willem**.

**Poids par palier (valeurs de départ, paramétrables dans le modèle de contenu §5) :**

| Porte | T1 Liberté | T2 Privilège Perf. | T3 Ens. Wellpharma | T4 Ens. A&W |
|---|---|---|---|---|
| 1 · Dynamique commerciale | 1 | 2 | **3** | 2 |
| 2 · Nouvelles missions | 0 | 2 | 2 | 1 |
| 3 · Conditions génériques | **2** | 2 | 1 | 1 |
| 4 · Conditions achats/négo | **2** | 2 | 1 | 1 |
| 5 · Accompagnement & projets | 0 | **3** | 2 | 1 |

Gauge live (se remplit à chaque porte) + justification auto + **override manuel**. **T4 (A&W) ne se
déclenche pas par la seule intensité** : il s'active via le curseur « médecines naturelles » au niveau
Enseigne (A&W = une spécialisation, pas seulement « plus engagé »). Poids/seuils à affiner avec le terrain.

## 7. Catalogue des modules (périmètre complet, données réelles sourcées)

### 7.0 ★ Offres & Enseignes — les 4 solutions  *(skin premium → cockpit, cœur du scoring)*
Gauge + 4 cartes-offres (slides 17-21, 50). « 4 solutions adaptées à votre mode de fonctionnement —
une liberté d'adhésion ». Au niveau **Enseigne**, un curseur de positionnement (généraliste / spécialiste
médecines naturelles) sélectionne **Wellpharma (T3)** ou **Anton & Willem (T4)**.
- **T1 · Liberté (Pack Privilège)** — *sans enseigne, 125 € HT/mois.* « Garder son autonomie » : CAP
  performante, forte dynamique commerciale, accords génériques & grossistes, pilotage **My Pilot Data**,
  Intranet. Leviers Business/Catégories/Laboratoires/Clients.
- **T2 · Pack Privilège Performance** — *sans enseigne, 235 € HT/mois.* « Être accompagné pour
  maximiser temps & remises » : **Audit & Pactes de Progrès by Wellpharma**, contrôle des conditions,
  feuille de route + objectifs annuels, **My Pilot Premium** (merch/prix/animations/équipe), programme
  relationnel + visibilité web. **35 h/sem** gagnées, jusqu'à 10 produits/mois Club TG.
- **T3 · Enseigne Wellpharma** — « Allier performance économique & éducation à la santé ». App santé
  exclusive, accompagnement digital complet (web, avis, Click & Collect, réseaux), programme relationnel,
  **+150 produits MDD Wellpharma**, concept & identité visuelle forte. **+60 K€ de marge brute**, **41 %
  de taux de marque** sur produits Wellpharma, +7 € panier moyen parapharmacie, +17 K€ honoraires entretiens.
- **T4 · Enseigne Anton & Willem** — « La santé autrement ». **Spécialiste médecines naturelles &
  alternatives** (aroma/phyto/homéo/compléments/cosmétique nature) : assortiment clé en main (50 % du CA
  hors ordonnance), **retrait de 100 % de la parapharmacie classique**, assortiment par pathologie
  homogène réseau, **+400 produits MDD A&W** (**50 % de taux de marque**), 50 marques partenaires, app
  **Anton&Moi**, +15 pharmacies/an. **Contrat 7 ans + exclusivité territoriale** (bassin 50 000 hab.,
  villes > 50 000 hab.) ; cible jeune génération en installation. **Top performers réseau : +67 % de
  valeur créée** vs moyenne marché (deck prospection).

### 7.1 Performance & Marge — Expert de la Data  *(skin cockpit)*  ★ HERO
**Récit prospect (deck prospection, slides 9-14) :** sur une **base 100 comparable** (socle 2,1 %),
**pharmacie témoin moyenne marché = 620 K€ de marge brute** vs **top performer réseau Anton & Willem
= 811 K€** (CA 2,08 → 2,43 M€) → **+67 % de valeur créée**, avec charges maîtrisées (local/stocks/
personnel dans la moyenne). Levier : déplacer le CA vers les catégories à forte marge (BASE 100 € →
+33 € à +400 € selon TVA/catégorie).
Message Sloop : selon l'engagement (Classique→Réseau→TOP), marge ~27-30 % → **~38 %+** = centaines de K€.
Données réelles slides 6-8 (Anton) : socle 2,1 % = BASE 100 €, marges par TVA, projections K€
(820/1 413/1 530/2 050/2 520 K€), CA additionnel par catégorie (Home test, CPAL, contention/ortho,
nutrition ; ×2,5). **My Pilot** (deck WA slide 47) : **8 leviers de croissance**, comparaison panel/marché,
**500 adhérents** utilisateurs, Top 25 génériques. **Audit & Pactes de Progrès** (slide 45) : +17 % CA
parapharmacie, 20 K€ trésorerie, 1 h/j gagnée, +5 % ventes merch. « Wellpharma – Expert de la Data ».

### 7.2 Génériques — le moteur de marge  *(skin premium + cockpit)*  ★ APPROFONDI
3 sous-écrans :
1. **Pourquoi le générique fait votre marge** + **5 critères de choix d'un labo** : qualité/sécurité
   (fabrication FR/UE, BPF), couverture du répertoire, **taux de service** (anti-rupture), conditions/marge,
   exclusivité & intégration LGO id.
2. **L'accord Wellpharma** (slide 25) : **catalogue générique WA sur 96 %** des conditions négociées ·
   stock protégé sur molécules en tension · **+5 %** de remises additionnelles CAP · gestion automatisée
   commandes & ruptures à la molécule via **id.** · **+10 K€ de marge** vs marché (pharma 2 M€).
   Stratégie : **Cristers en n°1** (optimiser les conditions) + **Biogaran en n°2** (couverture & gestion).
3. **Nos deux labos phares** (slides 9, 24-32) :
   - **Cristers — le générique de la coopérative.** *Seul génériqueur français détenu par une coopérative
     de pharmaciens (Welcoop).* 450 présentations, **+18 % du Top 100**, fabrication française privilégiée,
     30 nouvelles présentations/an, **dividende coopératif 18 % sur le net**. Remise pondérée brut **sans
     exclusion : 45,9 % → 50 %** selon le CA (grilles 15-50 K€ → >150 K€). **252 adhérents Cristers 1/Biogaran 2**.
   - **Biogaran — le n°1 français.** > 1 000 références, 50 % de production en France, **n°2 de l'accord WA**
     (couverture & facilité de gestion), expert **biosimilaires** ; coopération commerciale + booster 2025.
   - Roadmap : **biosimilaires**, **OTC 2026**.

### 7.3 Dynamique commerciale & MDD  *(skin premium → humain)*  ★ MIS EN AVANT
Message : Wellpharma **pousse** le commerce dans l'officine, clé en main.
- **Promotions poussées par le groupement** (slide 48) : **+100 actions promotionnelles/mois**,
  **merchandising ×3** sur les produits mis en avant, **+10 %** de remise produits CAP en TG,
  **+40 dossiers de merchandising** sur 7 catégories, plan d'animation annuel — service clé en main.
- **MDD / marques propres** (margeur n°1) : **Marque Verte** (labo produits exclusifs Welcoop, **+10 K€
  de marge** vs leaders, +4 % dividendes) · **MDD Wellpharma** (+150 réf, **41 % de marque**) · **MDD
  Anton & Willem** (+400 réf, **50 % de marque**).
- Fidélisation, concept retail, premiumisation, programme relationnel (Club Wellpharma / Anton&Moi).

### 7.4 Sell In — stratégie d'approvisionnement  *(skin premium)*
Canaux maîtrisés/intégrés · référencements resserrés · produits exclusifs générateurs de marge ·
centrale (3 500 produits, 150 accords, 100 agences) · **100 % des achats intégrés à id.** ·
**PharmaLab** (import européen : +3 K€ marge/an, +1 €/boîte, biosimilaires vs grossiste). Renvoie 7.2.

### 7.5 Sell Out — parcours patient & digital  *(skin humain)*
Écosystème digital unique 100 % connecté à id. · app santé/relation patient · merch & parcours patient ·
analyse. Renvoie 7.3.

### 7.6 Nouvelles missions  *(skin humain)*
Prévention & vaccination du voyageur (slide 15 Anton) : 1er groupement engagé, ×3 en quelques mois,
12 pilotes, 2025 → national 2026, jusqu'à 2 h de gain d'accès aux soins, +10 retombées presse, 54
adhérents. CPTS/MSP, parcours de soin, **D Medica** (prestataire santé à domicile : MAD, perfusion,
nutrition, diabète, respiratoire ; ISO 9001 ; 20 % remise ; +4 % dividendes).

### 7.7 Réussites récentes  *(skin humain)*  ★ WOW
Galerie **avant/après** interactive (slider drag-to-reveal) : St Nazaire, Pontivy, Sainte Luce, Angers,
Coulommiers, St Maximin, Liverdun, Port la Nouvelle.

### 7.8 Accompagnement sur-mesure  *(skin premium)*
Animateur Réseau (slide 36) · équipe d'experts · **20 ans d'expérience** · 50+ événements/an · séminaire
national. **Formation** (slide 49) : **+300 formations** e-learning/présentiel, 8 h/mois gagnées, 17 K€
de perte évitée/an, Démarche Qualité.

### 7.9 Indépendance & écosystème coopératif Welcoop  *(skin premium)*
Filiale de **La Coopérative Welcoop**, **100 % détenue par des pharmaciens** · 30 % adhérents Wellpharma
/ 70 % coopérateurs Welcoop · modèle coopératif vs capitalistique vs répartiteur · **jusqu'à 50 K€/an
reversés** (dividendes + CAP+) · **transparence totale**. Chiffres : **450 pharmacies**, **85 000
patients/jour**, **900 M€ de CA/an**, **15 présidents de région**, conseil de surveillance de pharmaciens.
Écosystème : **Equasens/id.** (logiciel), **CAP**, **Cristers**, **Marque Verte**, **D Medica**,
**PharmaLab**, **Pharm'Access**.

### 7.10 Conditions commerciales  *(skin premium)*
Génériqueurs + grossistes + laboratoires · niveau d'engagement groupement · temps réel · pilotage
automatisé. **Grossistes** (slides 22-23) : **+1/3 de la marge** passe par les achats grossistes ;
**+12 K€** de remise vs marché ; conditions 2025 (Prix Pharmacien / OP / Enseigne : remises 3,3 % → 4,3 %).
Jusqu'à **2 points de marge brute** en plus.

### 7.11 Projets & financement  *(skin premium)*
« Menez à bien vos projets » : accompagnement entrepreneurial · études · MSP/CPTS · **cession** ·
robotisation · financement adapté garantissant l'indépendance · **Pharm'Access** (1er transactionnaire à
appartenir à une coopérative de pharmaciens ; reprises d'officines). **Accompagnement sur toute la vie pro**
(deck prospection slide 15) : Étudiant (formation, mentorat) · Installation (coaching, offre primo-installant) ·
Investissement (associations, agrandissement/transfert, robotisation) · Nouveau départ (repreneurs, mentoring
transgénérationnel, plan retraite). **Welcoop Coordination** : MSP/CPTS, EHPAD, HAD, parcours coordonné.
Cible la priorité projet (T1→T4).

## 8. Effets whaou
1. **Ligne de vie vivante** (draw + pulse) = signature + navigation.
2. **Jauge « niveau d'adhésion » live** : se remplit à chaque attente cochée, révèle l'offre conseillée — *outil de qualification spectaculaire*.
3. **Personnalisation** du nom de la pharmacie (titres, synthèse, CTA, offre).
4. **KPIs en count-up** sur canvas Cockpit (+60 K€, 50 % marge MDD, 96 %, 500…).
5. **Génération « parcours sur-mesure »** animée.
6. **Slider avant/après** (réussites). 7. **Mode présentation** plein écran + flèches.

## 9. Architecture technique
- **1 fichier `index.html`** : CSS + JS inline, logo/icônes **SVG inline**, photos **base64 compressé**.
  **Zéro dépendance, zéro réseau.** Gestionnaire d'écrans vanilla ; modules & attentes rendus depuis §5 ;
  moteur de scoring = simple somme pondérée ; animations CSS + rAF (count-up).
- **Tokens couleurs :** cyan `#009dc5` · marine `#1d243f` (texte) · blanc `#ffffff` · gris `#585856` ·
  turquoise `#37bac9` · verts `#6cbe99`/`#2bad70` · lime `#afca0b` · orange `#f39655` · jaunes
  `#fbc682`/`#fdf4a5` · bleus clairs `#c6e7f6`/`#f1f9fb`. Typo `"Century Gothic","Questrial",system-ui`.
- **Skins :** `premium` / `cockpit` / `humain` (classes CSS).
- **Taille fichier :** le deck WA fait 63 Mo → on **cure et compresse** un petit set d'images ; si le
  fichier unique dépasse ~8-10 Mo, **livraison en dossier `index.html + /assets/` (zippé)** (décision build).
- **Accessibilité :** contrastes charte, focus clavier, cibles ≥ 40 px, flèches en mode présentation.

## 10. Données, confidentialité & assets
- **Tout le contenu est CONFIDENTIEL** (« Wellpharma – Confidentiel, ne pas diffuser ») → bandeau
  permanent + écran d'avertissement à l'ouverture. Données réelles (Sloop, conditions, cotisations).
- **Logos officiels fournis** (`.ai` = PDF) : Wellpharma (`logo_wellpharma-bleu.ai`,
  `Logo_Groupement_WA_baseline.ai`) + Anton & Willem (`A&W-CG-Logos-Tampon RVB.ai`). **Aucun rasteriseur
  CLI dispo** (pas de gs/inkscape/imagemagick ; le `convert` détecté = outil disque Windows à ne pas
  utiliser) → au build : extraire le **PNG haute-déf depuis les médias pptx** ou recréer la marque en
  **SVG**. Photos depuis `_pptx_extract/ppt/media/` + site. **Droits à l'image confirmés par le client**
  pour TOUTES les photos (documents + site wellpharma.com) → utilisables librement. Icônes en SVG inline sur-mesure.

## 11. Périmètre, hors-scope & hypothèses
**Inclus :** scoring 4 paliers + 12 modules (§7.0-7.11), Profileur, Hub, synthèse, mode présentation, hors-ligne.
**Hors-scope :** mobile, backend, CMS, simulateur éditable, multilingue, analytics.
**Hypothèses :** Century Gothic dispo (sinon fallback) ; laptop 16:9 ; chiffres confidentiels diffusables en clientèle (sous contrôle commercial, fichier marqué confidentiel).

## 12. Contenus à confirmer (Wellpharma)
- ✅ **Résolu :** données chiffrées (deck prospection slides 9-14 + WA slides 6-32) · cotisations (WA
  slide 50 : Privilège **125 €**, Privilège Performance **235 €** HT/mois + enseignes) · **logos** fournis (.ai)
  · **droits à l'image confirmés** (toutes photos : documents + site wellpharma.com).
- ⏳ **Reste à valider (non bloquant, placeholders au besoin) :** (1) mapping exact base cotisation
  **enseigne Wellpharma** (slide 50 : +280 € HT outils digitaux ?) ; (2) libellé du **palier 1** (« Liberté »
  retenu) ; (3) **poids/seuils du scoring** (§6) à affiner avec le terrain.

## 13. Critères de succès
- Parcours **+ niveau d'adhésion** assemblés en **< 45 s** devant le pharmacien.
- Effet **whaou** (premium, animations, ligne de vie, jauge live, personnalisation).
- **100 % conforme charte**, **hors-ligne**, double-clic, **marqué confidentiel**.
- Contenu **complet, crédible et sourcé** (génériques approfondis, dynamique commerciale + MDD, 4 offres).
