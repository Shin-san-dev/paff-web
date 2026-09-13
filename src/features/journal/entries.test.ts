import { describe, expect, it } from 'vitest'
import { formatJournalDate, journalEntries, newestEntriesFirst } from './entries'

describe('journal chronology', () => {
  it('orders added entries newest first without modifying their source', () => {
    const entries = [journalEntries[0], { ...journalEntries[0], id: 'later', date: '2026-10-01' }, { ...journalEntries[0], id: 'earlier', date: '2026-09-01' }]
    expect(newestEntriesFirst(entries).map((entry) => entry.id)).toEqual(['later', 'premiere-version-jouable', 'earlier'])
    expect(entries[0].id).toBe('premiere-version-jouable')
    expect(formatJournalDate('2026-09-11')).toBe('11 septembre 2026')
  })
})
