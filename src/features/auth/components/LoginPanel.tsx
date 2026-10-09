/**
 * Panneau de connexion / inscription.
 *
 * C'est le cœur de la page /login : deux onglets (« Connexion » et « Créer un
 * compte »), la validation des champs, l'affichage des erreurs et des
 * messages de confirmation, et l'accès au formulaire « Mot de passe oublié ».
 */
import { Eye, EyeOff, MailCheck } from 'lucide-react'
import { useId, useState, type SubmitEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { authErrorMessage } from '../authMessages'
import { signIn, signUp } from '../authService'
import { clearPasswordResetRequest } from '../passwordRecovery'
import { rememberPostLoginRedirect } from '../redirect'
import {
  hasErrors,
  validateAuthForm,
  type AuthFormErrors,
  type AuthFormValues,
} from '../validation'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { Field, Notice } from './formFields'
import { inputClass } from './formStyles'

// Onglet actif : connexion ou création de compte.
type Mode = 'sign-in' | 'sign-up'

interface LoginPanelProps {
  /** Page où renvoyer l'utilisateur une fois connecté. */
  redirectTo: string
  /** Erreur éventuelle lue dans l'URL (lien expiré…), affichée dès l'ouverture. */
  initialError: string | null
}

const EMPTY_VALUES: AuthFormValues = { email: '', password: '', confirmPassword: '' }

/**
 * Formulaire de connexion et d'inscription par email et mot de passe.
 * En cas de succès de connexion, rien n'est fait ici : le changement d'état
 * de session suffit pour que LoginPage redirige l'utilisateur.
 */
export function LoginPanel({ redirectTo, initialError }: LoginPanelProps) {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [values, setValues] = useState<AuthFormValues>(EMPTY_VALUES)
  const [fieldErrors, setFieldErrors] = useState<AuthFormErrors>({})
  const [error, setError] = useState<string | null>(initialError)
  const [isPending, setIsPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  // Message de succès affiché au-dessus du formulaire (compte créé, ou email
  // de réinitialisation envoyé).
  const [notice, setNotice] = useState<{ kind: 'sign-up' | 'reset'; email: string } | null>(null)
  const [showForgot, setShowForgot] = useState(false)
  const id = useId()

  // Change d'onglet en effaçant les erreurs et les mots de passe saisis
  // (l'email est conservé pour ne pas avoir à le retaper).
  function switchMode(next: Mode) {
    setMode(next)
    setFieldErrors({})
    setError(null)
    setValues((current) => ({ ...current, password: '', confirmPassword: '' }))
  }

  // Met à jour un champ et efface son message d'erreur dès que l'utilisateur corrige.
  function update(field: keyof AuthFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    // Évite un double envoi si l'utilisateur clique plusieurs fois.
    if (isPending) return

    const errors = validateAuthForm(values, mode)
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    const credentials = { email: values.email.trim().toLowerCase(), password: values.password }
    setIsPending(true)
    setError(null)
    // Mémorisé avant l'appel : la redirection aura lieu après le changement de
    // session, quand ce composant ne sera peut-être plus affiché.
    rememberPostLoginRedirect(redirectTo)

    try {
      if (mode === 'sign-in') {
        // En cas de succès, l'état de session change et la page de connexion redirige.
        await signIn(credentials)
        // Connecté avec un mot de passe : plus de réinitialisation en attente à reprendre.
        clearPasswordResetRequest()
        return
      }
      const result = await signUp(credentials)
      // Si la confirmation par email est requise, on invite l'utilisateur à
      // cliquer sur le lien puis à se connecter.
      if (result.status === 'confirmation_required') {
        setNotice({ kind: 'sign-up', email: credentials.email })
        switchMode('sign-in')
      }
    } catch (cause) {
      // Jamais de message brut du fournisseur : authErrorMessage le traduit.
      if (import.meta.env.DEV) console.error('[auth] request failed', cause)
      setError(authErrorMessage(cause))
    } finally {
      setIsPending(false)
    }
  }

  const isSignUp = mode === 'sign-up'

  // Le formulaire « Mot de passe oublié » remplace temporairement tout le panneau.
  if (showForgot) {
    return (
      <ForgotPasswordForm
        initialEmail={values.email}
        onBack={() => {
          setShowForgot(false)
        }}
        onSent={(email) => {
          setShowForgot(false)
          switchMode('sign-in')
          setNotice({ kind: 'reset', email })
        }}
      />
    )
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div
        role="group"
        aria-label="Choisir une action"
        className="grid grid-cols-2 gap-1 rounded-xl bg-fg/6 p-1"
      >
        {(
          [
            ['sign-in', 'Connexion'],
            ['sign-up', 'Créer un compte'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => {
              switchMode(value)
              setNotice(null)
            }}
            className={cn(
              'h-10 rounded-lg text-sm font-medium transition',
              mode === value ? 'bg-surface-raised text-fg shadow' : 'text-fg-muted hover:text-fg',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && (
        <Notice>
          <div className="flex gap-3">
            <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
            {notice.kind === 'sign-up' ? (
              <p>
                Compte créé. Un email de confirmation a été envoyé à{' '}
                <strong className="font-semibold break-all">{notice.email}</strong>. Cliquez sur le
                lien qu’il contient, puis connectez-vous ici.
              </p>
            ) : (
              <p>
                Si un compte existe pour{' '}
                <strong className="font-semibold break-all">{notice.email}</strong>, un email vient
                d’être envoyé. Ouvrez le lien qu’il contient{' '}
                <strong className="font-semibold">dans ce navigateur</strong>.
              </p>
            )}
          </div>
        </Notice>
      )}

      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
      >
        <Field id={`${id}-email`} label="Adresse email" error={fieldErrors.email}>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={(event) => {
              update('email', event.target.value)
            }}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? `${id}-email-error` : undefined}
            className={inputClass(Boolean(fieldErrors.email))}
          />
        </Field>

        <Field id={`${id}-password`} label="Mot de passe" error={fieldErrors.password}>
          <div className="relative">
            <input
              id={`${id}-password`}
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={values.password}
              onChange={(event) => {
                update('password', event.target.value)
              }}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? `${id}-password-error` : undefined}
              className={cn(inputClass(Boolean(fieldErrors.password)), 'pr-12')}
            />
            <button
              type="button"
              onClick={() => {
                setShowPassword((current) => !current)
              }}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-1 my-auto inline-flex size-10 items-center justify-center rounded-lg text-fg-muted hover:text-fg"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-5" />
              ) : (
                <Eye aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        </Field>

        {!isSignUp && (
          <button
            type="button"
            onClick={() => {
              setNotice(null)
              setShowForgot(true)
            }}
            className="-mt-2 self-end rounded text-sm text-fg-muted underline-offset-4 hover:text-accent hover:underline"
          >
            Mot de passe oublié ?
          </button>
        )}

        {isSignUp && (
          <Field
            id={`${id}-confirm`}
            label="Confirmer le mot de passe"
            error={fieldErrors.confirmPassword}
          >
            <input
              id={`${id}-confirm`}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(event) => {
                update('confirmPassword', event.target.value)
              }}
              aria-invalid={fieldErrors.confirmPassword ? true : undefined}
              aria-describedby={fieldErrors.confirmPassword ? `${id}-confirm-error` : undefined}
              className={inputClass(Boolean(fieldErrors.confirmPassword))}
            />
          </Field>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isPending} aria-busy={isPending} className="mt-1 w-full">
          {isPending && <Spinner className="size-4" />}
          {isSignUp ? 'Créer mon compte' : 'Se connecter'}
        </Button>
      </form>
    </div>
  )
}
