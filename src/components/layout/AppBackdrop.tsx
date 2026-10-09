/**
 * Fixed cinematic background. Drop a photo at public/images/home-cinema.webp to
 * enable it. The same photo is used in both themes; only the overlay changes
 * (dark veil at night, light veil by day) to keep text readable. Without the
 * file only the gradients are shown.
 */
const BACKGROUND_IMAGE = `${import.meta.env.BASE_URL}images/home-cinema.webp`

export function AppBackdrop() {
  return (
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
