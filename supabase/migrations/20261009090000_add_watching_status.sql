-- uwatch — statut « En cours » : un film ou une série en cours de visionnage.
-- Changement additif : les lignes existantes gardent leur statut.
alter type public.library_status add value if not exists 'watching' after 'watchlist';
