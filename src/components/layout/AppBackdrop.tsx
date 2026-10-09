/**
 * Arrière-plan « cinéma » fixe de toute l'application. Déposez une photo dans
 * public/images/home-cinema.webp pour l'activer. La même photo sert aux deux
 * thèmes ; seul le voile change (voile sombre la nuit, voile clair le jour)
 * pour garder le texte lisible. Sans le fichier, seuls les dégradés s'affichent.
 */
// `BASE_URL` (fourni par Vite) permet de fonctionner même si l'app n'est pas servie à la racine.
const BACKGROUND_IMAGE = `${import.meta.env.BASE_URL}images/home-cinema.webp`

/** Calques de fond (photo, voile, halo) placés derrière tout le contenu. */
export function AppBackdrop() {
  return (
    // Purement décoratif : masqué aux lecteurs d'écran et ne capte aucun clic.
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-[center_65%]"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}
      />
      <div className="absolute inset-0" style={{ background: 'var(--uw-backdrop-overlay)' }} />
      <div className="absolute inset-0" style={{ background: 'var(--uw-backdrop-glow)' }} />
    </div>
  )
}
