/**
 * Page « Nouveau mot de passe » (/reset-password).
 *
 * Dernière étape de la réinitialisation : l'utilisateur a demandé un lien et
 * l'a ouvert depuis son email. Le lien (`?token_hash=…&type=recovery`) est
 * vérifié ici, ce qui le connecte, puis il choisit son nouveau mot de passe.
 */
import { Check, Eye, EyeOff } from 'lucide-react'
import { useEffect, useId, useState, type SubmitEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { FullPageLoader } from '@/components/ui/FullPageLoader'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast/useToast'
import { authErrorMessage } from '@/features/auth/authMessages'
import { updatePassword, verifyEmailLink } from '@/features/auth/authService'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { Field } from '@/features/auth/components/formFields'
import { inputClass } from '@/features/auth/components/formStyles'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  clearPasswordResetRequest,
  markPasswordResetRequested,
  RESET_PASSWORD_PATH,
} from '@/features/auth/passwordRecovery'
import { AuthFailure } from '@/features/auth/types'
import { checkPasswordRules, hasErrors, validateNewPassword } from '@/features/auth/validation'
import { cn } from '@/lib/cn'
import { t } from '@/features/i18n/i18n'

// État de la vérification du jeton présent dans l'URL.
type LinkState =
  | { status: 'none' }
  | { status: 'verifying' }
  | { status: 'verified' }
  | { status: 'failed'; message: string | undefined }

/**
 * Vérifie le lien de réinitialisation s'il est dans l'URL, puis affiche le
 * formulaire (session ouverte) ou un message de lien invalide.
 */
export function ResetPasswordPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenHash = searchParams.get('token_hash')
  const isRecoveryLink = tokenHash !== null && searchParams.get('type') === 'recovery'
  const [link, setLink] = useState<LinkState>(() =>
    isRecoveryLink ? { status: 'verifying' } : { status: 'none' },
  )

  useEffect(() => {
    if (!isRecoveryLink) return
    let cancelled = false
    verifyEmailLink(tokenHash, 'recovery')
      .then(() => {
        if (cancelled) return
        markPasswordResetRequested()
        setLink({ status: 'verified' })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        if (import.meta.env.DEV) console.error('[auth] recovery link failed', cause)
        // Message précis seulement pour une erreur connue (lien expiré, réseau…).
        const known = cause instanceof AuthFailure && cause.kind !== 'unknown'
        setLink({ status: 'failed', message: known ? authErrorMessage(cause) : undefined })
      })
      .finally(() => {
        // Le jeton est à usage unique : on le retire de l'URL et de l'historique.
        if (!cancelled) void navigate(RESET_PASSWORD_PATH, { replace: true })
      })
    return () => {
      cancelled = true
    }
  }, [isRecoveryLink, tokenHash, navigate])

  if (link.status === 'failed') return <ExpiredLink message={link.message} />

  // Vérification du jeton, ou échange d'un ancien lien (?code=…) contre une session.
  if (
    link.status === 'verifying' ||
    auth.status === 'loading' ||
    (link.status === 'verified' && auth.status !== 'authenticated')
  ) {
    return <FullPageLoader label={t('reset.verifying')} />
  }

  // Pas de session : le lien a expiré ou n'a pas pu connecter l'utilisateur.
  if (auth.status !== 'authenticated') return <ExpiredLink />

  return (
    <AuthCard>
      <NewPasswordForm />
    </AuthCard>
  )
}

// Message affiché quand le lien n'a pas pu connecter l'utilisateur.
function ExpiredLink({ message }: { message?: string | undefined }) {
  return (
    <AuthCard>
      <div role="alert" className="flex w-full flex-col gap-4 text-center">
        <h2 className="text-lg font-semibold">{t('reset.expiredTitle')}</h2>
        <p className="text-sm text-fg-muted">{message ?? t('reset.expiredText')}</p>
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:brightness-110"
        >
          {t('auth.backToLogin')}
        </Link>
      </div>
    </AuthCard>
  )
}

// Critères affichés sous le premier champ, cochés au fil de la saisie.
const RULE_LABELS = [
  ['minLength', 'reset.ruleMinLength'],
  ['hasLetter', 'reset.ruleLetter'],
  ['hasDigit', 'reset.ruleDigit'],
] as const

// Formulaire de saisie (et confirmation) du nouveau mot de passe.
function NewPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // Le message « ne correspondent pas » n'apparaît qu'une fois la confirmation commencée.
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const navigate = useNavigate()
  const { notify } = useToast()
  const id = useId()

  const rules = checkPasswordRules(password)
  const canSubmit = !hasErrors(validateNewPassword(password, confirmPassword))
  const mismatch =
    confirmTouched && confirmPassword !== password ? t('validation.mismatch') : undefined

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    // Évite un double envoi, ou un envoi au clavier d'un formulaire incomplet.
    if (isPending || !canSubmit) return

    setIsPending(true)
    setError(null)
    try {
      await updatePassword(password)
      // La réinitialisation est terminée : on oublie la demande en attente.
      clearPasswordResetRequest()
      notify(t('reset.success'), 'success')
      // `replace` empêche de revenir sur ce formulaire avec le bouton « Précédent ».
      void navigate('/', { replace: true })
    } catch (cause) {
      // Message traduit pour l'utilisateur ; le détail brut reste dans la console (dev).
      if (import.meta.env.DEV) console.error('[auth] password update failed', cause)
      setError(authErrorMessage(cause))
      setIsPending(false)
    }
  }

  // Abandon : l'utilisateur reste connecté et garde son mot de passe actuel.
  function handleCancel() {
    clearPasswordResetRequest()
    void navigate('/', { replace: true })
  }

  // Bouton œil partagé par les deux champs : il les affiche ou masque ensemble.
  const toggle = (
    <button
      type="button"
      onClick={() => {
        setShowPassword((current) => !current)
      }}
      aria-label={showPassword ? t('reset.hidePasswords') : t('reset.showPasswords')}
      aria-pressed={showPassword}
      aria-controls={`${id}-password ${id}-confirm`}
      className="absolute inset-y-0 right-1 my-auto inline-flex size-10 items-center justify-center rounded-lg text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
    >
      {showPassword ? (
        <EyeOff aria-hidden="true" className="size-5" />
      ) : (
        <Eye aria-hidden="true" className="size-5" />
      )}
    </button>
  )

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-lg font-semibold">{t('reset.title')}</h2>
        <p className="text-sm text-fg-muted">{t('reset.subtitle')}</p>
      </div>

      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
      >
        <Field id={`${id}-password`} label={t('reset.newPassword')} error={undefined}>
          <div className="relative">
            <input
              id={`${id}-password`}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
              }}
              aria-describedby={`${id}-rules`}
              className={cn(inputClass(false), 'pr-12')}
            />
            {toggle}
          </div>
          <ul id={`${id}-rules`} aria-label={t('reset.rules')} className="mt-1 space-y-1">
            {RULE_LABELS.map(([rule, labelKey]) => (
              <li
                key={rule}
                className={cn(
                  'flex items-center gap-2 text-xs transition-colors',
                  rules[rule] ? 'text-success' : 'text-fg-muted',
                )}
              >
                <Check aria-hidden="true" className="size-4 shrink-0" />
                {t(labelKey)}
                <span className="sr-only">
                  {rules[rule] ? t('reset.ruleMet') : t('reset.ruleNotMet')}
                </span>
              </li>
            ))}
          </ul>
        </Field>

        <Field id={`${id}-confirm`} label={t('auth.confirmPassword')} error={mismatch}>
          <div className="relative">
            <input
              id={`${id}-confirm`}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setConfirmTouched(true)
              }}
              aria-invalid={mismatch ? true : undefined}
              aria-describedby={mismatch ? `${id}-confirm-error` : undefined}
              className={cn(inputClass(Boolean(mismatch)), 'pr-12')}
            />
            {toggle}
          </div>
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={!canSubmit || isPending}
          aria-busy={isPending}
          className="mt-1 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {isPending && <Spinner className="size-4" />}
          {t('reset.submit')}
        </Button>
      </form>

      <button
        type="button"
        onClick={handleCancel}
        className="self-center rounded text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {t('reset.cancel')}
      </button>
    </div>
  )
}
