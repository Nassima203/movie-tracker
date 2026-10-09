/**
 * Formulaire « Mot de passe oublié ».
 *
 * Affiché à la place du formulaire de connexion quand l'utilisateur clique sur
 * « Mot de passe oublié ? ». Il envoie la demande de lien de réinitialisation
 * puis mémorise cette demande pour que l'app ouvre la bonne page au retour.
 */
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

// Propriétés reçues du panneau de connexion parent.
interface ForgotPasswordFormProps {
  /** Email déjà saisi dans le formulaire de connexion, pour éviter de le retaper. */
  initialEmail: string
  /** Revenir au formulaire de connexion. */
  onBack: () => void
  /** Appelé quand la demande est envoyée, avec l'email normalisé. */
  onSent: (email: string) => void
}

/**
 * Demande un email de réinitialisation du mot de passe.
 * Par sécurité, la réponse est la même que le compte existe ou non (voir le
 * message affiché par LoginPanel), pour ne pas révéler les adresses inscrites.
 */
export function ForgotPasswordForm({ initialEmail, onBack, onSent }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState(initialEmail)
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const id = useId()

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    // Évite un double envoi si l'utilisateur clique plusieurs fois.
    if (isPending) return

    const emailError = validateEmail(email)
    setFieldError(emailError)
    if (emailError) return

    // Même normalisation que pour la connexion : espaces retirés, minuscules.
    const normalized = email.trim().toLowerCase()
    setIsPending(true)
    setError(null)
    try {
      await requestPasswordReset(normalized)
      // Retient la demande : au retour via le lien, l'app ouvrira la page
      // « nouveau mot de passe » (voir PostLoginRedirect).
      markPasswordResetRequested()
      onSent(normalized)
    } catch (cause) {
      // Détail technique en développement seulement ; l'utilisateur voit un message clair.
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
