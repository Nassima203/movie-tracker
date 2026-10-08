import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

interface FetchHandlerModule {
  default: { fetch: (request: Request) => Promise<Response> }
}

function isFetchHandlerModule(value: unknown): value is FetchHandlerModule {
  if (typeof value !== 'object' || value === null || !('default' in value)) return false
  const handler = value.default
  return typeof handler === 'object' && handler !== null && 'fetch' in handler
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
 * Development only: serves `api/tmdb.ts` from the Vite dev server so the
 * proxy works locally without the Vercel CLI. Production uses Vercel Functions.
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
            const loaded: unknown = await server.ssrLoadModule('/api/tmdb.ts')
            if (!isFetchHandlerModule(loaded)) throw new Error('api/tmdb.ts has no fetch handler')

            // `req.url` is relative to the mount point: restore the full path.
            req.url = `/api/tmdb${req.url ?? ''}`
            const response = await loaded.default.fetch(toWebRequest(req, controller.signal))
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
