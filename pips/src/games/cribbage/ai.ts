// Siggi, the computer opponent. Plays only from what a human at the table could
// see: own hand, the starter, the cards played so far. Never peeks.
import { type Card, combinations, standardDeck } from '../../engine/cards';
import { nextRandom } from '../../engine/rng';
import { type Action, type CribbageState, MIN_CUT, type Seat, legalPlays, other } from './game';
import { pipValue, scorePegging, showTotal, total } from './score';

// Rough value of two cards in a crib before seeing the other two discards.
function cribGuess(discards: Card[], starter: Card): number {
  let pts = threeCardPoints([...discards, starter]);
  for (const c of discards) if (c.rank === 5) pts += 1;
  if (discards[0].rank === discards[1].rank) pts += 0.5;
  if (Math.abs(discards[0].rank - discards[1].rank) === 1) pts += 0.5;
  return pts;
}

// Fifteens and pairs among a few cards (runs/flush need more cards to matter much).
function threeCardPoints(cs: Card[]): number {
  let pts = 0;
  for (let k = 2; k <= cs.length; k++)
    for (const combo of combinations(cs, k)) if (combo.reduce((n, c) => n + pipValue(c), 0) === 15) pts += 2;
  for (const [a, b] of combinations(cs, 2)) if (a.rank === b.rank) pts += 2;
  return pts;
}

export function chooseDiscard(hand: Card[], isDealer: boolean): Card[] {
  const unseen = standardDeck().filter((d) => !hand.some((h) => h.id === d.id));
  let best: { discard: Card[]; ev: number } | null = null;
  for (const discard of combinations(hand, 2)) {
    const keep = hand.filter((c) => !discard.includes(c));
    let ev = 0;
    for (const starter of unseen) {
      const crib = cribGuess(discard, starter);
      ev += showTotal(keep, starter, false) + (isDealer ? crib : -crib);
    }
    ev /= unseen.length;
    if (!best || ev > best.ev) best = { discard, ev };
  }
  return best!.discard;
}

export function choosePlay(s: CribbageState, seat: Seat): Card {
  const options = legalPlays(s, seat);
  const hand = s.hands[seat];
  let best: { c: Card; v: number } | null = null;
  for (const c of options) {
    const seq = [...s.peg.seq, c];
    const count = s.peg.count + pipValue(c);
    let v = total(scorePegging(seq)) * 10;
    // Leaving 5 or 21 lets a ten-card make 15 / 31.
    if (count === 5 || count === 21) v -= 6;
    // Leading: a card under 5 can't be answered with fifteen.
    if (s.peg.seq.length === 0) v += c.rank < 5 ? 3 : c.rank === 5 ? -5 : 0;
    // Holding another card of this rank: if they pair us we can answer with a pair royal.
    if (s.peg.seq.length && s.peg.seq[s.peg.seq.length - 1].rank !== c.rank && hand.some((h) => h !== c && h.rank === c.rank)) v += 1;
    // Count 22–30 with low cards left keeps us playing after a go.
    if (count > 21 && count < 31) v += 1;
    // Otherwise prefer shedding high cards; keep low ones for the end.
    v += pipValue(c) * 0.1;
    if (!best || v > best.v) best = { c, v };
  }
  return best!.c;
}

/** The action seat `seat` should take now, or null if it isn't that seat's move. */
export function aiAction(s: CribbageState, seat: Seat): Action | null {
  if (s.phase === 'draw' && s.draw.picks[seat] === null) {
    // A "random" spot in the spread, derived from state so replays match.
    const n = s.deck.length;
    let at = Math.floor(nextRandom((s.rng ^ (seat + 1) * 0x9e3779b9) >>> 0)[0] * n);
    while (s.draw.used.includes(at) || s.draw.picks.includes(at)) at = (at + 1) % n;
    return { type: 'draw', seat, at };
  }
  if (s.phase === 'cut' && other(s.dealer) === seat) {
    const span = s.deck.length - 2 * MIN_CUT;
    return { type: 'cut', seat, at: MIN_CUT + Math.floor(nextRandom(s.rng ^ 0x5bd1e995)[0] * (span + 1)) };
  }
  if (s.phase === 'discard' && s.kept[seat].length === 0) {
    return { type: 'discard', seat, cards: chooseDiscard(s.hands[seat], s.dealer === seat).map((c) => c.id) };
  }
  if (s.phase === 'pegging' && s.peg.toPlay === seat) {
    return { type: 'play', seat, card: choosePlay(s, seat).id };
  }
  return null;
}
