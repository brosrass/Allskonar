import { type Card, SUIT_SYMBOL, cardName, isRed, rankLabel } from '../engine/cards';

// Pip positions (x%, y%) inside the pip box; y > 50 is drawn upside down.
const PIPS: Record<number, [number, number][]> = {
  2: [[50, 0], [50, 100]],
  3: [[50, 0], [50, 50], [50, 100]],
  4: [[25, 0], [75, 0], [25, 100], [75, 100]],
  5: [[25, 0], [75, 0], [50, 50], [25, 100], [75, 100]],
  6: [[25, 0], [75, 0], [25, 50], [75, 50], [25, 100], [75, 100]],
  7: [[25, 0], [75, 0], [50, 25], [25, 50], [75, 50], [25, 100], [75, 100]],
  8: [[25, 0], [75, 0], [50, 25], [25, 50], [75, 50], [50, 75], [25, 100], [75, 100]],
  9: [[25, 0], [75, 0], [25, 33], [75, 33], [50, 50], [25, 67], [75, 67], [25, 100], [75, 100]],
  10: [[25, 0], [75, 0], [50, 17], [25, 33], [75, 33], [25, 67], [75, 67], [50, 83], [25, 100], [75, 100]],
};

interface Props {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  disabled?: boolean;
  highlight?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PlayingCard({ card, faceDown, selected, disabled, highlight, onClick, className = '' }: Props) {
  const classes = ['pcard', className, faceDown || !card ? 'back' : '', card && isRed(card) ? 'red' : '', card ? `s-${card.suit}` : '',
    selected ? 'selected' : '', disabled ? 'disabled' : '', highlight ? 'hl' : '', onClick ? 'clickable' : ''].filter(Boolean).join(' ');

  if (faceDown || !card) return <div className={classes} aria-label="face-down card" />;

  const sym = SUIT_SYMBOL[card.suit];
  const r = rankLabel(card.rank);
  const idx = <><b>{r}</b><i>{sym}</i></>;
  let middle;
  if (card.rank === 1) middle = <span className="ace">{sym}</span>;
  else if (card.rank > 10) middle = <span className="court"><b>{r}</b><i>{sym}</i></span>;
  else middle = (
    <span className="pips">
      {PIPS[card.rank].map(([x, y], i) => (
        <span key={i} className={y > 50 ? 'pip dn' : 'pip'} style={{ left: `${x}%`, top: `${y}%` }}>{sym}</span>
      ))}
    </span>
  );

  const body = (
    <>
      <span className="idx tl">{idx}</span>
      {middle}
      <span className="idx br">{idx}</span>
      <span className="mini" aria-hidden="true">{sym}</span>
    </>
  );

  return onClick ? (
    <button type="button" className={classes} onClick={onClick} disabled={disabled} aria-pressed={selected} aria-label={cardName(card)}>
      {body}
    </button>
  ) : (
    <div className={classes} aria-label={cardName(card)}>{body}</div>
  );
}
