# Moteur de Missions — Phase 4

Suite des phases 1 (parcours patient + moteur), 2 (persistance serveur + pilotage),
3 (batch UX). Phase 4 = ciblage, personnalisation et pilotage réseau.

## Livré et vérifié en live (Supabase)

### 1. Moteur d'éligibilité (ciblage réel) + proposition en lot
- `packages/shared/src/missions.ts` : `MissionTemplate.eligibilityRule`
  (`ageMin` / `ageMax` / `sex` / `requiresTreatment`), helpers `computeAge`,
  `evaluateEligibility`.
- Règles posées sur les templates : BPM & Vaccination grippe `≥ 65`,
  Dépistage CCR `50–74`, AOD/AVK `≥ 18`, etc.
- `missions.eligible` (API) : segmente la patientèle de référence en
  **Éligibles** (critère âge/sexe rempli) vs **Candidats à confirmer (LGO)**
  (`requiresTreatment` — l'âge est rempli, le traitement reste à confirmer) vs
  exclus. Données 100 % domaine **engagement** (âge/sexe) → RGPD-clean.
- `missions.proposeBatch` : proposition multi-patients idempotente.
- UI pharmacien (`missions-client.tsx` → `ProposeMission` / `PickList`) :
  mission → liste cochable → « Proposer à N patients ».
- Seed : cohorte de 6 patients de référence (âges/sexes variés) pour démontrer
  le ciblage (`packages/db/seed/index.ts`).

### 2. Parcours santé patient (progression sobre)
- `apps/patient/src/pages/MissionsPage.tsx` : carte « Parcours santé »
  (missions accomplies / total, %, encouragement en vouvoiement). CSS `.parcours`.

### 3. Carte réseau cliquable (drill-down groupement)
- `apps/admin/src/components/reseau-map.tsx` : chaque officine est un bouton →
  panneau de détail avec activité **réelle** (proposées / validées / complétion).
- `missions.networkStats` enrichi : `activity[]` par officine (clé `cip`).

### 4. Éditeur no-code de personnalisation (groupement)
- `MissionActivation.config` (Json) : `patientMessage`, `relanceDays`, `channel`.
- `missions.setActivation` accepte `config` ; `missions.catalog` la renvoie.
- Câblage : `propose` / `proposeBatch` utilisent `config.channel` par défaut ;
  `relance` utilise `config.patientMessage` comme corps de notification.
- UI : `MissionConfigEditor` (catalogue) — message (280c), relance (jours),
  canal. Persisté en base, badge « personnalisée ».

## Seams restants (dépendances infra externes — NON simulés)

### A. Éligibilité par traitement (flux LGO id.)
Le moteur gère déjà le drapeau `requiresTreatment` et renvoie ces patients comme
**candidats à confirmer**. Pour les rendre *éligibles certains*, il manque la
donnée traitement (ATC / classes) :
1. Connecteur LGO id. → ingestion des traitements actifs dans le **domaine
   health** (chiffré), réf. patient = UUID opaque.
2. `missions.eligible` : croiser, côté health, les codes ATC requis par mission
   (ajouter `eligibilityRule.requiredAtc?: string[]`) avec les traitements du
   patient ; bascule `needsLgo` → `eligible`.
Aucune autre partie du moteur ne change.

### B. Magic-link SMS + app patient en mode réel
Les endpoints patient existent déjà et sont prêts
(`missions.mine` / `getMine` / `saveAnswers` / `submitMine`). Il manque :
1. **Provider SMS** (Twilio, ou Supabase phone OTP) pour livrer un lien
   passwordless. Point d'intégration : nouveau `notify` canal `SMS` +
   `lib/secureLink.ts` (HMAC déjà en place) pour signer un lien d'invitation
   `/(mission)/:assignmentId`.
2. **Session cross-app** : le PWA patient (Vite, :5220) doit appeler la tRPC de
   l'admin (`VITE_API_URL` déjà pointé sur `:3000/api/trpc`) avec une session
   Supabase patient. Aujourd'hui le PWA est en **mode démo** (localStorage via
   `isDemoEnabled()`). Bascule réelle = désactiver le mode démo + propager le
   token Supabase dans le client tRPC patient.
3. Le `missionService` patient a déjà le pattern dual démo/réel : il suffit de
   brancher la branche réelle sur les endpoints ci-dessus.

> Ces deux points nécessitent des identifiants/fournisseurs externes
> (LGO, opérateur SMS) absents de l'environnement de dev — implémentés en
> *seam* documenté plutôt qu'en simulation.
