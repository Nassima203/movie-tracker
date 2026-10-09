-- uwatch — index sur la clé étrangère composée watched_seasons → library_items :
-- retirer une série (ON DELETE CASCADE) ne parcourt plus toute la table.
create index if not exists watched_seasons_series_fk_idx
  on public.watched_seasons (user_id, media_type, tmdb_id);
