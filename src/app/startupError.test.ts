import { renderStartupError } from './startupError'

describe('renderStartupError', () => {
  it('replaces the blank root with a readable message', () => {
    const container = document.createElement('div')
    renderStartupError(container, new Error('Incomplete Supabase configuration'))

    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(container.textContent).toContain('uwatch ne peut pas démarrer')
  })
})
