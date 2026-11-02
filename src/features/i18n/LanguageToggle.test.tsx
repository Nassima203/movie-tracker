import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LANGUAGE_STORAGE_KEY, setLanguage, t } from './i18n'
import { LanguageProvider } from './LanguageProvider'
import { LanguageToggle } from './LanguageToggle'

// Petit composant qui affiche un texte traduit, pour vérifier qu'il change.
function HomeLabel() {
  return <p>{t('nav.home')}</p>
}

function renderToggle() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LanguageProvider>
        <LanguageToggle />
        <HomeLabel />
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

describe('LanguageToggle', () => {
  afterEach(() => {
    setLanguage('fr')
    localStorage.clear()
  })

  it('shows the site in French by default', () => {
    renderToggle()

    expect(screen.getByText('Accueil')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'fr' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches the whole site to English and remembers the choice', async () => {
    renderToggle()

    await userEvent.click(screen.getByRole('button', { name: 'en' }))

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'en' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })
})
