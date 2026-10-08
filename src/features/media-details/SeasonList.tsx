import { Check } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Spinner } from '@/components/ui/Spinner'
import { useSetSeasonsWatched } from '@/features/library/hooks/useLibraryActions'
import { airedRegularSeasons, computeSeriesProgress } from '@/features/library/progress'
import { cn } from '@/lib/cn'
import { formatYear, pluralize } from '@/lib/format'
import type { LibraryItem, SeasonSummary, SeriesDetails } from '@/types/media'

interface SeasonListProps {
  series: SeriesDetails
  item: LibraryItem | null
}

export function SeasonList({ series, item }: SeasonListProps) {
  const setSeasons = useSetSeasonsWatched()
  const aired = airedRegularSeasons(series.seasons)
  const airedNumbers = new Set(aired.map((season) => season.seasonNumber))
  const watched = new Set(item?.watchedSeasons ?? [])
  const progress = computeSeriesProgress({
    watchedSeasons: item?.watchedSeasons ?? [],
    seasonCount: aired.length,
  })
  const allWatched = aired.length > 0 && aired.every((season) => watched.has(season.seasonNumber))

  // Regular seasons first, specials (season 0) last: they don't count in the progress.
  const ordered = [
    ...series.seasons.filter((season) => season.seasonNumber > 0),
    ...series.seasons.filter((season) => season.seasonNumber === 0),
  ]

  function toggle(seasonNumbers: number[], nextWatched: boolean) {
    setSeasons.mutate({ series, seasonNumbers, watched: nextWatched, current: item })
  }

  if (ordered.length === 0) {
    return <p className="text-sm text-fg-muted">Aucune information de saison disponible.</p>
  }

  return (
    <section aria-labelledby="seasons-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-48 flex-1 flex-col gap-2">
          <h2 id="seasons-title" className="text-lg font-semibold tracking-tight">
            Saisons
          </h2>
          {aired.length > 0 && (
            <div className="flex max-w-sm items-center gap-3">
              <ProgressBar
                value={progress.watched}
                max={aired.length}
                label={`Progression de ${series.title}`}
              />
              <span className="shrink-0 text-sm text-fg-muted">
                {progress.watched}/{aired.length}
              </span>
            </div>
          )}
        </div>
        {aired.length > 0 && (
          <button
            type="button"
            disabled={setSeasons.isPending}
            onClick={() => {
              toggle(
                aired.map((season) => season.seasonNumber),
                !allWatched,
              )
            }}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-fg/10 px-4 text-sm font-medium ring-1 ring-border transition hover:bg-fg/15 disabled:opacity-60"
          >
            {setSeasons.isPending && <Spinner className="size-4" />}
            {allWatched ? 'Tout marquer non vu' : 'Tout marquer vu'}
          </button>
        )}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((season) => (
          <SeasonRow
            key={season.seasonNumber}
            season={season}
            isAired={airedNumbers.has(season.seasonNumber) || season.seasonNumber === 0}
            isWatched={watched.has(season.seasonNumber)}
            disabled={setSeasons.isPending}
            onToggle={(next) => {
              toggle([season.seasonNumber], next)
            }}
          />
        ))}
      </ul>
    </section>
  )
}

interface SeasonRowProps {
  season: SeasonSummary
  isAired: boolean
  isWatched: boolean
  disabled: boolean
  onToggle: (watched: boolean) => void
}

function SeasonRow({ season, isAired, isWatched, disabled, onToggle }: SeasonRowProps) {
  const year = formatYear(season.airDate)
  const details = [
    season.episodeCount ? pluralize(season.episodeCount, 'épisode', 'épisodes') : null,
    isAired ? year : 'À venir',
    season.seasonNumber === 0 ? 'Hors progression' : null,
  ].filter(Boolean)

  return (
    <li>
      <label
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition',
          isWatched
            ? 'border-accent/40 bg-accent/10'
            : 'border-border bg-surface-overlay backdrop-blur-md hover:border-fg/20',
          (!isAired || disabled) && 'cursor-not-allowed opacity-60',
        )}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          checked={isWatched}
          disabled={!isAired || disabled}
          onChange={(event) => {
            onToggle(event.target.checked)
          }}
        />
        <span
          aria-hidden="true"
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md ring-1 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
            isWatched ? 'bg-accent text-accent-fg ring-accent' : 'ring-fg/30',
          )}
        >
          {isWatched && <Check className="size-4" strokeWidth={3} />}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{season.name}</span>
          <span className="text-xs text-fg-muted">{details.join(' · ')}</span>
        </span>
      </label>
    </li>
  )
}
