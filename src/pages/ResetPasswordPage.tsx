/**
 * Page « Nouveau mot de passe » (/reset-password).
 *
 * Dernière étape de la réinitialisation : l'utilisateur a demandé un lien,
 * l'a ouvert depuis son email (ce qui l'a connecté), puis a été redirigé ici
 * pour choisir son nouveau mot de passe.
 */
import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AppBackdrop } from '@/components/layout/AppBackdrop'
import { Button } from '@/components/ui/Button'
import { FullPageLoader } from '@/components/ui/FullPageLoader'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/toast/useToast'
import { authErrorMessage } from '@/features/auth/authMessages'
import { updatePassword } from '@/features/auth/authService'
import { Field } from '@/features/auth/components/formFields'
import { inputClass } from '@/features/auth/components/formStyles'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { clearPasswordResetRequest } from '@/features/auth/passwordRecovery'
import { hasErrors, validateNewPassword } from '@/features/auth/validation'

/**
 * Atteinte après avoir suivi le lien de réinitialisation reçu par email : le
 * lien connecte l'utilisateur, qui choisit ensuite ici son nouveau mot de passe.
 */
export function ResetPasswordPage() {
  const auth = useAuth()

  // Le lien est en cours d'échange contre une session : on patiente.
  if (auth.status === 'loading') return <FullPageLoader label="Vérification du lien…" />

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <AppBackdrop />
      <div className="flex w-full max-w-sm animate-fade-in flex-col gap-6 rounded-3xl border border-border bg-surface-overlay px-6 py-10 shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-8">
        <h1 className="text-center text-4xl font-bold tracking-tight">
          u<span className="text-accent">watch</span>
        </h1>
        {/* Pas de session : le lien a expiré ou a été ouvert dans un autre navigateur. */}
        {auth.status === 'authenticated' ? <NewPasswordForm /> : <ExpiredLink />}
      </div>
    </main>
  )
}

// Message affiché quand le lien n'a pas pu connecter l'utilisateur.
function ExpiredLink() {
  return (
    <div role="alert" className="flex flex-col gap-4 text-center">
      <h2 className="text-lg font-semibold">Lien invalide ou expiré</h2>
      <p className="text-sm text-fg-muted">
        Ce lien ne fonctionne plus, ou il a été ouvert dans un autre navigateur que celui de la
        demande. Refaites une demande depuis la page de connexion.
      </p>
      <Link
        to="/login"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:brightness-110"
      >
        Retour à la connexion
      </Link>
    </div>
  )
}

// Formulaire de saisie (et confirmation) du nouveau mot de passe.
function NewPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string | undefined
    confirmPassword?: string | undefined
  }>({})
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const navigate = useNavigate()
  const { notify } = useToast()
  const id = useId()

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    // Évite un double envoi si l'utilisateur clique plusieurs fois.
    if (isPending) return

    const errors = validateNewPassword(password, confirmPassword)
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    setIsPending(true)
    setError(null)
    try {
      await updatePassword(password)
      // La réinitialisation est terminée : on oublie la demande en attente.
      clearPasswordResetRequest()
      notify('Mot de passe modifié.', 'success')
      // `replace` empêche de revenir sur ce formulaire avec le bouton « Précédent ».
      void navigate('/', { replace: true })
    } catch (cause) {
      // Message traduit pour l'utilisateur ; le détail brut reste dans la console (dev).
      if (import.meta.env.DEV) console.error('[auth] password update failed', cause)
      setError(authErrorMessage(cause))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-lg font-semibold">Nouveau mot de passe</h2>
        <p className="text-sm text-fg-muted">Choisissez votre nouveau mot de passe.</p>
      </div>

      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
      >
        <Field id={`${id}-password`} label="Nouveau mot de passe" error={fieldErrors.password}>
          <div className="relative">
            <input
              id={`${id}-password`}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setFieldErrors((current) => ({ ...current, password: undefined }))
              }}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? `${id}-password-error` : undefined}
              className={`${inputClass(Boolean(fieldErrors.password))} pr-12`}
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

        <Field
          id={`${id}-confirm`}
          label="Confirmer le mot de passe"
          error={fieldErrors.confirmPassword}
        >
          <input
            id={`${id}-confirm`}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value)
              setFieldErrors((current) => ({ ...current, confirmPassword: undefined }))
            }}
            aria-invalid={fieldErrors.confirmPassword ? true : undefined}
            aria-describedby={fieldErrors.confirmPassword ? `${id}-confirm-error` : undefined}
            className={inputClass(Boolean(fieldErrors.confirmPassword))}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isPending} aria-busy={isPending} className="w-full">
          {isPending && <Spinner className="size-4" />}
          Enregistrer le mot de passe
        </Button>
      </form>
    </div>
  )
}
