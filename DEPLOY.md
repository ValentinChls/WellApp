# Mettre Wellpharma en production

Architecture : 2 apps (admin Next.js + patient PWA Vite) + Supabase (déjà hébergé).
**Chemin recommandé : Vercel pour les 2 apps.** Compte tenu de l'usage santé, lis
d'abord la section ⚠️ **RGPD / HDS** tout en bas.

---

## 0. Prérequis (une fois)
- Le code doit être sur **GitHub** (Vercel déploie depuis un repo Git).
- Un compte **Vercel** (gratuit pour démarrer).
- Le projet **Supabase** existant (DB + Auth) reste tel quel — déjà migré + seedé.

## 1. Pousser le code sur GitHub
Depuis `Wellpharma/` :
```bash
git init
git add .
git commit -m "Wellpharma — initial"
git branch -M main
git remote add origin https://github.com/<toi>/wellpharma.git
git push -u origin main
```
Les secrets (`.env`, `.env.local`) sont déjà ignorés par `.gitignore` → rien de
sensible n'est poussé. ✅

## 2. Déployer le BACK-OFFICE (admin · Next.js)
Sur Vercel → **Add New Project** → importe le repo, puis :
- **Root Directory** : `apps/admin`
- Le reste est piloté par `apps/admin/vercel.json` (install + build via Turborepo,
  ce qui lance `prisma generate` automatiquement).
- **Variables d'environnement** (Project Settings → Environment Variables) :

| Variable | Valeur |
|---|---|
| `ENGAGEMENT_DATABASE_URL` | URL pooler Supabase, schéma `engagement` — **port 6543** (voir §5) |
| `HEALTH_DATABASE_URL` | idem, schéma `health` — **port 6543** |
| `ENCRYPTION_KEK` | (depuis `.env`) |
| `SECURE_LINK_SECRET` | (depuis `.env`) |
| `KPI_PSEUDO_SECRET` | (depuis `.env`) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hvgqdozatznrukrxwgtv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (clé anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | (clé service_role) |
| `NEXT_PUBLIC_APP_URL` | l'URL prod de l'admin (ex. `https://admin.wellpharma.app`) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | (depuis `.env`) |
| `ANTHROPIC_API_KEY` / `CHATBOT_MODEL` | optionnel (sinon repli déterministe) |

Deploy → tu obtiens une URL type `wellpharma-admin.vercel.app`.

## 3. Déployer l'APP PATIENT (PWA Vite)
Vercel → **Add New Project** (même repo, 2e projet) :
- **Root Directory** : `apps/patient`
- Config pilotée par `apps/patient/vercel.json` (build Turborepo + sortie `dist` +
  rewrites SPA).
- **Variables d'environnement** (injectées au build, préfixe `VITE_`) :

| Variable | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | `https://hvgqdozatznrukrxwgtv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (clé anon) |
| `VITE_VAPID_PUBLIC_KEY` | (même valeur que `VAPID_PUBLIC_KEY`) |
| `VITE_API_URL` | `<URL admin>/api/trpc` (pour le mode réel) |

## 4. Configurer Supabase Auth (sinon login KO en prod)
Supabase → **Authentication → URL Configuration** :
- **Site URL** : l'URL prod de l'admin.
- **Redirect URLs** : ajoute les 2 URLs prod (admin + patient).

## 5. Connexion DB en serverless (important)
Les fonctions Vercel sont serverless → utilise le **Transaction pooler Supabase
(port 6543)** plutôt que le Session pooler (5432), avec
`?pgbouncer=true&connection_limit=1` :
```
postgresql://postgres.hvgqdozatznrukrxwgtv:<MDP>@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?schema=engagement&pgbouncer=true&connection_limit=1
```
(idem `health`). Évite l'épuisement des connexions.

## 6. Après le déploiement
- Mets `NEXT_PUBLIC_APP_URL` et `VITE_API_URL` aux vraies URLs prod, puis redeploy.
- Teste : login back-office, catalogue, app patient (carte fidélité), notifications.
- Le push **serveur** ne part que vers des patients **connectés en mode réel**
  (en démo l'abonnement reste local).

---

## ⚠️ Sécurité (à faire avant un vrai lancement)
- **Régénère (rotate) la clé `service_role` Supabase** et le **mot de passe DB** :
  ils ont circulé en clair pendant le développement.
- Supprime / change le **mot de passe démo** `Wellpharma2026!` et les comptes de
  démonstration. Retire le rappel des comptes démo de la page de login.
- Revois les données seedées (patients fictifs) avant d'ouvrir à de vrais usagers.

## ⚠️ RGPD / HDS — décisif pour des données patients RÉELLES
L'app est **conçue HDS-ready** (chiffrement at-rest, audit, séparation des domaines),
mais **Vercel + Supabase (offre standard) ne sont PAS certifiés HDS** (Hébergeur de
Données de Santé).
- **Pilote / démo avec données FICTIVES** → Vercel + Supabase : parfait, vas-y.
- **Vraies données de santé patients** → hébergement **certifié HDS** obligatoire en
  France (ex. OVHcloud HDS, Scaleway HDS, Outscale…). Le code (Next.js + Prisma +
  Postgres) est portable vers ces hébergeurs ; c'est l'**infra** qui doit être HDS,
  pas le code.

> Recommandation : déploie le **pilote sur Vercel avec des données fictives** pour
> montrer au groupe, et planifie la bascule HDS avant toute donnée patient réelle.
