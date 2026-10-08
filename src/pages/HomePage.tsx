export function HomePage() {
  return (
    <section aria-labelledby="home-title" className="flex flex-col gap-2">
      <h1 id="home-title" className="text-2xl font-semibold">
        Accueil
      </h1>
      <p className="text-fg-muted">Votre bibliothèque apparaîtra ici.</p>
    </section>
  )
}
