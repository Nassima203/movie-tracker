/**
 * Validation des formulaires d'authentification côté navigateur.
 *
 * Ces vérifications donnent un retour immédiat à l'utilisateur (email mal
 * formé, mot de passe trop court…). Elles ne remplacent pas les contrôles du
 * serveur : Supabase applique de son côté les vraies règles.
 */
import { t } from '@/features/i18n/i18n'

// Longueur minimale d'un nouveau mot de passe.
const MIN_PASSWORD_LENGTH = 8

// Vérification volontairement simple : « quelque chose@quelque chose.extension ».
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Valeurs saisies dans le formulaire de connexion / inscription. */
export interface AuthFormValues {
  email: string
  password: string
  confirmPassword: string
}

/** Message d'erreur éventuel pour chaque champ du formulaire. */
export type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>

/** Renvoie un message d'erreur si l'email est mal formé, sinon `undefined`. */
export function validateEmail(email: string): string | undefined {
  return EMAIL_PATTERN.test(email.trim()) ? undefined : t('validation.email')
}

/** Critères d'un nouveau mot de passe, vérifiés un par un (affichés en direct). */
interface PasswordRules {
  minLength: boolean
  hasLetter: boolean
  hasDigit: boolean
}

/** Indique, pour chaque critère, s'il est respecté par le mot de passe. */
export function checkPasswordRules(password: string): PasswordRules {
  return {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasLetter: /[A-Za-z]/.test(password),
    hasDigit: /\d/.test(password),
  }
}

/** Règles pour un mot de passe choisi par l'utilisateur (inscription, réinitialisation). */
export function validateNewPassword(
  password: string,
  confirmPassword: string,
): Pick<AuthFormErrors, 'password' | 'confirmPassword'> {
  const errors: Pick<AuthFormErrors, 'password' | 'confirmPassword'> = {}
  const rules = checkPasswordRules(password)

  if (!rules.minLength) {
    errors.password = t('validation.minLength', { min: MIN_PASSWORD_LENGTH })
  } else if (!rules.hasLetter || !rules.hasDigit) {
    // Exige au moins une lettre et au moins un chiffre.
    errors.password = t('validation.letterAndDigit')
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = t('validation.mismatch')
  }

  return errors
}

/** Vérifications côté client uniquement : Supabase applique les vraies règles côté serveur. */
export function validateAuthForm(
  values: AuthFormValues,
  mode: 'sign-in' | 'sign-up',
): AuthFormErrors {
  const errors: AuthFormErrors = {}
  const emailError = validateEmail(values.email)
  if (emailError) errors.email = emailError

  // À la connexion, on vérifie seulement que le mot de passe est rempli : ses
  // règles de complexité ne concernent que la création d'un mot de passe.
  if (mode === 'sign-in') {
    if (values.password.length === 0) errors.password = t('validation.passwordRequired')
    return errors
  }

  return { ...errors, ...validateNewPassword(values.password, values.confirmPassword) }
}

/** Indique si au moins un champ porte un message d'erreur. */
export function hasErrors(errors: Partial<Record<string, string>>): boolean {
  return Object.values(errors).some(Boolean)
}
