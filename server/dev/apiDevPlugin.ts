import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

type ProxyFactory = (
  env: NodeJS.ProcessEnv,
  options: { allowAnonymousWithoutSupabase: boolean },
) => (request: Request) => Promise<Response>

function readFactory(module: unknown): ProxyFactory {
  if (typeof module === 'object' && module !== null && 'createProxyFromEnv' in module) {
    const factory = module.createProxyFromEnv
    // Dynamically loaded module: the shape is checked above, the signature is ours.
    if (typeof factory === 'function') return factory as ProxyFactory
  }
  throw new Error('server/tmdb/createProxyFromEnv.ts has no createProxyFromEnv export')
}

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

async function sendWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  res.end(Buffer.from(await response.arrayBuffer()))
}

/**
 * Development only: serves the TMDB proxy from the Vite dev server so it works
 * locally without the Vercel CLI. Production uses the Vercel Function
 * (api/tmdb.ts), which always requires a Supabase session. Locally, without
 * Supabase, TMDB can be used anonymously to try the interface.
 */
export function apiDevPlugin(): Plugin {
  return {
    name: 'uwatch-api-dev',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/tmdb', (req, res) => {
        const controller = new AbortController()
        res.on('close', () => {
          controller.abort()
        })

        void (async () => {
          try {
            const createProxy = readFactory(
              await server.ssrLoadModule('/server/tmdb/createProxyFromEnv.ts'),
            )
            const handle = createProxy(process.env, { allowAnonymousWithoutSupabase: true })

            // `req.url` is relative to the mount point: restore the full path.
            req.url = `/api/tmdb${req.url ?? ''}`
            const response = await handle(toWebRequest(req, controller.signal))
            await sendWebResponse(res, response)
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
