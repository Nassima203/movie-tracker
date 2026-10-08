import { Eye, EyeOff, MailCheck } from 'lucide-react'
import { useId, useState, type ReactNode, type SubmitEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { authErrorMessage } from '../authMessages'
import { signIn, signUp } from '../authService'
import { rememberPostLoginRedirect } from '../redirect'
import { validateAuthForm, type AuthFormErrors, type AuthFormValues } from '../validation'

type Mode = 'sign-in' | 'sign-up'

interface LoginPanelProps {
  redirectTo: string
  initialError: string | null
}

const EMPTY_VALUES: AuthFormValues = { email: '', password: '', confirmPassword: '' }

export function LoginPanel({ redirectTo, initialError }: LoginPanelProps) {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [values, setValues] = useState<AuthFormValues>(EMPTY_VALUES)
  const [fieldErrors, setFieldErrors] = useState<AuthFormErrors>({})
  const [error, setError] = useState<string | null>(initialError)
  const [isPending, setIsPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null)
  const id = useId()

  function switchMode(next: Mode) {
    setMode(next)
    setFieldErrors({})
    setError(null)
    setValues((current) => ({ ...current, password: '', confirmPassword: '' }))
  }

  function update(field: keyof AuthFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return

    const errors = validateAuthForm(values, mode)
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    const credentials = { email: values.email.trim().toLowerCase(), password: values.password }
    setIsPending(true)
    setError(null)
    rememberPostLoginRedirect(redirectTo)

    try {
      if (mode === 'sign-in') {
        // On success the auth state changes and the login page redirects.
        await signIn(credentials)
        return
      }
      const result = await signUp(credentials)
      if (result.status === 'confirmation_required') {
        setConfirmationSentTo(credentials.email)
        switchMode('sign-in')
      }
    } catch (cause) {
      if (import.meta.env.DEV) console.error('[auth] request failed', cause)
      setError(authErrorMessage(cause))
    } finally {
      setIsPending(false)
    }
  }

  const isSignUp = mode === 'sign-up'

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
              setConfirmationSentTo(null)
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

      {confirmationSentTo && (
        <div
          role="status"
          className="flex gap-3 rounded-xl bg-success/10 px-4 py-3 text-sm ring-1 ring-success/30"
        >
          <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
          <p>
            Compte créé. Un email de confirmation a été envoyé à{' '}
            <strong className="font-semibold break-all">{confirmationSentTo}</strong>. Cliquez sur
            le lien qu’il contient, puis connectez-vous ici.
          </p>
        </div>
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

function inputClass(hasError: boolean): string {
  return cn(
    'h-12 w-full rounded-xl border bg-surface px-4 text-base text-fg outline-none transition placeholder:text-fg-muted',
    'focus-visible:border-accent focus-visible:outline-none',
    hasError ? 'border-danger' : 'border-border',
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error: string | undefined
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
