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
        className="absolute inset-0 scale-105 bg-cover bg-center opacity-60 blur-[2px] dark:opacity-70"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}
      />
      <div className="absolute inset-0" style={{ background: 'var(--uw-backdrop-overlay)' }} />
      <div className="absolute inset-0" style={{ background: 'var(--uw-backdrop-glow)' }} />
    </div>
  )
}
