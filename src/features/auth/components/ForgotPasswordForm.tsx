import { ArrowLeft } from 'lucide-react'
import { useId, useState, type SubmitEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { authErrorMessage } from '../authMessages'
import { requestPasswordReset } from '../authService'
import { markPasswordResetRequested } from '../passwordRecovery'
import { validateEmail } from '../validation'
import { Field } from './formFields'
import { inputClass } from './formStyles'

interface ForgotPasswordFormProps {
  initialEmail: string
  onBack: () => void
  onSent: (email: string) => void
}

export function ForgotPasswordForm({ initialEmail, onBack, onSent }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState(initialEmail)
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const id = useId()

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return

    const emailError = validateEmail(email)
    setFieldError(emailError)
    if (emailError) return

    const normalized = email.trim().toLowerCase()
    setIsPending(true)
    setError(null)
    try {
      await requestPasswordReset(normalized)
      markPasswordResetRequested()
      onSent(normalized)
    } catch (cause) {
      if (import.meta.env.DEV) console.error('[auth] reset request failed', cause)
      setError(authErrorMessage(cause))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">Mot de passe oublié</h3>
        <p className="text-sm text-fg-muted">
          Saisissez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe.
        </p>
      </div>

      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
      >
        <Field id={`${id}-email`} label="Adresse email" error={fieldError}>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setFieldError(undefined)
            }}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? `${id}-email-error` : undefined}
            className={inputClass(Boolean(fieldError))}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isPending} aria-busy={isPending} className="w-full">
          {isPending && <Spinner className="size-4" />}
          Envoyer le lien
        </Button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center justify-center gap-1.5 self-center rounded text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Retour à la connexion
      </button>
    </div>
  )
}
