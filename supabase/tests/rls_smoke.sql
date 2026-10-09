-- Test de la RLS et des contraintes. Lancer avec : npm run test:db (nécessite un PostgreSQL local).
\set ON_ERROR_STOP 1
create or replace function pg_temp.expect_error(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then raise notice 'OK (rejected) %: %', label, sqlerrm; return; end;
  raise exception 'FAIL: expected error for %', label;
end $$;

-- utilisateur A
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into library_items (media_type, tmdb_id, title) values ('tv', 1396, 'Breaking Bad');
insert into library_items (media_type, tmdb_id, title, status, watched_at) values ('movie', 550, 'Fight Club', 'watched', now());
-- le même id TMDB est autorisé pour un film et une série
insert into library_items (media_type, tmdb_id, title) values ('movie', 1396, 'Some movie');
-- statut « en cours » (ajouté par une migration ultérieure)
update library_items set status = 'watching' where media_type = 'movie' and tmdb_id = 1396;
select pg_temp.expect_error($$update library_items set status = 'watching', watched_at = now() where tmdb_id = 1396 and media_type = 'movie'$$, 'watching with watched_at');
-- un upsert (on_conflict de PostgREST) ne crée pas de doublon
insert into library_items (media_type, tmdb_id, title) values ('tv', 1396, 'Breaking Bad')
  on conflict (user_id, media_type, tmdb_id) do update set title = excluded.title;
select pg_temp.expect_error($$insert into library_items (media_type, tmdb_id, title) values ('tv', 1396, 'dup')$$, 'duplicate');
insert into watched_seasons (tmdb_id, season_number) values (1396, 1), (1396, 2);
select pg_temp.expect_error($$insert into watched_seasons (tmdb_id, season_number) values (999, 1)$$, 'season without series');
select pg_temp.expect_error($$insert into watched_seasons (media_type, tmdb_id, season_number) values ('movie', 550, 1)$$, 'season on movie');
select pg_temp.expect_error($$insert into library_items (media_type, tmdb_id, title, user_id) values ('tv', 1, 'spoof', '00000000-0000-0000-0000-00000000000b')$$, 'user_id spoofing');
select pg_temp.expect_error($$insert into library_items (media_type, tmdb_id, title, status) values ('movie', 2, 'x', 'watched')$$, 'watched without watched_at');
select pg_temp.expect_error($$insert into library_items (media_type, tmdb_id, title, poster_path) values ('movie', 3, 'x', 'javascript:alert(1)')$$, 'bad poster path');
select pg_temp.expect_error($$insert into library_items (media_type, tmdb_id, title, season_count) values ('movie', 4, 'x', 3)$$, 'season_count on movie');
select pg_temp.expect_error($$select * from allowed_emails$$, 'authenticated reads allowlist');
select pg_temp.expect_error($$select public.hook_before_user_created('{}'::jsonb)$$, 'authenticated calls hook');
select count(*) as a_items from library_items;

-- l'utilisateur B ne voit rien et ne peut pas toucher aux lignes de A
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  if (select count(*) from library_items) <> 0 then raise exception 'FAIL: B sees A rows'; end if;
  if (select count(*) from watched_seasons) <> 0 then raise exception 'FAIL: B sees A seasons'; end if;
end $$;
update library_items set title = 'hacked';
delete from library_items;
delete from watched_seasons;

-- A : données intactes ; transférer une ligne à B est refusé
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  if (select count(*) from library_items where title = 'hacked') <> 0 then raise exception 'FAIL: B updated A rows'; end if;
  if (select count(*) from library_items) <> 3 then raise exception 'FAIL: A rows changed'; end if;
  if (select count(*) from watched_seasons) <> 2 then raise exception 'FAIL: A seasons changed'; end if;
end $$;
select pg_temp.expect_error($$update library_items set user_id = '00000000-0000-0000-0000-00000000000b' where tmdb_id = 550$$, 'reassign row to another user');
-- déclencheur updated_at + suppression en cascade
update library_items set status = 'watched', watched_at = now() where tmdb_id = 1396 and media_type = 'tv';
delete from library_items where tmdb_id = 1396 and media_type = 'tv';
do $$ begin
  if (select count(*) from watched_seasons) <> 0 then raise exception 'FAIL: cascade'; end if;
end $$;

-- un visiteur non connecté (anon) n'a aucun accès
reset role; set role anon;
select pg_temp.expect_error($$select * from library_items$$, 'anon select');
reset role;

-- le hook, appelé comme le ferait Supabase Auth
insert into allowed_emails values ('me@example.com');
set role supabase_auth_admin;
select public.hook_before_user_created('{"user":{"email":"Me@Example.com "}}') as allowed;
select public.hook_before_user_created('{"user":{"email":"intruder@example.com"}}') as denied;
select public.hook_before_user_created('{"user":{}}') as no_email;
reset role;
select 'ALL RLS TESTS PASSED';
