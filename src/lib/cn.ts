/** Joins truthy class names. Kept dependency-free until a real need arises. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
