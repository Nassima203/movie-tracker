/**
 * Petit utilitaire pour composer des classes CSS (Tailwind) dans les composants.
 * Permet d'écrire `cn('a', condition && 'b')` sans se soucier des valeurs vides.
 */

/**
 * Assemble les noms de classes « vrais » (non vides) en une seule chaîne.
 * Les valeurs `false`, `null`, `undefined` ou `''` sont ignorées.
 * Volontairement sans dépendance externe tant qu'aucun besoin réel n'apparaît.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
