# uwatch

Application web personnelle pour suivre les films et séries : ce que j'ai vu, ce que je veux voir, et où j'en suis dans mes séries.

> Projet en cours de développement : voir l'état d'avancement ci-dessous.

## Stack

- React + TypeScript (strict) + Vite
- Tailwind CSS v4
- Supabase (PostgreSQL, Auth OAuth Google/GitHub, Row Level Security) — phase 2
- TMDB via un proxy Vercel Function (le token TMDB ne quitte jamais le serveur) — phase 4
- Vitest + React Testing Library
- ESLint (typescript-eslint strict, type-checked) + Prettier
- Hébergement : Vercel

## Prérequis

- Node.js `^20.19.0 || >=22.12.0` (voir `.nvmrc`)
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
  app/               # App, routeur, providers
  styles/            # CSS global et tokens de thème
  main.tsx
tests/               # configuration des tests
```

Les dossiers `features/`, `components/`, `hooks/`, `lib/`, `types/` et `supabase/` seront créés au fil des phases, lorsqu'ils auront un contenu réel.

## Thèmes

Le thème est piloté par l'attribut `data-theme` sur `<html>` (`dark` par défaut, `light`). Les couleurs sont des tokens CSS (`--uw-*`) exposés à Tailwind (`bg-surface`, `text-fg`, `text-accent`…) : ajouter un thème revient à redéfinir ces tokens.

## Avancement

- [x] Phase 1 — Initialisation (Vite, React, TypeScript, Tailwind, ESLint, Prettier, Vitest)
- [ ] Phase 2 — Supabase & Auth
- [ ] Phase 3 — Base de données, migrations, RLS
- [ ] Phase 4 — TMDB (proxy, types, recherche)
- [ ] Phase 5 — UX de recherche
- [ ] Phase 6 — Bibliothèque
- [ ] Phase 7 — Design
- [ ] Phase 8 — Qualité
- [ ] Phase 9 — Production

## Données

Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.
