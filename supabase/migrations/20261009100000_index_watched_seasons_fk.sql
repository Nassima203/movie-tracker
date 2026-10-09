-- uwatch — index covering the composite FK watched_seasons → library_items, so
-- removing a series (ON DELETE CASCADE) does not scan the whole table.
create index if not exists watched_seasons_series_fk_idx
  on public.watched_seasons (user_id, media_type, tmdb_id);
