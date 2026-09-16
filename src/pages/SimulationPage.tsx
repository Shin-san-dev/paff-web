import { useQuery } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import { useAuthSession } from '../auth/authSession'
import { SiteHeader } from '../components/SiteHeader'
import { catalogue2026 } from '../../shared/catalogue2026'
import { cellCoordinate, isCenterBase } from '../../shared/board'
import type { SimulationReport as Report, SimulationExample as Example } from '../../shared/simulationReport'
import { meanTurns, summarizeResults } from '../features/simulation/results'
import './SimulationPage.css'

export function SimulationPage() {
  const { player } = useAuthSession()
  return <><SiteHeader /><main className="simulation-page page-shell">
    {!player?.canUseSimulations ? <><h1>Accès réservé</h1><p>Cet espace est réservé au compte Nicolas.</p></> : <SimulationReport />}
  </main></>
}
function SimulationReport() {
  const [campaign, setCampaign] = useState<'mcts' | 'reference'>('mcts')
  const report: Report | undefined = useQuery(api.simulations.getReport, { campaign })
  const [pair, setPair] = useState('all')
  const [selected, setSelected] = useState('')
  const example: Example | null | undefined = useQuery(api.simulations.getExample, selected ? { id: selected, campaign } : 'skip')
  if (!report) return <p role="status">Chargement des simulations…</p>
  const name = (id: string) => report.decks.find((d) => d.id === id)?.name ?? id
  const rows = report.runs.filter((run) => pair === 'all' || run.pair === pair)
  const draws = rows.filter((r) => r.result.kind === 'draw').length
  return <>
    <header className="simulation-heading"><p className="eyebrow">Atelier privé · Nicolas</p><h1>Équilibrage</h1>
      <p>Comparer les décisions des agents, du déploiement à la fin de partie.</p></header>
    <label className="simulation-filter">Campagne <select value={campaign} onChange={(e) => { setCampaign(e.target.value as 'mcts' | 'reference'); setPair('all'); setSelected('') }}>
      <option value="mcts">Recherche MCTS · déploiement adaptatif</option><option value="reference">Référence · robots à priorités fixes</option>
    </select></label>
    <p><a href="#simulation-replays">Revoir les {report.examples.length} parties conservées ↓</a></p>
    <div className="simulation-notice"><strong>Campagne de calibration</strong><p>Ces résultats décrivent les decks et les robots testés. Ils ne démontrent pas qu’une faction est plus forte.</p></div>
    <div className="simulation-metrics"><p><strong>{report.count}</strong> parties terminées</p><p><strong>{report.replayed}</strong> rejeux identiques</p><p><strong>{Object.keys(report.policies).length}</strong> styles de jeu</p><p><strong>{report.decks.length}</strong> decks fixes</p></div>
    <p>3 decks Gobelins × 3 decks Sephosi : chaque composition affronte les trois compositions adverses dans les mêmes conditions.</p>
    {report.comparison && <section><h2>Comparaison avec les robots précédents</h2>
      <p>{report.comparison.count} confrontations dans chaque groupe, mêmes decks, graines, camps et initiatives. Le déploiement et les décisions changent.</p>
      <div className="simulation-table simulation-table--summary"><table aria-label="Comparaison des campagnes"><thead><tr><th>Agents</th><th>Victoires Gobelins</th><th>Victoires Sephosi</th><th>Égalités</th></tr></thead><tbody>
        {([{ label: 'Référence · Contrôle', tally: report.comparison.baseline }, { label: 'MCTS', tally: report.comparison.current }]).map(({ label, tally }) => <tr key={label}><th scope="row">{label}</th><td>{tally.gobelins}</td><td>{tally.sephosi}</td><td>{tally.draws}</td></tr>)}
      </tbody></table></div>
      {report.benchmark && <p><strong>À deck identique : {report.benchmark.mcts} victoires MCTS, {report.benchmark.heuristic} victoires du robot précédent et {report.benchmark.draws} égalités</strong> sur {report.benchmark.count} duels séparés. Les agents échangent les camps et l’initiative, avec une nouvelle graine. Ce contrôle compare leur niveau de jeu, pas les factions.</p>}
      {report.benchmark && <details><summary>Comparer les pilotes pour chaque deck</summary>
        <div className="simulation-table simulation-table--summary"><table aria-label="Duels des pilotes par deck"><thead><tr><th>Deck identique</th><th>Victoires MCTS</th><th>Victoires référence</th><th>Égalités</th><th>Tours moyens</th></tr></thead><tbody>
          {report.decks.map((deck) => {
            const duels = report.benchmark!.runs.filter((r) => r.decks[0] === deck.id)
            const wins = (agent: string) => duels.filter((r) => r.result.kind === 'win' && r.policies[r.result.seat!] === agent).length
            return <tr key={deck.id}><th scope="row">{deck.name}</th><td>{wins('mcts')}</td><td>{wins('heuristic')}</td><td>{duels.filter((r) => r.result.kind === 'draw').length}</td><td>{decimal(meanTurns(duels))}</td></tr>
          })}
        </tbody></table></div>
      </details>}
    </section>}
    <section><h2>Qui gagne, et en combien de tours ?</h2>
      <label className="simulation-filter">Afficher <select value={pair} onChange={(e) => setPair(e.target.value)}><option value="all">Toutes les confrontations</option>
        {[...new Set(report.runs.map((r) => r.pair))].map((p) => <option key={p} value={p}>{p.split(' / ').map(name).join(' / ')}</option>)}</select></label>
      <p>{rows.length} parties affichées, dont {draws} égalités. Les camps et l’initiative sont inversés ; deux graines de dés sont utilisées.</p>
      <ResultSummary report={report} rows={rows} name={name} />
      <p className="simulation-muted">Les parties appariées ne sont pas indépendantes. Cet échantillon ne fournit pas encore une estimation précise de l’équilibre.</p>
      <h3>Détail des parties</h3>
      <div className="simulation-table"><table><thead><tr><th>Partie</th><th>Camp sud</th><th>Camp nord</th><th>Initiative</th><th>Résultat</th><th>Tours</th></tr></thead><tbody>
        {rows.map((r) => <tr key={r.id}><td>{r.id.replace('partie-', '')}</td><td>{name(r.decks[0])}<small>{policyName(report, r.policies[0])}</small></td><td>{name(r.decks[1])}<small>{policyName(report, r.policies[1])}</small></td><td>{r.initiative === 0 ? 'Sud' : 'Nord'}</td><td>{r.result.kind === 'draw' ? 'Égalité' : <>{name(r.decks[r.result.seat!])}<small>{r.result.seat === 0 ? 'Sud' : 'Nord'} · {reasonName(r.result.reason)}</small></>}</td><td>{r.turns}</td></tr>)}
      </tbody></table></div>
    </section>
    <section><h2>Comment jouent les robots ?</h2>{campaign === 'mcts' ? <div className="simulation-policies">
      <article><h3>Déploiement alterné</h3><p>Le joueur avec l’initiative commence. Chaque pose tient compte des unités adverses déjà révélées ; les réserves restent cachées.</p></article>
      <article><h3>Recherche MCTS</h3><p>Les agents explorent plusieurs décisions, réponses adverses et jets possibles jusqu’au contrôle de fin de tour. Ils peuvent déplacer une partie d’une zone et conserver des défenseurs.</p></article>
      <article><h3>Limites de l’essai</h3><p>Le temps de recherche est limité. Les charges et leurs cibles utilisent encore le pilote commun. Les erreurs stratégiques restent possibles : les relectures servent à les repérer.</p></article>
    </div> : <div className="simulation-policies">
      <article><h3>Contrôle</h3><p>Occuper les zones stratégiques, protéger sa base et préparer les tours suivants.</p></article>
      <article><h3>Agression</h3><p>Privilégier les tirs et les charges qui peuvent retirer des unités adverses.</p></article>
      <article><h3>Préservation</h3><p>Limiter les pertes, utiliser le repli et faire entrer les réserves.</p></article>
    </div>}</section>
    <section id="simulation-replays"><h2>Revoir une partie</h2><p>{report.examples.length} exemples conservés{campaign === 'mcts' ? ', choisis avant les résultats : deux par confrontation entre factions et deux miroirs. Chaque pose et chaque ordre sont consultables.' : ', avec positions après chaque combat et journal des actions.'}</p>
      <label className="simulation-filter">Exemple <select value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Choisir une partie</option>{report.examples.map((id) => <option key={id} value={id}>{id} · {report.runs.find((r) => r.id === id)?.decks.map(name).join(' / ')}</option>)}</select></label>
      {selected && (example === undefined ? <p role="status">Chargement de la partie…</p> : example === null ? <p>Exemple indisponible.</p> : <Replay key={`${campaign}:${selected}`} example={example} />)}
    </section>
    <details><summary>Decks utilisés et limites de cette campagne</summary>
      <ul>{report.limitations.map((text) => <li key={text}>{text}</li>)}</ul>
      <div className="simulation-policies">{report.decks.map((deck) => <article key={deck.id}><h3>{deck.name}</h3><ul>{deck.entries.map((e) => <li key={e.card}>{e.quantity} × {catalogue2026.find((c) => c.stableId === e.card)?.name ?? e.card}<small>{e.deployed} au déploiement</small></li>)}</ul></article>)}</div>
      <p className="simulation-muted">Référence : {report.rulesVersion}. Moteur : {report.engineVersion}. Robots : {report.botVersion}. Campagne : {report.version}.</p>
    </details>
  </>
}
const reasonName = (reason?: string) => ({ elimination: 'élimination', base: 'Base Centre', control: 'contrôle des zones' })[reason ?? ''] ?? reason
const policyName = (report: Report, id: string) => report.policies[id]?.name ?? id
const decimal = (value: number | null) => value === null ? '—' : value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const percent = (value: number | null) => value === null ? '—' : value.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 1 })
type Runs = Report['runs']
function ResultSummary({ report, rows, name }: { report: Report; rows: Runs; name: (id: string) => string }) {
  const cross = rows.filter((r) => !r.mirror), mirrors = rows.filter((r) => r.mirror)
  const goblins = new Set(report.decks.filter((d) => catalogue2026.find((c) => c.stableId === d.entries[0].card)?.faction === 'gobelins').map((d) => d.id))
  const factionSide = (id: string) => goblins.has(id)
  const comparisons = [...new Set(cross.map((r) => r.pair))].map((pair) => ({ pair, summary: summarizeResults(cross.filter((r) => r.pair === pair), factionSide) }))
  return <div className="simulation-results">
    <p className="simulation-duration"><strong>{decimal(meanTurns(rows))} tours</strong> en moyenne sur les {rows.length} parties sélectionnées.</p>
    {cross.length > 0 && <>
      <OutcomeTable title="Gobelins contre Sephosi" labels={['Gobelins', 'Sephosi']} summary={summarizeResults(cross, factionSide)} />
      <details><summary>Résultats par confrontation de decks</summary>
        <div className="simulation-table simulation-table--summary"><table aria-label="Résultats par confrontation"><thead><tr><th>Decks</th><th>Parties</th><th>Victoires Gobelins</th><th>Victoires Sephosi</th><th>Égalités</th><th>Tours moyens</th></tr></thead><tbody>
          {comparisons.map(({ pair, summary }) => <tr key={pair}><th scope="row">{pair.split(' / ').map(name).join(' / ')}</th><td>{summary.count}</td>{summary.sides.map((side, i) => <td key={i}>{side.wins}<small>{decimal(side.winTurns)} tours par victoire</small></td>)}<td>{summary.draws}</td><td>{decimal(summary.meanTurns)}</td></tr>)}
        </tbody></table></div>
      </details>
    </>}
    {mirrors.length > 0 && <details><summary>Parties miroir · {mirrors.length} parties entre decks identiques</summary>
      <p>Les deux camps utilisent le même deck. Leurs victoires comparent les camps sud et nord ; elles sont exclues du bilan Gobelins contre Sephosi.</p>
      <OutcomeTable title="Contrôles miroir" labels={['Camp sud', 'Camp nord']} summary={summarizeResults(mirrors, (_, seat) => seat === 0)} />
    </details>}
  </div>
}
function OutcomeTable({ title, labels, summary }: { title: string; labels: [string, string]; summary: ReturnType<typeof summarizeResults> }) {
  return <div className="simulation-outcome"><h3>{title}</h3>
    <p>{summary.count} parties · {decimal(summary.meanTurns)} tours en moyenne.</p>
    <div className="simulation-table simulation-table--summary"><table aria-label={title}><thead><tr><th>Camp</th><th>Victoires</th><th>Défaites</th><th>Égalités</th><th>Tours moyens pour gagner</th></tr></thead><tbody>
      {summary.sides.map((side, i) => <tr key={labels[i]}><th scope="row">{labels[i]}</th><td><strong>{side.wins}</strong> <span className="simulation-muted">({percent(side.winShare)})</span></td><td>{side.losses}</td><td>{side.draws}</td><td>{decimal(side.winTurns)}</td></tr>)}
    </tbody></table></div>
    <p className="simulation-muted">{summary.draws} égalités communes aux deux camps{summary.draws > 0 ? `, en ${decimal(summary.drawTurns)} tours en moyenne` : ''}. Les pourcentages incluent les égalités ; « — » signifie aucune victoire.</p>
  </div>
}
function Replay({ example }: { example: Example }) {
  const [index, setIndex] = useState(0), frame = example.frames[index]
  const [selectedCell, setSelectedCell] = useState<number | null>(null)
  const positions = new Map(frame.state.units.filter((u) => u.cell !== null && u.r > 0).map((u) => [u.cell, u]))
  const inspected = selectedCell === null ? undefined : positions.get(selectedCell)
  const end = example.frames[example.frames.length - 1].state
  const factionName = (seat: number) => frame.state.players[seat].faction === 'gobelins' ? 'Gobelins' : 'Sephosi'
  const linked = (id: string) => frame.state.engagements.flatMap((e) => e.a === id ? [e.b] : e.b === id ? [e.a] : [])
  return <div className="simulation-replay">
    <p className="simulation-replay__result"><strong>{end.result?.kind === 'win' ? `Victoire ${factionName(end.result.seat!)} · camp ${end.result.seat === 0 ? 'sud' : 'nord'}` : 'Égalité'} au tour {end.turn}</strong>{end.result?.reason && ` · ${reasonName(end.result.reason)}`}</p>
    <div className="simulation-replay__controls"><button className="ui-button ui-button--quiet" disabled={index === 0} onClick={() => setIndex(index - 1)}>Précédent</button><strong aria-live="polite">{frame.label}</strong><button className="ui-button ui-button--quiet" disabled={index === example.frames.length - 1} onClick={() => setIndex(index + 1)}>Suivant</button></div>
    <label className="simulation-filter">Étape <select value={index} onChange={(e) => setIndex(Number(e.target.value))}>{example.frames.map((f, i) => <option key={i} value={i}>{i + 1}. {f.label}</option>)}</select></label>
    <p>{frame.detail ?? 'Survoler ou sélectionner une unité pour lire son nom et ses R.'}</p>
    <div className="simulation-camps">{[1, 0].map((seat) => <p key={seat}><strong>{seat === 1 ? 'Nord ↑' : 'Sud ↓'} · {factionName(seat)}</strong><small>{frame.state.players[seat].ps} PS · {frame.state.players[seat].orders} ordres · {frame.state.players[seat].recruitment} points de recrutement</small></p>)}</div>
    <div className="simulation-board" aria-label={`Plateau : ${frame.label}`}>
      <svg className="simulation-engagements" viewBox="0 0 9 6" preserveAspectRatio="none" aria-hidden="true">{frame.state.engagements.map((e) => {
        const a = frame.state.units.find((u) => u.id === e.a), b = frame.state.units.find((u) => u.id === e.b)
        return a?.cell != null && b?.cell != null ? <line key={`${e.a}-${e.b}`} x1={a.cell % 9 + .5} y1={Math.floor(a.cell / 9) + .5} x2={b.cell % 9 + .5} y2={Math.floor(b.cell / 9) + .5} /> : null
      })}</svg>
      {Array.from({ length: 54 }, (_, cell) => {
        const u = positions.get(cell), card = u && catalogue2026.find((c) => c.stableId === u.card)
        const base = isCenterBase(cell, 0) || isCenterBase(cell, 1)
        return <div key={cell} title={base ? `Base Centre ${cell < 27 ? 'nord' : 'sud'} · ${cellCoordinate(cell)}` : cellCoordinate(cell)} className={`simulation-cell${base ? ' simulation-cell--base' : ''}${cell % 9 === 1 || cell % 9 === 6 ? ' simulation-cell--flank' : ''}${u ? ` simulation-cell--seat-${u.seat}` : ''}`}>
          {u && card ? <button onClick={() => setSelectedCell(cell)} title={`${card.name} · ${u.r} R · ${u.seat === 0 ? 'Sud' : 'Nord'} · ${cellCoordinate(cell)}${linked(u.id).length ? ' · Engagée' : ''}`} aria-label={`${card.name} · ${u.r} R · case ${cellCoordinate(cell)}`}><img src={card.imagePath} alt="" /><span>{u.r} R{linked(u.id).length ? ' · ⚔' : ''}</span></button> : <span className="simulation-cell__empty">{cellCoordinate(cell)}{base ? ' · Base' : ''}</span>}
        </div>
      })}
    </div>
    {inspected && <p role="status">{catalogue2026.find((c) => c.stableId === inspected.card)?.name} · {inspected.r} R · camp {inspected.seat === 0 ? 'sud' : 'nord'} · {cellCoordinate(inspected.cell!)}{linked(inspected.id).length ? ` · Engagée avec ${linked(inspected.id).map((id) => catalogue2026.find((c) => c.stableId === frame.state.units.find((u) => u.id === id)?.card)?.name).join(', ')}` : ' · Libre'}</p>}
    {frame.state.result?.kind === 'win' && frame.state.result.reason === 'base' && <p>La Base Centre {frame.state.result.seat === 0 ? 'nord' : 'sud'} est contrôlée par {factionName(frame.state.result.seat!)} : au moins une unité libre de ce camp et aucune unité ennemie libre dans cette zone. Les autres zones de base et l’Arrière ne contestent pas ce contrôle.</p>}
    <details><summary>Journal des actions et des dés</summary><ol className="simulation-log">{example.log.map((e, i) => <li key={i}><strong>Tour {e.turn}{e.seat !== null ? ` · ${e.seat === 0 ? 'Sud' : 'Nord'}` : ''}</strong> — {e.reason}{e.dice.length > 0 && <small>Dés : {e.dice.join(', ')}</small>}</li>)}</ol></details>
  </div>
}
