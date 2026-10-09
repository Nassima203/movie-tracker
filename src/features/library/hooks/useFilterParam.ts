/**
 * Hook qui stocke la valeur d'un filtre dans l'URL (paramètre de requête
 * `?name=valeur`) au lieu d'un état React local.
 */
import { useSearchParams } from 'react-router'

/**
 * L'état du filtre vit dans l'URL : on peut partager le lien, et le bouton
 * « retour » du navigateur le restaure. Renvoie `[valeur, setValeur]` comme
 * `useState`. Une valeur inconnue dans l'URL est remplacée par `fallback`.
 */
export function useFilterParam<T extends string>(name: string, allowed: readonly T[], fallback: T) {
  const [params, setParams] = useSearchParams()
  const raw = params.get(name)
  // On ne fait confiance qu'aux valeurs autorisées : l'URL peut contenir n'importe quoi.
  const value = allowed.find((option) => option === raw) ?? fallback

  function setValue(next: T) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)
        // La valeur par défaut n'est pas écrite dans l'URL, pour la garder propre.
        if (next === fallback) updated.delete(name)
        else updated.set(name, next)
        return updated
      },
      // `replace` : changer de filtre ne crée pas une nouvelle entrée d'historique.
      { replace: true },
    )
  }

  return [value, setValue] as const
}
