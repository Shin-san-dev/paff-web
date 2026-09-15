import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { UnitCard } from './UnitCard'
import type { PublicCard } from './types'
import './CardPreview.css'

export function CardPreview({ card, x, y, id, interactive = false, onEnter, onLeave }: { card: PublicCard; x: number; y: number; id: string; interactive?: boolean; onEnter?: () => void; onLeave?: () => void }) {
  const preview = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = preview.current!
    const { width, height } = element.getBoundingClientRect()
    const left = x + 20 + width > window.innerWidth - 12 ? x - width - 20 : x + 20
    element.style.left = `${Math.max(12, Math.min(left, window.innerWidth - width - 12))}px`
    element.style.top = `${Math.max(12, Math.min(y - 28, window.innerHeight - height - 12))}px`
  }, [x, y, card])
  return createPortal(<div ref={preview} id={id} role={interactive ? 'dialog' : 'tooltip'} className={`card-preview${interactive ? ' card-preview--interactive' : ''}`} aria-label={`Détails de ${card.name}`}
    onMouseEnter={onEnter} onMouseLeave={onLeave} onFocus={onEnter} onBlur={onLeave}>
    <UnitCard card={card} costPlacement="hidden" interactiveAbilities={interactive} />
  </div>, document.body)
}
