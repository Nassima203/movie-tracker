# uwatch

Application web personnelle pour suivre ses films et séries : **ce que j'ai vu, ce que je veux voir, et où j'en suis dans mes séries.**

Site en production : <https://movie-tracker-theta-seven.vercel.app>

---

## Sommaire

1. [Ce que fait l'application](#1-ce-que-fait-lapplication)
2. [Comment ça marche (vue d'ensemble)](#2-comment-ça-marche-vue-densemble)
3. [La sécurité, expliquée simplement](#3-la-sécurité-expliquée-simplement)
4. [Technologies utilisées](#4-technologies-utilisées)
5. [Organisation du code](#5-organisation-du-code)
6. [Lancer le projet en local](#6-lancer-le-projet-en-local)
7. [Variables d'environnement](#7-variables-denvironnement)
8. [Configurer Supabase](#8-configurer-supabase)
9. [Configurer TMDB](#9-configurer-tmdb)
10. [Déployer sur Vercel](#10-déployer-sur-vercel)
11. [Scripts et tests](#11-scripts-et-tests)
12. [Limites connues](#12-limites-connues)
13. [Dépannage](#13-dépannage)

---

## 1. Ce que fait l'application

| Fonction        | Détail                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------- |
| **Compte**      | Création par email + mot de passe (avec email de confirmation), connexion, mot de passe oublié.    |
| **Accès privé** | Seules les adresses email autorisées (table `allowed_emails`) peuvent créer un compte.             |
| **Recherche**   | Recherche de films et séries TMDB dès la première lettre, utilisable au clavier comme à la souris. |
| **Accueil**     | Tendances TMDB de la semaine.                                                                      |
| **Statuts**     | Chaque titre peut être **À voir**, **En cours** ou **Vu**, depuis la recherche ou depuis sa fiche. |
| **Séries**      | Suivi saison par saison, bouton « Tout marquer vu », barre de progression.                         |
| **Pages**       | Accueil, À voir, En cours, Bibliothèque (filtres par statut et par type), fiche film, fiche série. |
| **Apparence**   | Mode nuit (par défaut) et mode jour mémorisés, photo de salle de cinéma en fond, adapté au mobile. |

### Le parcours d'une utilisatrice

1. Elle arrive sur `/login`, crée son compte, clique sur le lien reçu par email, puis se connecte.
2. Elle tape un titre dans la barre de recherche : les résultats TMDB s'affichent au fur et à mesure.
3. Elle clique sur **À voir**, **En cours** ou **Vu** : le titre est enregistré dans sa bibliothèque.
4. Pour une série, elle ouvre la fiche et coche les saisons vues : la progression se met à jour.
   Quand toutes les saisons diffusées sont cochées, la série passe automatiquement en « Vu ».

### Comment un titre est classé

- **À voir** : statut `watchlist`.
- **En cours** : statut `watching`, ou une série dont au moins une saison (mais pas toutes) est cochée.
- **Vu** : statut `watched`.

Pour la progression d'une série, la **saison 0** (épisodes spéciaux) et les saisons **pas encore diffusées** ne comptent pas.

---

## 2. Comment ça marche (vue d'ensemble)

```
                 ┌──────────────────────────────┐
                 │  Navigateur (React)          │
                 └──────┬───────────────┬───────┘
     connexion + données│               │ recherche, fiches
     (clé publique)     │               │ (avec le jeton de session)
                        ▼               ▼
        ┌──────────────────────┐   ┌───────────────────────────┐
        │ Supabase             │   │ /api/tmdb                 │
        │  - Auth (comptes)    │   │ (fonction Vercel = proxy) │
        │  - PostgreSQL + RLS  │   └─────────────┬─────────────┘
        └──────────────────────┘                 │ token TMDB secret
                                                 ▼
                                       ┌──────────────────┐
                                       │ api.themoviedb.org│
                                       └──────────────────┘
   Les affiches sont chargées directement depuis image.tmdb.org (public).
```

- **Supabase** gère les comptes et stocke la bibliothèque (tables `library_items` et `watched_seasons`).
- **Le proxy `/api/tmdb`** est un petit serveur qui interroge TMDB à la place du navigateur.
  Il existe pour une seule raison : **le token TMDB est secret** et ne doit jamais arriver dans le navigateur.
- **TanStack Query** garde en mémoire les réponses (cache), annule les recherches dépassées
  et met l'écran à jour **avant** la réponse du serveur (mise à jour « optimiste »),
  en revenant en arrière si l'enregistrement échoue.

### Le mode démo

Si les variables Supabase ne sont pas renseignées, l'application démarre en **mode démo** :

- la connexion est simulée (n'importe quel email et mot de passe fonctionnent) ;
- la bibliothèque est stockée dans le navigateur (`localStorage`) ;
- les films viennent de TMDB si un token est configuré en local, sinon d'un petit catalogue intégré.

C'est pratique pour tester l'interface sans rien configurer.

---

## 3. La sécurité, expliquée simplement

| Risque                                            | Protection                                                                                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quelqu'un vole le token TMDB                      | Le token n'existe que côté serveur (`TMDB_READ_ACCESS_TOKEN`, sans préfixe `VITE_`). Le navigateur ne parle qu'au proxy.                                   |
| Quelqu'un utilise le proxy pour autre chose       | Le proxy n'accepte que 5 requêtes précises (recherche, tendances, film, série, saison), en lecture seule (GET), avec des paramètres vérifiés.              |
| Un inconnu utilise le proxy                       | En production, le proxy exige une **session Supabase valide** avant d'appeler TMDB.                                                                        |
| Quelqu'un lit ou modifie la bibliothèque d'autrui | **RLS** (Row Level Security) PostgreSQL : chaque ligne appartient à un `user_id`, et la base refuse tout accès à une ligne qui n'est pas la vôtre.         |
| Le navigateur triche sur son identité             | Le navigateur n'envoie **jamais** de `user_id` : la base le remplit elle-même avec `auth.uid()` (l'identité de la session) et le revérifie (`WITH CHECK`). |
| Un inconnu crée un compte                         | Un « Auth Hook » refuse toute inscription dont l'email n'est pas dans `allowed_emails`.                                                                    |
| Injection de script (XSS)                         | React échappe le texte affiché, et une **CSP stricte** (`vercel.json`) interdit les scripts externes.                                                      |
| Redirection piégée après connexion                | Seules les adresses internes au site (commençant par un seul `/`) sont acceptées comme destination.                                                        |
| Fuite d'informations dans les erreurs             | Les messages bruts de Supabase et de TMDB ne sont jamais affichés : ils sont traduits en messages neutres.                                                 |
| Données TMDB inattendues                          | Chaque réponse TMDB est vérifiée par un schéma `zod` avant d'être utilisée.                                                                                |

> **Règle d'or :** une variable qui commence par `VITE_` est **publique** (elle est copiée dans le code envoyé au navigateur).
> On n'y met jamais de secret.

---

## 4. Technologies utilisées

| Domaine         | Choix                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| Interface       | React 19, TypeScript (mode strict), Vite 8, Tailwind CSS v4, React Router 8 |
| Données         | TanStack Query (cache, annulation, mises à jour optimistes)                 |
| Validation      | zod (réponses TMDB, données locales)                                        |
| Comptes et base | Supabase : Auth email + mot de passe, PostgreSQL + Row Level Security       |
| Films et séries | TMDB, via le proxy `api/tmdb.ts` (fonction Vercel)                          |
| Tests           | Vitest, React Testing Library, test RLS sur un vrai PostgreSQL              |
| Qualité         | ESLint (typescript-eslint strict), Prettier                                 |
| Hébergement     | Vercel                                                                      |

---

## 5. Organisation du code

Chaque fichier commence par un commentaire (en français) qui explique son rôle.

```
api/tmdb.ts                    Point d'entrée Vercel du proxy TMDB
server/
  tmdb/
    routes.ts                  Liste blanche des requêtes TMDB autorisées + validation des paramètres
    handler.ts                 Cœur du proxy : contrôles, appel à TMDB, traduction des erreurs
    auth.ts                    Vérification de la session Supabase envoyée par le navigateur
    config.ts                  Lecture des variables d'environnement côté serveur
    createProxyFromEnv.ts      Assemble le proxy à partir de la configuration
  dev/apiDevPlugin.ts          Sert /api/tmdb pendant `npm run dev` (pas besoin de Vercel en local)
supabase/
  migrations/                  Tables, contraintes, politiques RLS, liste d'emails autorisés, hook
  tests/                       Test de sécurité RLS (isolation entre utilisateurs)
src/
  main.tsx                     Démarrage de l'application (+ écran d'erreur si la config est incomplète)
  app/                         Routeur (pages), fournisseurs globaux, client TanStack Query
  pages/                       Une page par route : accueil, À voir, En cours, bibliothèque, fiches, connexion…
  features/
    auth/                      Connexion, inscription, mot de passe oublié, routes protégées
      gateways/                Deux implémentations : Supabase (réel) et démo
    catalog/                   Accès aux films/séries (proxy TMDB ou catalogue de démo), schémas zod
    library/                   Bibliothèque : lecture, ajout, statuts, saisons, progression, filtres
      repository/              Deux implémentations : Supabase (réel) et localStorage (démo)
    media-details/             Fiches film et série, liste des saisons
    search/                    Barre de recherche (combobox accessible au clavier)
    theme/                     Mode nuit / mode jour
  components/
    layout/                    Mise en page, navigation, fond, menu utilisateur
    media/                     Affiches et grilles de titres
    ui/                        Boutons, badges, chargements, messages, notifications (toasts)
  lib/                         Outils partagés : config, client Supabase, client du proxy, erreurs, images
  hooks/useDebounce.ts         Attendre que l'utilisatrice ait fini de taper
  styles/index.css             Couleurs des deux thèmes et styles globaux
  types/                       Types métier (films, séries, statuts) et types de la base
tests/                         Outils de test et tests de configuration (CSP, déploiement)
vercel.json                    Build, réécriture des routes et en-têtes de sécurité (CSP)
```

### Le principe des « passerelles »

L'authentification (`features/auth/gateways/`) et la bibliothèque (`features/library/repository/`)
ont chacune **deux implémentations interchangeables** : une pour Supabase, une pour le mode démo.
Le reste de l'application ne sait pas laquelle est utilisée : le choix est fait une seule fois,
selon la présence des variables Supabase (`src/lib/env.ts`).

---

## 6. Lancer le projet en local

Prérequis : Node.js `>=22.22.0`.

```bash
npm install
npm run dev        # puis ouvrir http://localhost:5173
```

Sans aucune configuration, l'application tourne en **mode démo** avec le catalogue intégré.

Pour avoir les vrais films TMDB en local, créer un fichier `.env.local` à la racine :

```bash
TMDB_READ_ACCESS_TOKEN=votre_token_tmdb
```

Pour utiliser le vrai Supabase en local, copier `.env.example` en `.env.local` et remplir les trois variables.

> Après toute modification de `.env.local`, arrêter le serveur (Ctrl+C) puis relancer `npm run dev`.
> Sans Supabase, le proxy accepte les requêtes sans session **uniquement** en développement local. En production, la session est toujours exigée.

---

## 7. Variables d'environnement

Modèle : [`.env.example`](./.env.example). Aucun fichier `.env*` réel n'est envoyé sur GitHub.

| Variable                        | Utilisée par       | Secrète ?                                         |
| ------------------------------- | ------------------ | ------------------------------------------------- |
| `VITE_SUPABASE_URL`             | navigateur + proxy | non                                               |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | navigateur + proxy | non (clé `sb_publishable_…`, protégée par la RLS) |
| `TMDB_READ_ACCESS_TOKEN`        | proxy uniquement   | **oui** — jamais de préfixe `VITE_`               |

- Ne jamais utiliser la clé secrète Supabase (`sb_secret_…`) ni l'ancienne clé `service_role` dans ce projet.
- Si seulement **une** des deux variables Supabase est remplie, l'application affiche un écran d'erreur
  explicite plutôt que de démarrer à moitié configurée.

---

## 8. Configurer Supabase

> Les libellés de la console Supabase évoluent : en cas de doute, voir leur documentation officielle.

### 8.1 Projet et clés

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Récupérer l'**URL du projet** et la **clé publishable** (`sb_publishable_…`) dans _Connect_ ou _Settings → API Keys_.

### 8.2 Base de données

Appliquer, **dans l'ordre**, les fichiers du dossier `supabase/migrations/` :

1. `20261008120000_init_library.sql` — tables `library_items`, `watched_seasons`, `allowed_emails`, contraintes, politiques RLS, fonction `hook_before_user_created` ;
2. `20261009090000_add_watching_status.sql` — ajoute le statut « En cours » (`watching`) ;
3. `20261009100000_index_watched_seasons_fk.sql` — index pour accélérer les suppressions en cascade.

Deux façons de faire :

- coller chaque fichier dans le _SQL Editor_ du tableau de bord, puis cliquer sur _Run_ ;
- ou, avec le CLI : `npx supabase link --project-ref <ref>` puis `npx supabase db push`.

Les types TypeScript de la base (`src/types/database.ts`) peuvent être régénérés avec :

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

### 8.3 Réserver l'accès à votre email

1. Dans le _SQL Editor_ :
   ```sql
   insert into public.allowed_emails (email) values ('votre.email@exemple.com');
   ```
   (l'email en minuscules).
2. _Authentication → Hooks_ → **Before User Created** → type _Postgres_ → fonction `public.hook_before_user_created`.

Toute autre adresse sera refusée à l'inscription.

### 8.4 Adresses de redirection

_Authentication → URL Configuration_ :

- **Site URL** : `https://<votre-domaine>/login`
- **Redirect URLs** : `http://localhost:5173/login` et `https://<votre-domaine>/login` (exactement ces adresses).

Éviter les jokers larges comme `https://*.vercel.app/**` : n'importe quel site Vercel pourrait recevoir vos liens de connexion.

### 8.5 Emails

- **Confirm email** doit rester activé : sinon quelqu'un pourrait créer un compte avec votre adresse sans y avoir accès.
- Le lien de **mot de passe oublié** ramène sur `/login`, puis l'application ouvre la page « Nouveau mot de passe ».
  Il faut l'ouvrir **dans le navigateur qui a fait la demande** ; il expire au bout d'une heure.
- Le service d'email gratuit de Supabase n'envoie que quelques emails par heure : suffisant pour un usage personnel.

---

## 9. Configurer TMDB

1. Créer un compte sur [themoviedb.org](https://www.themoviedb.org/), puis _Paramètres → API_, et accepter les conditions.
2. Copier le **API Read Access Token** (le long jeton qui commence par `eyJ…`) dans `TMDB_READ_ACCESS_TOKEN`
   (`.env.local` en local, variables d'environnement Vercel en production).
3. Ne jamais coller ce token dans le code, dans une variable `VITE_`, ni le partager. S'il a fuité, le régénérer sur TMDB.

Langue des données : `fr-FR` (constante `TMDB_LANGUAGE` dans `server/tmdb/routes.ts`).

> Les conditions d'utilisation de TMDB demandent de citer TMDB comme source des données
> (par exemple dans une page « À propos »). La mention a été retirée de la page de connexion ;
> elle figure en bas de ce README. Pour un usage public, ajoutez-la à un endroit visible de l'application.

---

## 10. Déployer sur Vercel

1. Importer le dépôt GitHub dans Vercel (le préréglage **Vite** est détecté).
2. _Settings → Environment Variables_ : ajouter `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` et `TMDB_READ_ACCESS_TOKEN`.
3. Redéployer, puis ajouter l'adresse du site aux Redirect URLs Supabase (section 8.4).

Ce que fait `vercel.json` :

- **réécriture SPA** : toutes les adresses (sauf `/api/…`) renvoient `index.html`, et React Router affiche la bonne page ;
- **en-têtes de sécurité** : CSP stricte, interdiction d'afficher le site dans une iframe, etc.
  Le petit script de `index.html` (qui applique le thème sans clignotement) est autorisé par son empreinte SHA-256 :
  si vous le modifiez, mettez l'empreinte à jour (un test échoue sinon).

---

## 11. Scripts et tests

| Commande            | Rôle                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `npm run dev`       | Serveur de développement, avec le proxy `/api/tmdb`               |
| `npm run build`     | Vérification des types puis build de production (dossier `dist/`) |
| `npm run preview`   | Prévisualiser le build                                            |
| `npm run typecheck` | Vérification TypeScript                                           |
| `npm run lint`      | Analyse ESLint                                                    |
| `npm run format`    | Formatage automatique (Prettier)                                  |
| `npm test`          | Tests automatiques (Vitest)                                       |
| `npm run test:db`   | Test de sécurité RLS sur un PostgreSQL local (`PGHOST`…)          |

Ce que vérifient les tests :

- **interface et logique** (`npm test`) : recherche (attente de frappe, annulation), navigation au clavier,
  ajout/retrait et retour en arrière en cas d'erreur, saisons et progression, thème, connexion, mot de passe oublié,
  routes protégées et redirections, proxy TMDB (validation, session, erreurs), lecture des données TMDB, CSP ;
- **base de données** (`npm run test:db`) : un utilisateur ne voit pas les données d'un autre,
  ne peut pas se faire passer pour un autre `user_id`, pas de doublons, suppressions en cascade, hook d'inscription.

---

## 12. Limites connues

- Suivi par saison, pas épisode par épisode (choix volontaire).
- Pas de notes, critiques, partage ni recommandations.
- Quelques emails par heure seulement avec le service d'email gratuit de Supabase.
- Le lien de confirmation ou de réinitialisation doit être ouvert dans le navigateur qui a fait la demande.
- La protection contre les mots de passe divulgués (_leaked password protection_) de Supabase nécessite une offre payante.

---

## 13. Dépannage

| Problème                                | Solution                                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Page blanche ou écran « configuration » | Vérifier que **les deux** variables Supabase sont remplies (ou aucune, pour le mode démo), puis redéployer. |
| Pas d'affiches / « catalogue de démo »  | `TMDB_READ_ACCESS_TOKEN` absent ou faux : le corriger dans Vercel puis redéployer.                          |
| « adresse non autorisée »               | L'email n'est pas dans `allowed_emails` (section 8.3).                                                      |
| « Ce lien a expiré »                    | Le lien a déjà servi ou a plus d'une heure : se connecter avec le mot de passe, ou refaire une demande.     |
| Les changements n'apparaissent pas      | Utiliser l'adresse de production (pas une ancienne URL de déploiement) et recharger avec Ctrl+F5.           |

---

## Données

Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.
