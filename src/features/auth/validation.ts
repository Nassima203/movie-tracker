/**
 * Validation des formulaires d'authentification côté navigateur.
 *
 * Ces vérifications donnent un retour immédiat à l'utilisateur (email mal
 * formé, mot de passe trop court…). Elles ne remplacent pas les contrôles du
 * serveur : Supabase applique de son côté les vraies règles.
 */

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
  return EMAIL_PATTERN.test(email.trim()) ? undefined : 'Saisissez une adresse email valide.'
}

/** Règles pour un mot de passe choisi par l'utilisateur (inscription, réinitialisation). */
export function validateNewPassword(
  password: string,
  confirmPassword: string,
): Pick<AuthFormErrors, 'password' | 'confirmPassword'> {
  const errors: Pick<AuthFormErrors, 'password' | 'confirmPassword'> = {}

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Au moins ${String(MIN_PASSWORD_LENGTH)} caractères.`
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    // Exige au moins une lettre et au moins un chiffre.
    errors.password = 'Utilisez au moins une lettre et un chiffre.'
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = 'Les deux mots de passe ne correspondent pas.'
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
    if (values.password.length === 0) errors.password = 'Saisissez votre mot de passe.'
    return errors
  }

  return { ...errors, ...validateNewPassword(values.password, values.confirmPassword) }
}

/** Indique si au moins un champ porte un message d'erreur. */
export function hasErrors(errors: Partial<Record<string, string>>): boolean {
  return Object.values(errors).some(Boolean)
}
