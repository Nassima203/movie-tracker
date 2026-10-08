# uwatch

Application web personnelle pour suivre ses films et séries : **ce que j'ai vu, ce que je veux voir, et où j'en suis dans mes séries.**

- Recherche TMDB instantanée (dès la première lettre), au clavier comme à la souris
- Films : « À voir » / « Vu »
- Séries : suivi saison par saison, « Tout marquer vu », progression
- Bibliothèque filtrable, liste « À voir », séries en cours
- Mode nuit (par défaut) et mode jour, responsive mobile-first, accessible

## Essayer en local, sans Supabase

Sans variables Supabase, uwatch démarre en **mode démo** : connexion simulée et bibliothèque stockée dans le navigateur.

### Avec les vrais films TMDB (recommandé)

1. Créer un compte sur [themoviedb.org](https://www.themoviedb.org/), puis _Paramètres → API_ et copier le **API Read Access Token**.
2. Créer un fichier `.env.local` à la racine du projet contenant **uniquement** :
   ```bash
   TMDB_READ_ACCESS_TOKEN=votre_token
   ```
3. Lancer :
   ```bash
   npm install
   npm run dev        # http://localhost:5173
   ```

Recherche, tendances de la semaine et affiches viennent alors de TMDB.

> Sans Supabase, le proxy TMDB accepte les requêtes sans session **uniquement en développement local** (`npm run dev`). En production (Vercel), il exige toujours une session Supabase.

### Sans aucun compte

Sans `.env.local`, l'application utilise un petit catalogue intégré (sans affiches) à la place de TMDB.

### Passer en mode réel

Dès que `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` sont définies, la connexion Google/GitHub et la base de données Supabase sont utilisées (voir plus bas).

> Après toute modification de `.env.local`, arrêter (Ctrl+C) puis relancer `npm run dev`.

## Stack

| Domaine         | Choix                                                                         |
| --------------- | ----------------------------------------------------------------------------- |
| Frontend        | React 19, TypeScript strict, Vite 8, Tailwind CSS v4, React Router 8 (data)   |
| Données serveur | TanStack Query (cache, annulation, mises à jour optimistes)                   |
| Validation      | zod (réponses TMDB, stockage local)                                           |
| Backend         | Supabase : Auth OAuth (Google, GitHub, PKCE), PostgreSQL + Row Level Security |
| Films/séries    | TMDB via un proxy Vercel Function (le token ne quitte jamais le serveur)      |
| Tests           | Vitest, React Testing Library, test RLS sur PostgreSQL                        |
| Qualité         | ESLint (typescript-eslint strict type-checked), Prettier                      |
| Hébergement     | Vercel                                                                        |

## Architecture

```
Navigateur (SPA React)
  ├── supabase-js (clé publishable) ──► Supabase Auth + PostgreSQL (RLS)
  ├── /api/tmdb (Vercel Function) ────► api.themoviedb.org  (token serveur)
  └── image.tmdb.org (affiches, public)
```

- **Sécurité des données** : assurée par PostgreSQL. Chaque table utilisateur a la RLS activée avec des politiques explicites par opération ; `user_id` vaut `auth.uid()` par défaut et est revérifié (`WITH CHECK`). Le client n'envoie jamais de `user_id`.
- **Proxy TMDB** (`api/tmdb.ts`, `server/tmdb/`) : liste blanche de ressources (`search`, `movie`, `tv`, `season`), paramètres validés, session Supabase obligatoire (rôle `authenticated` vérifié), timeout, erreurs assainies.
- **Accès restreint** : seuls les emails de la table `allowed_emails` peuvent créer un compte (Auth Hook).

## Installation (mode réel)

Prérequis : Node.js `>=22.22.0` (voir `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # puis compléter les valeurs
npm run dev
```

En développement, `/api/tmdb` est servi par le serveur Vite lui-même (middleware de dev) : pas besoin du CLI Vercel.

## Variables d'environnement

Voir [`.env.example`](./.env.example).

| Variable                        | Où                 | Secret ?                    |
| ------------------------------- | ------------------ | --------------------------- |
| `VITE_SUPABASE_URL`             | navigateur + proxy | non                         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | navigateur + proxy | non (protégé par la RLS)    |
| `TMDB_READ_ACCESS_TOKEN`        | serveur uniquement | **oui** — jamais en `VITE_` |

- Les variables `VITE_*` sont incluses dans le bundle navigateur : elles doivent être publiques.
- Aucun fichier `.env*` (hors `.env.example`) n'est versionné.
- Ne jamais utiliser la clé secrète Supabase (`sb_secret_…`) ni la clé legacy `service_role` dans ce projet.

## Configuration Supabase

> Les libellés exacts des consoles Supabase, Google et GitHub évoluent : en cas de doute, se référer à leur documentation officielle.

### 1. Projet et clés

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Récupérer l'**URL du projet** et la **clé publishable** (`sb_publishable_…`) via _Connect_ ou _Settings → API Keys_.

### 2. Base de données

Appliquer la migration `supabase/migrations/20261008120000_init_library.sql` :

- soit avec le CLI : `npx supabase link --project-ref <ref>` puis `npx supabase db push` (si le CLI réclame un `supabase/config.toml`, lancer d'abord `npx supabase init` : il conserve le dossier `migrations/`) ;
- soit en collant le fichier dans le _SQL Editor_ du Dashboard.

Elle crée `library_items`, `watched_seasons`, `allowed_emails`, les contraintes, index, politiques RLS et la fonction `hook_before_user_created`.

Les types TypeScript (`src/types/database.ts`) correspondent à la migration ; une fois le projet lié, ils peuvent être régénérés :

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

### 3. Restreindre l'accès à votre compte

1. Dans le _SQL Editor_ :
   ```sql
   insert into public.allowed_emails (email) values ('votre.email@exemple.com');
   ```
   (en minuscules ; ajoutez l'email de votre compte Google **et** celui de votre compte GitHub s'ils diffèrent).
2. _Authentication → Hooks_ → activer **Before User Created** → type _Postgres_ → fonction `public.hook_before_user_created`.

Tout autre compte sera refusé à l'inscription.

### 4. URLs de redirection

_Authentication → URL Configuration_ :

- **Site URL** : l'URL de production.
- **Redirect URLs** : exactement `http://localhost:5173/login` et `https://<domaine-de-production>/login`.

Éviter les wildcards larges (`https://*.vercel.app/**`) : n'importe quel déploiement Vercel pourrait recevoir un code OAuth.

## Configuration OAuth

Les deux fournisseurs utilisent la même URL de callback : `https://<project-ref>.supabase.co/auth/v1/callback`.

**Google** : [Google Cloud Console](https://console.cloud.google.com/) → écran de consentement OAuth → _Credentials → Create OAuth client ID_ (_Web application_) → _Authorized redirect URI_ = callback ci-dessus → copier Client ID / Secret dans Supabase → _Authentication → Sign In / Providers → Google_.

**GitHub** : _Settings → Developer settings → OAuth Apps → New OAuth App_ → _Authorization callback URL_ = callback ci-dessus → copier Client ID / Secret dans Supabase → _Providers → GitHub_.

Les secrets OAuth restent dans Supabase : jamais dans ce dépôt ni dans le frontend.

## Configuration TMDB

1. Créer un compte sur [themoviedb.org](https://www.themoviedb.org/), puis _Paramètres → API_ et accepter les conditions d'utilisation.
2. Copier le **API Read Access Token** dans `TMDB_READ_ACCESS_TOKEN` (`.env.local` en local, variables d'environnement Vercel en production).
3. Attribution obligatoire : la mention TMDB est affichée sur la page de connexion. Vérifier les conditions TMDB en vigueur avant toute mise en production publique.

Langue des données : `fr-FR` (constante `TMDB_LANGUAGE` dans `server/tmdb/routes.ts`).

## Image de fond

Déposer une photo de home cinéma dans `public/images/home-cinema.webp` (WebP compressé, ~1920 px de large, < 300 Ko conseillé). Un overlay garantit la lisibilité dans les deux thèmes ; sans fichier, seuls les dégradés s'affichent.

## Scripts

| Commande            | Rôle                                                     |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Serveur de développement (+ proxy `/api/tmdb`)           |
| `npm run build`     | Vérification des types + build de production             |
| `npm run preview`   | Prévisualisation du build                                |
| `npm run typecheck` | Vérification TypeScript (app, serveur, config)           |
| `npm run lint`      | ESLint                                                   |
| `npm run format`    | Formatage Prettier                                       |
| `npm test`          | Tests (Vitest)                                           |
| `npm run test:db`   | Migration + test RLS sur un PostgreSQL local (`PGHOST`…) |

## Tests

- **Unitaires / comportement** (`npm test`) : debounce, recherche (états, annulation des requêtes obsolètes), combobox clavier, actions (doublons, rollback), saisons, thème, auth (session, routes protégées, redirections), proxy TMDB (validation, auth, erreurs), parsing TMDB, configuration de déploiement.
- **Base de données** (`npm run test:db`) : applique les migrations sur une base jetable avec un stub de l'environnement Supabase et vérifie l'isolation entre utilisateurs, l'usurpation de `user_id`, les doublons, les cascades et le hook d'inscription.

## Déploiement Vercel

1. Importer le dépôt dans Vercel (preset **Vite** détecté ; `vercel.json` fixe build et sortie).
2. Définir les variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` et `TMDB_READ_ACCESS_TOKEN` (_Settings → Environment Variables_).
3. Ajouter le domaine de production aux Redirect URLs Supabase.

`vercel.json` fournit :

- la réécriture SPA (toutes les routes sauf `/api/*` → `index.html`) ;
- des en-têtes de sécurité, dont une **CSP stricte**. Le script inline de `index.html` (application du thème sans flash) y est autorisé par son empreinte SHA-256 : si vous le modifiez, mettez à jour l'empreinte (un test échoue sinon).

> Les requêtes au proxy portent un en-tête `Authorization` : le CDN Vercel ne les met pas en cache. Le cache est assuré côté navigateur (`Cache-Control: private`) et par TanStack Query.

## Structure

```
api/tmdb.ts                 Vercel Function (proxy TMDB)
server/
  tmdb/                     logique du proxy (routes, auth, handler) — testée
  dev/apiDevPlugin.ts       sert /api/tmdb dans `vite dev`
supabase/
  migrations/               schéma, RLS, allowlist, hook
  tests/                    test RLS (stub Supabase + scénarios)
src/
  app/                      App, providers, routeur, QueryClient
  components/
    layout/                 AppLayout, fond, navigation, menu utilisateur
    media/                  PosterImage, PosterCard, MediaGrid
    ui/                     Button, Badge, Skeleton, EmptyState, Toast…
  features/
    auth/                   AuthProvider, passerelles Supabase/démo, routes protégées
    catalog/                sources TMDB (proxy/démo), schémas zod, hooks de détails
    library/                dépôts Supabase/démo, mutations, progression, filtres
    media-details/          fiches film/série, liste des saisons
    search/                 useTmdbSearch, SearchCombobox
    theme/                  thèmes, persistance, toggle
  hooks/useDebounce.ts
  lib/                      env, client Supabase, client du proxy, erreurs, images
  pages/                    pages routées
  types/                    types métier et base de données
tests/                      utilitaires de test et tests de configuration
```

## Données

Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.
