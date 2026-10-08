export const MIN_PASSWORD_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface AuthFormValues {
  email: string
  password: string
  confirmPassword: string
}

export type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>

/** Client-side checks only: Supabase enforces the real rules server-side. */
export function validateAuthForm(
  values: AuthFormValues,
  mode: 'sign-in' | 'sign-up',
): AuthFormErrors {
  const errors: AuthFormErrors = {}

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Saisissez une adresse email valide.'
  }

  if (mode === 'sign-in') {
    if (values.password.length === 0) errors.password = 'Saisissez votre mot de passe.'
    return errors
  }

  if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Au moins ${String(MIN_PASSWORD_LENGTH)} caractères.`
  } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = 'Utilisez au moins une lettre et un chiffre.'
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Les deux mots de passe ne correspondent pas.'
  }

  return errors
}
