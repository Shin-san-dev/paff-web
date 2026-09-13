import { SiteHeader } from '../components/SiteHeader'
import { formatJournalDate, journalEntries, newestEntriesFirst } from '../features/journal/entries'
import './CommunityPages.css'

export function JournalPage() {
  return <>
    <SiteHeader />
    <main className="community-page page-shell">
      <header className="community-heading">
        <p className="eyebrow">Notre carnet de bord</p>
        <h1>Le Journal de PAFF</h1>
        <p>Les petits et grands moments d’un jeu qui grandit entre amis.</p>
      </header>
      <ol className="journal-entries" aria-label="Les moments de PAFF">
        {newestEntriesFirst(journalEntries).map((entry) => <li key={entry.id}>
          <article className="journal-entry" aria-labelledby={entry.id}>
            <time dateTime={entry.date}>{formatJournalDate(entry.date)}</time>
            <div className="journal-entry__body">
              <span className="journal-entry__mark" aria-hidden="true">✦</span>
              <h2 id={entry.id}>{entry.title}</h2>
              <p>{entry.description}</p>
            </div>
          </article>
        </li>)}
      </ol>
    </main>
  </>
}
