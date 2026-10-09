/**
 * Plugin Vite pour le DÉVELOPPEMENT uniquement (`npm run dev`).
 *
 * En production, `/api/tmdb` est une fonction Vercel (api/tmdb.ts). En local,
 * il n'y a pas de Vercel : ce plugin branche le même code du proxy directement
 * dans le serveur de développement de Vite. Sans Supabase configuré, l'accès
 * anonyme est autorisé ici pour pouvoir tester l'interface avec un simple token TMDB.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

type ProxyFactory = (
  env: NodeJS.ProcessEnv,
  options: { allowAnonymousWithoutSupabase: boolean },
) => (request: Request) => Promise<Response>

/** Récupère `createProxyFromEnv` dans le module chargé dynamiquement, en vérifiant sa forme. */
function readFactory(module: unknown): ProxyFactory {
  if (typeof module === 'object' && module !== null && 'createProxyFromEnv' in module) {
    const factory = module.createProxyFromEnv
    // Module chargé dynamiquement : sa forme est vérifiée juste au-dessus, la signature est la nôtre.
    if (typeof factory === 'function') return factory as ProxyFactory
  }
  throw new Error('server/tmdb/createProxyFromEnv.ts has no createProxyFromEnv export')
}

/** Convertit la requête Node.js (format du serveur Vite) en Request « Web standard ». */
function toWebRequest(req: IncomingMessage, signal: AbortSignal): Request {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value)
    else if (Array.isArray(value)) headers.set(key, value.join(', '))
  }
  return new Request(new URL(req.url ?? '/', 'http://localhost'), {
    method: req.method ?? 'GET',
    headers,
    signal,
  })
}

/** Recopie la Response « Web standard » dans la réponse Node.js. */
async function sendWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  res.end(Buffer.from(await response.arrayBuffer()))
}

export function apiDevPlugin(): Plugin {
  return {
    name: 'uwatch-api-dev',
    apply: 'serve', // actif uniquement avec `vite` (dev), jamais dans le build
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/tmdb', (req, res) => {
        // Si le navigateur ferme la connexion, on annule aussi l'appel à TMDB.
        const controller = new AbortController()
        res.on('close', () => {
          controller.abort()
        })

        void (async () => {
          try {
            // Rechargé à chaque requête : une modification du proxy est prise en compte sans redémarrer.
            const createProxy = readFactory(
              await server.ssrLoadModule('/server/tmdb/createProxyFromEnv.ts'),
            )
            const handle = createProxy(process.env, { allowAnonymousWithoutSupabase: true })

            // Vite retire le préfixe `/api/tmdb` de l'URL : on le remet pour le proxy.
            req.url = `/api/tmdb${req.url ?? ''}`
            await sendWebResponse(res, await handle(toWebRequest(req, controller.signal)))
          } catch (error) {
            server.config.logger.error(`[api] ${String(error)}`)
            if (!res.headersSent) res.statusCode = 500
            res.end()
          }
        })()
      })
    },
  }
}
