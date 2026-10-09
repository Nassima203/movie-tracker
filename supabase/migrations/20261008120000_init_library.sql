-- uwatch — schéma initial
-- Bibliothèque privée de films et séries par utilisateur (identifiés par leur id TMDB),
-- suivi saison par saison des séries, et liste des emails autorisés à s'inscrire.
--
-- Modèle de sécurité : chaque table utilisateur a la Row Level Security (RLS)
-- activée avec des politiques explicites. `user_id` vaut auth.uid() par défaut
-- et est revérifié par WITH CHECK : un client ne peut jamais lire ni écrire
-- les lignes d'un autre utilisateur.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.media_type as enum ('movie', 'tv');
create type public.library_status as enum ('watchlist', 'watched');

-- ---------------------------------------------------------------------------
-- Déclencheur partagé : met à jour updated_at à chaque modification
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- library_items : une ligne par (utilisateur, type de média, id TMDB)
-- Un id TMDB n'est unique que par type (film ou série), d'où la clé composée.
-- Titre, affiche et date sont une copie d'affichage des données TMDB, rafraîchie par l'application.
-- ---------------------------------------------------------------------------

create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  media_type public.media_type not null,
  tmdb_id integer not null check (tmdb_id > 0),
  status public.library_status not null default 'watchlist',
  title text not null check (char_length(title) between 1 and 500),
  original_title text check (char_length(original_title) <= 500),
  poster_path text check (poster_path ~ '^/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$'),
  release_date date,
  season_count smallint check (season_count >= 0),
  added_at timestamptz not null default now(),
  watched_at timestamptz,
  updated_at timestamptz not null default now(),

  constraint library_items_user_media_unique unique (user_id, media_type, tmdb_id),
  constraint library_items_watched_at_consistent
    check ((status = 'watched') = (watched_at is not null)),
  constraint library_items_season_count_tv_only
    check (media_type = 'tv' or season_count is null)
);

comment on table public.library_items is 'Per-user movies and series (watchlist / watched).';

create index library_items_user_status_updated_idx
  on public.library_items (user_id, status, updated_at desc);

create trigger library_items_set_updated_at
  before update on public.library_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- watched_seasons : une ligne existe si et seulement si la saison est vue.
-- La clé étrangère composée garantit que la série est dans la bibliothèque de
-- l'utilisateur, et supprime ses saisons quand la série est retirée (cascade).
-- ---------------------------------------------------------------------------

create table public.watched_seasons (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  media_type public.media_type not null default 'tv' check (media_type = 'tv'),
  tmdb_id integer not null check (tmdb_id > 0),
  season_number smallint not null check (season_number between 0 and 1000),
  watched_at timestamptz not null default now(),

  primary key (user_id, tmdb_id, season_number),
  constraint watched_seasons_series_fk
    foreign key (user_id, media_type, tmdb_id)
    references public.library_items (user_id, media_type, tmdb_id)
    on delete cascade
);

comment on table public.watched_seasons is 'Seasons marked as watched, per user and series.';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.library_items enable row level security;
alter table public.watched_seasons enable row level security;

revoke all on public.library_items from anon;
revoke all on public.watched_seasons from anon;
grant select, insert, update, delete on public.library_items to authenticated;
grant select, insert, update, delete on public.watched_seasons to authenticated;

-- `(select auth.uid())` est évalué une fois par requête (initPlan), pas une fois par ligne.

create policy "library_items: select own"
  on public.library_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "library_items: insert own"
  on public.library_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "library_items: update own"
  on public.library_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "library_items: delete own"
  on public.library_items for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "watched_seasons: select own"
  on public.watched_seasons for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "watched_seasons: insert own"
  on public.watched_seasons for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "watched_seasons: update own"
  on public.watched_seasons for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "watched_seasons: delete own"
  on public.watched_seasons for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Liste des emails autorisés à s'inscrire (uwatch est une application personnelle)
-- Les emails sont ajoutés à la main depuis le SQL Editor de Supabase : aucune
-- adresse personnelle n'est dans le dépôt. Aucun rôle client ne peut lire cette table.
-- ---------------------------------------------------------------------------

create table public.allowed_emails (
  email text primary key check (email = lower(email) and position('@' in email) > 1),
  created_at timestamptz not null default now()
);

alter table public.allowed_emails enable row level security;
revoke all on public.allowed_emails from anon, authenticated;

-- Auth Hook « Before User Created » : refuse l'inscription si l'email n'est pas autorisé.
-- À activer dans Dashboard → Authentication → Hooks (fonction Postgres : public.hook_before_user_created).
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  candidate text := lower(trim(event -> 'user' ->> 'email'));
begin
  if candidate is not null
    and exists (select 1 from public.allowed_emails where email = candidate) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'This account is not allowed to sign up.'
    )
  );
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_before_user_created(jsonb) from authenticated, anon, public;
grant select on public.allowed_emails to supabase_auth_admin;

create policy "allowed_emails: auth admin reads"
  on public.allowed_emails for select to supabase_auth_admin
  using (true);
