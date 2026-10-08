// @vitest-environment node
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readProjectFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), 'utf8')
}

describe('deployment configuration', () => {
  const html = readProjectFile('index.html')
  const vercel = readProjectFile('vercel.json')

  it('allows the inline theme script in the CSP (hash must match index.html)', () => {
    const inline = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1]
    expect(inline).toBeDefined()

    const hash = createHash('sha256')
      .update(inline ?? '')
      .digest('base64')
    expect(vercel).toContain(`'sha256-${hash}'`)
  })

  it('serves the SPA for client routes but never rewrites /api', () => {
    expect(vercel).toContain('"source": "/((?!api/).*)"')
  })

  it('never exposes the TMDB token to the client bundle', () => {
    expect(readProjectFile('.env.example')).not.toMatch(/VITE_TMDB/)
  })
})
