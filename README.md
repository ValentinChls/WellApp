<div align="center">

# 🩺 Wellpharma — Écosystème numérique

**« Faire équipe pour votre santé »**

Monorepo Turborepo de l'écosystème Wellpharma : une application patient mobile et un SaaS d'administration au service du groupement et de ses officines.

</div>

---

## 📖 1. Présentation

**Wellpharma** est un groupement coopératif d'environ **450 officines** dont la mission s'articule autour de la **prévention** et de la **vaccination**, au plus près des patients. La promesse de marque tient en un slogan : **« Faire équipe pour votre santé »**.

Cet écosystème met **le patient au centre** et se compose de **deux applications** complémentaires reposant sur un socle technique partagé :

| Application | Public | Stack | Rôle |
|---|---|---|---|
| 🧑‍⚕️ **Patient** (`apps/patient`) | Patients du groupement | PWA — Vite + React + TS (web installable) | Suivi de santé, rappels de prévention/vaccination, prise de RDV, entretiens, documents, consentements. |
| 🏢 **Admin** (`apps/admin`) | Groupement + officines | Next.js (App Router) | Pilotage des campagnes (marronnier de santé), gestion des pharmacies, des patients affiliés et des utilisateurs. Héberge aussi l'endpoint **tRPC** consommé par l'app patient. |

Trois rôles structurent les accès : `SUPER_ADMIN_GROUPEMENT` (siège), `ADMIN_PHARMACIE` (officine), `PATIENT`.

---

## 🏗️ 2. Architecture

### Arbre du monorepo

```text
wellpharma/
├── apps/
│   ├── patient/              # 📱 App patient « WPA » — PWA Vite + React + TS (web installable)
│   │                         #    Consomme l'API via @wellpharma/api/types (import type uniquement)
│   └── admin/                # 🖥️  SaaS admin — Next.js App Router + shadcn/ui + Tailwind
│                             #    Sert l'endpoint tRPC HTTP sur /api/trpc
│
├── packages/
│   ├── ui/                   # 🎨 Design system + tokens de la charte Wellpharma
│   │                         #    exports: "." | "./tokens" | "./tailwind-preset" | "./web" | "./cn"
│   ├── db/                   # 🗄️  Prisma — SERVEUR UNIQUEMENT. DEUX domaines : engagement + health
│   │                         #    exports: "." | "./engagement" | "./health" | "./crypto"
│   ├── api/                  # 🔌 tRPC v11 — routeur applicatif
│   │                         #    "." = serveur (appRouter, contexte…) ; "./types" = AppRouter seul
│   └── config/               # ⚙️  ESLint (flat config) + Prettier partagés
│
├── tsconfig.base.json        # Config TS stricte racine (étendue via chemin relatif par chaque package)
├── turbo.json                # Pipeline Turborepo (build, dev, lint, typecheck, test, db:generate…)
├── pnpm-workspace.yaml       # Workspaces : apps/* + packages/*
├── .npmrc                    # node-linker=hoisted
├── .nvmrc                    # Version Node
├── .env.example              # Modèle de variables d'environnement (à copier en .env)
└── package.json              # Scripts racine
```

> ✅ **Fondation en place et vérifiée** : `pnpm install` (linker isolé), `pnpm db:generate` (2 clients Prisma), `pnpm typecheck` (db / ui / api / admin / patient), **13 tests Vitest** (crypto, consentement, tokens, smoke patient), **`next build`** (admin) et **`vite build`** (PWA patient) passent. L'app patient est une **PWA installable** : `dist/` contient `manifest.webmanifest` + service worker (offline + Web Push) injectés dans l'HTML. Les fonctionnalités métier arrivent en phases dédiées.

### Stack technique

- **Monorepo** : [Turborepo](https://turbo.build) + **pnpm workspaces** (`node-linker=hoisted`).
- **App patient « WPA »** : [Vite](https://vite.dev) + **React** + **TypeScript** + [vite-plugin-pwa](https://vite-pwa-org.netlify.app) — **PWA** installable (offline + Web Push). Pas d'app native.
- **App admin** : [Next.js](https://nextjs.org) **App Router** + [shadcn/ui](https://ui.shadcn.com) + **Tailwind CSS**.
- **API** : [tRPC v11](https://trpc.io) (transformer **superjson** configuré dans le `httpBatchLink`), validation **zod v3**.
- **Base de données** : [Prisma](https://www.prisma.io) v6 — **deux clients**, **deux domaines** (engagement / health).
- **Auth & Storage** : [Supabase](https://supabase.com) (build initial — voir l'encadré HDS ci-dessous).
- **Notifications** : **Web Push** (PWA patient) — service worker + clés VAPID.
- **Langage** : **TypeScript strict** de bout en bout.

---

## 🚨 3. AVERTISSEMENT — Hébergement des données de santé (HDS)

> ```
> ┌──────────────────────────────────────────────────────────────────────────────┐
> │  ⚠️  BUILD INITIAL SUR SUPABASE.                                              │
> │                                                                              │
> │  Le domaine SANTÉ doit MIGRER vers un hébergeur HDS                          │
> │  (Hébergeur de Données de Santé, agréé / certifié, dans l'UE)                │
> │  AVANT TOUTE MISE EN PRODUCTION.                                             │
> │                                                                              │
> │  Tant que cette migration n'est pas faite, l'écosystème reste un            │
> │  environnement de développement / démonstration : aucune donnée de santé    │
> │  réelle de patient ne doit y être saisie.                                    │
> └──────────────────────────────────────────────────────────────────────────────┘
> ```

L'architecture a été conçue **dès le départ** pour rendre cette migration **simple** (un changement de variable d'environnement, pas une refonte). Voir §4 et la checklist §9.

---

## 🔐 4. Séparation des deux domaines de données

L'écosystème manipule **deux natures de données radicalement différentes**, qui ne doivent **jamais** être mélangées :

| Domaine | Contenu | Sensibilité | Infra cible |
|---|---|---|---|
| **ENGAGEMENT** | Groupement, pharmacies, utilisateurs, affiliations, campagnes (marronnier), consentements (métadonnées) | Standard (données métier) | Infra standard UE (Supabase) |
| **SANTÉ (health)** | Données de santé du patient (entretiens, formulaires structurés, éléments cliniques) | **Élevée** — données de santé | **Hébergeur HDS** (UE, certifié) |

### Choix d'architecture documenté

Pour permettre un **split physique** futur **sans refonte applicative**, le projet applique les principes suivants :

1. **Deux clients Prisma distincts** — `engagementDb` et `healthDb` (`@wellpharma/db` : `./engagement`, `./health`), avec **deux schémas Prisma** générés séparément.
2. **Deux `DATABASE_URL` indépendants** — `ENGAGEMENT_DATABASE_URL` et `HEALTH_DATABASE_URL`.
3. **Au départ : une même instance Supabase**, mais **deux schémas Postgres distincts** (`engagement` et `health`).
4. **Aucune clé étrangère inter-domaine.** Les liens entre les deux mondes se font par **UUID opaques applicatifs** (pas de `REFERENCES` SQL traversant la frontière). Conséquence : les deux bases peuvent vivre sur **deux serveurs différents** sans casser l'intégrité.
5. **Conclusion :** migrer le domaine santé vers un HDS revient à **changer `HEALTH_DATABASE_URL`** pour le faire pointer vers le Postgres HDS, puis rejouer les migrations. **Aucune logique métier à réécrire.**

### Garanties propres au domaine SANTÉ

- **Chiffrement at-rest** des champs sensibles en **AES-256-GCM** (`@wellpharma/db/crypto` — `seal` / `open` / `sealJson` / `openJson`). Payload stocké : `[ IV(12) | authTag(16) | ciphertext ]`. Clé **KEK** dérivée de `ENCRYPTION_KEK`.
- **Journalisation** des accès via un **`AuditLog`** (qui / quoi / quand).
- **Accès tracé** systématiquement (lecture comme écriture).

Le domaine **ENGAGEMENT** reste sur infra standard, sans ces contraintes lourdes.

---

## ✅ 5. Prérequis

- **Node.js 20+** (voir `.nvmrc`).
- **pnpm 9+** (`corepack enable` recommandé ; voir `packageManager` dans `package.json`).
- Un **PostgreSQL** accessible — typiquement un projet **Supabase** (ou Postgres local).
- Un **navigateur moderne** pour l'app patient (PWA installable).

---

## 🚀 6. Installation & lancement local

### Étape 1 — Dépendances

```bash
pnpm install
```

### Étape 2 — Variables d'environnement

```bash
cp .env.example .env
```

Renseignez ensuite dans `.env` :

- Les clés **Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, ainsi que les variantes `VITE_*` pour l'app patient PWA).
- Les **URLs de bases** `ENGAGEMENT_DATABASE_URL` et `HEALTH_DATABASE_URL`.
- La clé de chiffrement des données de santé **`ENCRYPTION_KEK`** (clé base64 de **32 octets**), générée avec :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> 🔑 `SUPABASE_SERVICE_ROLE_KEY` est **strictement serveur** — ne jamais l'exposer côté client. `ENCRYPTION_KEK` ne doit **jamais** être committée.

### Étape 3 — Base de données (Prisma)

```bash
pnpm db:generate   # génère les clients Prisma (engagement + health)
pnpm db:migrate    # applique les migrations sur les deux schémas
pnpm db:seed       # peuple les données de démo (groupement, officines, comptes, marronnier)
```

### Étape 4 — Démarrage

```bash
pnpm dev           # lance toutes les apps (Turborepo)
# ou ciblé :
pnpm dev:admin     # SaaS admin seul   → http://localhost:3000
pnpm dev:patient   # app patient seule → Vite (http://localhost:5173)
```

- **Admin** : <http://localhost:3000>
- **Patient** : ouvrez **http://localhost:5173** (PWA installable depuis le navigateur). L'app consomme l'API admin sur `http://localhost:3000/api/trpc` (`VITE_API_URL`).

---

## 👤 7. Comptes de démonstration

Le seed (`pnpm db:seed`) crée **trois comptes** couvrant les trois rôles. Mot de passe de démo commun : **`Wellpharma2026!`**.

| Email | Rôle | Usage |
|---|---|---|
| `valentin.charles@equasens.com` | `SUPER_ADMIN_GROUPEMENT` | Vue siège / groupement |
| `admin.pharmacie@wellpharma.test` | `ADMIN_PHARMACIE` | Vue officine (Pharmacie Wellpharma Centre) |
| `patient.demo@wellpharma.test` | `PATIENT` | App patient (profil Camille Martin) |

**Provisionnement Supabase Auth :**

- Si `SUPABASE_SERVICE_ROLE_KEY` (et `NEXT_PUBLIC_SUPABASE_URL`) sont renseignés **au moment du seed**, les utilisateurs sont **créés automatiquement dans Supabase Auth** (email confirmé, mot de passe ci-dessus).
- **Sinon**, le seed reste exécutable hors-ligne : il génère un `authId` *placeholder*. Pour activer la connexion réelle, fournissez les clés puis **relancez `pnpm db:seed`**, ou créez les utilisateurs manuellement dans le tableau de bord Supabase (Auth → Users) avec les emails et le mot de passe ci-dessus.

> Le seed peuple également **~19 campagnes** du *marronnier* de santé (Octobre Rose, Mars Bleu, vaccinations hivernales, HPV, Movember…).

---

## 🛡️ 8. Garde-fous RGPD & données de santé

Six contraintes **non négociables**, et la manière dont elles sont implémentées :

1. **Minimisation des données** — seules les données strictement nécessaires sont collectées et stockées. Le domaine santé est isolé et restreint à ce qui sert le parcours de prévention/soin.
2. **Séparation des domaines** — engagement et santé vivent dans des schémas/bases distincts, sans FK inter-domaine (cf. §4). Le domaine santé n'est jamais accessible depuis le client RN (`@wellpharma/db` est **serveur uniquement**).
3. **Consentement granulaire, versionné, append-only, horodaté, révocable** — chaque consentement (`HEALTH_DATA`, `MARKETING`, `PUSH_NOTIFICATIONS`…) est stocké avec sa `policyVersion`, sa source et son horodatage. Le modèle est **append-only** : révoquer = ajouter une nouvelle ligne. Le consentement *courant* est résolu par la dernière entrée (`@wellpharma/db` → `resolveCurrentConsents` / `hasConsent`).
4. **AuditLog — qui / quoi / quand** — tout accès et toute opération sensible sur le domaine santé sont journalisés (acteur, action, ressource, horodatage).
5. **Aucune donnée de santé en clair dans les emails ou les URLs** — les emails sont de simples **notifications** contenant un **lien sécurisé** menant à un espace **authentifié** ; le contenu de santé n'est jamais transmis dans le corps du mail ni en paramètre d'URL.
6. **Chiffrement at-rest + hébergement UE** — les champs santé sensibles sont chiffrés en **AES-256-GCM** avant stockage (cf. §4), et l'hébergement reste dans l'**Union européenne** (build sur Supabase, puis HDS — cf. §3 et §9).

---

## 📋 9. Checklist des migrations HDS à faire AVANT la production

> Ces points **doivent** être traités avant toute mise en production manipulant des données de santé réelles.

- [ ] **Migrer `HEALTH_DATABASE_URL`** vers un **Postgres hébergé HDS certifié** (UE).
- [ ] **Déplacer la KEK de chiffrement vers un KMS** — passer en **envelope encryption** avec une **DEK par enregistrement** (la KEK ne doit jamais être en clair en prod).
- [ ] **Contractualiser l'hébergeur HDS** + signer le **DPA** (accord de traitement des données).
- [ ] **Chiffrement en transit (TLS)** de bout en bout sur toutes les liaisons.
- [ ] Définir et appliquer une **politique de rétention / purge** des données de santé.
- [ ] Activer le **RLS Postgres** (Row Level Security) + **revue des accès**.
- [ ] Implémenter **export / portabilité** des données et **droit à l'effacement**.
- [ ] Garantir la **journalisation inviolable** (altération-évidence / append-only) des `AuditLog`.
- [ ] Réaliser une **PIA / AIPD** (analyse d'impact relative à la protection des données).
- [ ] Faire réaliser un **test d'intrusion (pen-test)**.
- [ ] Régulariser les **licences typographiques** — **Century Gothic** (Monotype) et **Market Pro** (Adobe) — avant la prod.

---

## 📜 10. Scripts pnpm utiles

| Script | Description |
|---|---|
| `pnpm dev` | Lance toutes les apps (Turborepo). |
| `pnpm dev:admin` | Lance uniquement le SaaS admin (Next.js). |
| `pnpm dev:patient` | Lance uniquement l'app patient (Vite, :5173). |
| `pnpm build` | Build de production de toutes les apps/packages. |
| `pnpm lint` | ESLint sur l'ensemble du monorepo. |
| `pnpm typecheck` | Vérification de types TypeScript (strict). |
| `pnpm test` | Lance les tests (Vitest) via Turborepo. |
| `pnpm format` / `pnpm format:check` | Formate / vérifie le formatage (Prettier). |
| `pnpm db:generate` | Génère les clients Prisma (engagement + health). |
| `pnpm db:migrate` | Applique les migrations Prisma (les deux schémas). |
| `pnpm db:push` | Pousse le schéma sans migration (dev rapide). |
| `pnpm db:seed` | Peuple les données de démonstration. |
| `pnpm db:studio` | Ouvre Prisma Studio. |
| `pnpm clean` | Nettoie les artefacts de build et `node_modules`. |

---

## 🧪 11. Tests

- **Tests unitaires** ([Vitest](https://vitest.dev)) sur les packages, en particulier la logique sensible :
  - `crypto` — chiffrement/déchiffrement AES-256-GCM (round-trip, validation de clé).
  - `consent` — résolution du consentement courant (append-only, révocation).
  - `tokens` — cohérence des tokens de la charte (`@wellpharma/ui`).
- **Smoke e2e** — un test de fumée par application (admin et patient) validant le démarrage et le parcours critique.

```bash
pnpm test                                  # toute la suite
pnpm --filter @wellpharma/db test          # tests du package db
pnpm --filter @wellpharma/ui test          # tests du package ui
```

---

## 📐 12. Conventions

- **TypeScript strict** partout. Chaque `tsconfig` de package/app étend le `tsconfig.base.json` racine via un **chemin relatif** (`../../tsconfig.base.json` pour une app/un package de premier niveau).
- **ESLint** (flat config partagée via `@wellpharma/config/eslint`) + **Prettier** (config partagée).
- **Commits conventionnels** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`…).
- **Charte Wellpharma** : primaire `#009dc5` (bleu), navy `#1d243f` (**texte uniquement**), accent turquoise `#37bac9`, vert `#2bad70`. Police texte *Century Gothic* (fallback *Questrial*), display *Market Pro*. **Mobile-first**, accessible **WCAG AA**, **français par défaut**.
- **Frontière client/serveur** : ne jamais importer `@wellpharma/db` (Prisma) côté client/RN ; côté patient, importer **uniquement le type** `AppRouter` via `import type { AppRouter } from '@wellpharma/api/types'`.

---

<div align="center">

**Wellpharma** — *« Faire équipe pour votre santé »* 🩺

</div>
