-- Inscription ouverte à tous.
-- Le hook « Before User Created » refusait les emails absents de la table
-- allowed_emails. Il accepte maintenant toute inscription. La table et le hook
-- restent en place pour ne rien casser côté Supabase (le hook est encore activé
-- dans Dashboard → Authentication → Hooks).
-- Cette migration est déjà appliquée en production : ce fichier aligne le dépôt.
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
begin
  return '{}'::jsonb;
end;
$$;
