-- uwatch — "En cours" status: a movie or series the user is currently watching.
-- Additive change: existing rows keep their status.
alter type public.library_status add value if not exists 'watching' after 'watchlist';
