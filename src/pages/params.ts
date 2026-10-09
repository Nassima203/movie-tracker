/**
 * Outils de lecture des paramètres d'URL des pages.
 */

/**
 * Les paramètres de route sont des saisies utilisateur : on n'accepte que des
 * identifiants entiers positifs. Renvoie `null` si la valeur est invalide.
 */
export function parseTmdbIdParam(value: string | undefined): number | null {
  // Uniquement des chiffres (10 au maximum) : refuse « 12abc », « -3 », « 1e5 »…
  if (!value || !/^\d{1,10}$/.test(value)) return null
  const id = Number(value)
  // Borne haute : plus grand entier signé sur 32 bits.
  return id > 0 && id <= 2_147_483_647 ? id : null
}
