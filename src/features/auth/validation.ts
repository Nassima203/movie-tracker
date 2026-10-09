export const MIN_PASSWORD_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface AuthFormValues {
  email: string
  password: string
  confirmPassword: string
}

export type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>

export function validateEmail(email: string): string | undefined {
  return EMAIL_PATTERN.test(email.trim()) ? undefined : 'Saisissez une adresse email valide.'
}

/** Rules for a password the user chooses (sign-up, reset). */
export function validateNewPassword(
  password: string,
  confirmPassword: string,
): Pick<AuthFormErrors, 'password' | 'confirmPassword'> {
  const errors: Pick<AuthFormErrors, 'password' | 'confirmPassword'> = {}

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Au moins ${String(MIN_PASSWORD_LENGTH)} caractères.`
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Utilisez au moins une lettre et un chiffre.'
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = 'Les deux mots de passe ne correspondent pas.'
  }

  return errors
}

/** Client-side checks only: Supabase enforces the real rules server-side. */
export function validateAuthForm(
  values: AuthFormValues,
  mode: 'sign-in' | 'sign-up',
): AuthFormErrors {
  const errors: AuthFormErrors = {}
  const emailError = validateEmail(values.email)
  if (emailError) errors.email = emailError

  if (mode === 'sign-in') {
    if (values.password.length === 0) errors.password = 'Saisissez votre mot de passe.'
    return errors
  }

  return { ...errors, ...validateNewPassword(values.password, values.confirmPassword) }
}

export function hasErrors(errors: Partial<Record<string, string>>): boolean {
  return Object.values(errors).some(Boolean)
}
