/**
 * Bouton FR / EN pour changer la langue du site, affiché dans l'en-tête et
 * sur les pages de connexion.
 */
import { cn } from '@/lib/cn'
import { t, type Language } from './i18n'
import { useLanguage } from './LanguageContext'

const LANGUAGES: Language[] = ['fr', 'en']

/** Deux petits boutons ; celui de la langue active est mis en avant (aria-pressed). */
export function LanguageToggle() {
  const { language, changeLanguage } = useLanguage()

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="inline-flex rounded-full bg-fg/6 p-0.5 text-xs font-semibold"
    >
      {LANGUAGES.map((value) => (
        <button
          key={value}
          type="button"
          lang={value}
          aria-pressed={language === value}
          onClick={() => {
            if (value !== language) changeLanguage(value)
          }}
          className={cn(
            'h-8 min-w-9 rounded-full px-2 uppercase transition',
            language === value ? 'bg-surface-raised text-fg shadow' : 'text-fg-muted hover:text-fg',
          )}
        >
          {value}
        </button>
      ))}
    </div>
  )
}
