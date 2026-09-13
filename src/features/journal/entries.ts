export type JournalEntry = {
  id: string
  date: string
  title: string
  description: string
}

export const journalEntries: readonly JournalEntry[] = [
  {
    id: 'premiere-version-jouable',
    date: '2026-09-11',
    title: 'Première version jouable',
    description: 'Les premières cartes prennent vie autour de la table. PAFF fait ses premiers pas avec une version jouable et deux factions disponibles : Gobelins et Céphozie. L’aventure entre amis commence !',
  },
]

export function newestEntriesFirst(entries: readonly JournalEntry[]) {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date))
}

export function formatJournalDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}
