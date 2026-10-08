# uwatch

Application web personnelle pour suivre les films et séries : ce que j'ai vu, ce que je veux voir, et où j'en suis dans mes séries.

> Projet en cours de développement : voir l'état d'avancement ci-dessous.

## Stack

- React + TypeScript (strict) + Vite
- Tailwind CSS v4
- React Router (mode data)
- Supabase (Auth OAuth Google/GitHub en PKCE ; PostgreSQL + Row Level Security en phase 3)
- TMDB via un proxy Vercel Function (le token TMDB ne quitte jamais le serveur) — phase 4
- Vitest + React Testing Library
- ESLint (typescript-eslint strict, type-checked) + Prettier
- Hébergement : Vercel

## Prérequis

- Node.js `>=22.22.0` (voir `.nvmrc`)
- npm

## Installation

```bash
npm install
cp .env.example .env.local   # puis compléter les valeurs
npm run dev
```

## Variables d'environnement

Voir [`.env.example`](./.env.example).

- Les variables `VITE_*` sont **publiques** : elles sont incluses dans le bundle navigateur.
- Les secrets (ex. `TMDB_READ_ACCESS_TOKEN`) ne doivent **jamais** être préfixés par `VITE_`.
- Aucun fichier `.env*` (hors `.env.example`) n'est versionné.

## Configuration Supabase & OAuth

> Les libellés exacts du Dashboard Supabase, de Google Cloud et de GitHub évoluent : en cas de doute, se référer à leur documentation officielle.

### 1. Projet Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Récupérer l'**URL du projet** et la **clé publishable** (`sb_publishable_…`) depuis le bouton _Connect_ ou _Settings → API Keys_.
3. Les renseigner dans `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
4. Ne jamais utiliser la clé secrète (`sb_secret_…`) ni la clé legacy `service_role` dans le frontend : elles contournent la RLS.

### 2. URLs de redirection

Dans _Authentication → URL Configuration_ :

- **Site URL** : l'URL de production (ex. `https://uwatch.example.com`).
- **Redirect URLs** : ajouter exactement
  - `http://localhost:5173/login`
  - `https://<domaine-de-production>/login`

Éviter les wildcards larges (`https://*.vercel.app/**`) : ils permettraient à n'importe quel déploiement Vercel de recevoir un code OAuth.

### 3. Google

1. [Google Cloud Console](https://console.cloud.google.com/) → _APIs & Services_ → écran de consentement OAuth, puis _Credentials → Create OAuth client ID_ (type _Web application_).
2. **Authorized redirect URI** : `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Copier le _Client ID_ et le _Client secret_ dans Supabase → _Authentication → Sign In / Providers → Google_.

### 4. GitHub

1. GitHub → _Settings → Developer settings → OAuth Apps → New OAuth App_.
2. **Authorization callback URL** : `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Copier le _Client ID_ et générer un _Client secret_, puis les saisir dans Supabase → _Authentication → Sign In / Providers → GitHub_.

Les secrets OAuth restent dans Supabase : ils ne sont jamais présents dans ce dépôt ni dans le frontend.

### 5. Restriction d'accès

uwatch est une application personnelle. La restriction des inscriptions à une liste d'emails autorisés (Auth Hook) sera ajoutée en phase 3. D'ici là, n'exposez pas l'application publiquement.

## Authentification : fonctionnement

- Flow OAuth **PKCE** (`src/lib/supabase.ts`) ; la session est persistée et rafraîchie automatiquement par supabase-js.
- `AuthProvider` expose un état `loading | authenticated | anonymous` alimenté par `onAuthStateChange`.
- `ProtectedRoute` n'affiche jamais une page privée tant que la session n'est pas confirmée, et redirige vers `/login` sinon.
- La page demandée est mémorisée (chemin interne validé, anti open-redirect) puis restaurée après connexion.
- La déconnexion ne concerne que l'appareil courant (`scope: 'local'`).

## Scripts

| Commande               | Rôle                                   |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Serveur de développement               |
| `npm run build`        | Vérification des types + build de prod |
| `npm run preview`      | Prévisualisation du build              |
| `npm run typecheck`    | Vérification TypeScript                |
| `npm run lint`         | ESLint                                 |
| `npm run format`       | Formatage Prettier                     |
| `npm run format:check` | Vérification du formatage              |
| `npm test`             | Tests (Vitest)                         |
| `npm run test:watch`   | Tests en mode watch                    |

## Structure

```
public/
  images/            # image de fond home cinema (à fournir : home-cinema.webp)
src/
  app/               # App, routeur
  components/
    layout/          # AppLayout (header, contenu)
    ui/              # Button, Spinner, FullPageLoader
  features/
    auth/            # AuthProvider, hooks, routes protégées, service OAuth
  lib/               # client Supabase, variables d'environnement, utilitaires
  pages/             # pages routées (Login, Home, 404)
  styles/            # CSS global et tokens de thème
  main.tsx
tests/               # configuration et utilitaires de test
```

Les autres dossiers (`hooks/`, `types/`, `supabase/`, autres features) seront créés au fil des phases, lorsqu'ils auront un contenu réel.

## Thèmes

Le thème est piloté par l'attribut `data-theme` sur `<html>` (`dark` par défaut, `light`). Les couleurs sont des tokens CSS (`--uw-*`) exposés à Tailwind (`bg-surface`, `text-fg`, `text-accent`…) : ajouter un thème revient à redéfinir ces tokens.

## Avancement

- [x] Phase 1 — Initialisation (Vite, React, TypeScript, Tailwind, ESLint, Prettier, Vitest)
- [x] Phase 2 — Supabase & Auth (OAuth Google/GitHub, session, routes protégées)
- [ ] Phase 3 — Base de données, migrations, RLS
- [ ] Phase 4 — TMDB (proxy, types, recherche)
- [ ] Phase 5 — UX de recherche
- [ ] Phase 6 — Bibliothèque
- [ ] Phase 7 — Design
- [ ] Phase 8 — Qualité
- [ ] Phase 9 — Production

## Données

Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.
