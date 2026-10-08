import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { THEME_STORAGE_KEY } from './theme'
import { ThemeProvider } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'

function renderToggle() {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

describe('ThemeToggle', () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.dataset['theme'] = 'dark'
  })

  it('defaults to night mode', () => {
    renderToggle()
    expect(screen.getByRole('button', { name: 'Activer le mode jour' })).toBeInTheDocument()
  })

  it('switches theme and persists the choice', async () => {
    renderToggle()
    await userEvent.click(screen.getByRole('button', { name: 'Activer le mode jour' }))

    expect(document.documentElement.dataset['theme']).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(screen.getByRole('button', { name: 'Activer le mode nuit' })).toBeInTheDocument()
  })

  it('restores the stored theme and ignores invalid values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    renderToggle()
    expect(screen.getByRole('button', { name: 'Activer le mode nuit' })).toBeInTheDocument()
  })

  it('falls back to night mode for an unknown stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon')
    renderToggle()
    expect(screen.getByRole('button', { name: 'Activer le mode jour' })).toBeInTheDocument()
  })
})
