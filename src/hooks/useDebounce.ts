/**
 * Hook React de « temporisation » (debounce) : utile par exemple pour ne lancer
 * une recherche que lorsque l'utilisateur a fini de taper.
 */
import { useEffect, useState } from 'react'

/**
 * Renvoie `value` une fois qu'elle a cessé de changer pendant `delayMs` millisecondes.
 * Chaque changement relance le minuteur ; le minuteur est annulé au démontage,
 * donc aucune mise à jour d'état ne peut survenir après la disparition du composant.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value)
    }, delayMs)

    // Nettoyage : appelé avant le prochain effet (nouvelle valeur) ou au démontage.
    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])

  return debounced
}
