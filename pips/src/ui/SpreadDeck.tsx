import type { Card } from '../engine/cards';
import { PlayingCard } from './PlayingCard';

// A face-down deck fanned out so the player can pick a spot: drawing for the
// deal, or cutting for the starter. Cards in `faceUp` show their face lifted.
export function SpreadDeck({ count, onPick, isPickable, faceUp = {}, label }: {
  count: number;
  onPick?: (index: number) => void;
  isPickable?: (index: number) => boolean;
  faceUp?: Record<number, Card>;
  label: string;
}) {
  return (
    <div className="spread" role="group" aria-label={label} style={{ ['--n' as string]: count }}>
      {Array.from({ length: count }, (_, i) => {
        const up = faceUp[i];
        const pickable = !!onPick && !up && (isPickable?.(i) ?? true);
        return (
          <button key={i} type="button" className={`spread-slot${up ? ' up' : ''}`} disabled={!pickable}
            onClick={pickable ? () => onPick!(i) : undefined} aria-label={up ? undefined : `Card ${i + 1} of ${count}`} tabIndex={pickable ? 0 : -1}>
            {up ? <PlayingCard card={up} /> : <PlayingCard faceDown />}
          </button>
        );
      })}
    </div>
  );
}
