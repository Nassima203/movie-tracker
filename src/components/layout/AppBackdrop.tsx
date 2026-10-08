/**
 * Fixed cinematic background. Drop a photo at public/images/home-cinema.webp to
 * enable it: the overlay keeps text readable in both themes, and without the
 * file only the gradients are shown.
 */
const BACKGROUND_IMAGE = '/images/home-cinema.webp'

export function AppBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-[center_65%] opacity-20 grayscale dark:opacity-100 dark:grayscale-0"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}
      />
      <div className="absolute inset-0" style={{ background: 'var(--uw-backdrop-overlay)' }} />
      <div className="absolute inset-0" style={{ background: 'var(--uw-backdrop-glow)' }} />
    </div>
  )
}
