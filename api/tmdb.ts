/**
 * Point d'entrée Vercel : GET /api/tmdb?resource=search|trending|movie|tv|season&…
 *
 * Vercel transforme automatiquement chaque fichier du dossier `api/` en
 * « fonction serveur ». Celle-ci sert de relais (proxy) vers l'API TMDB :
 * le token TMDB reste ici, sur le serveur, et n'est jamais envoyé au navigateur.
 *
 * En production, l'accès anonyme est interdit : seule une utilisatrice
 * connectée à uwatch (session Supabase valide) peut l'utiliser.
 */
import { createProxyFromEnv } from '../server/tmdb/createProxyFromEnv.js'

// Créé une seule fois par instance de la fonction, puis réutilisé à chaque requête.
const handle = createProxyFromEnv(process.env, { allowAnonymousWithoutSupabase: false })

export default {
  // Format « Web standard » attendu par Vercel : une Request en entrée, une Response en sortie.
  fetch(request: Request): Promise<Response> {
    return handle(request)
  },
}
