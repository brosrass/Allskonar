import { type Card, combinations } from '../../engine/cards';

export const pipValue = (c: Card) => Math.min(c.rank, 10);

export type ScoreKind = 'fifteen' | 'pair' | 'run' | 'flush' | 'nobs' | 'heels' | 'thirty-one' | 'go';

export interface ScoreItem {
  kind: ScoreKind;
  points: number;
  cards: Card[];
  label: string;
}

const sum = (items: ScoreItem[]) => items.reduce((n, i) => n + i.points, 0);

// --- The show -------------------------------------------------------------

function fifteens(all: Card[]): ScoreItem[] {
  const out: ScoreItem[] = [];
  for (let k = 2; k <= all.length; k++) {
    for (const combo of combinations(all, k)) {
      if (combo.reduce((n, c) => n + pipValue(c), 0) === 15) {
        out.push({ kind: 'fifteen', points: 2, cards: combo, label: 'Fifteen' });
      }
    }
  }
  return out;
}

function pairs(all: Card[]): ScoreItem[] {
  return combinations(all, 2)
    .filter(([a, b]) => a.rank === b.rank)
    .map((cs) => ({ kind: 'pair' as const, points: 2, cards: cs, label: 'Pair' }));
}

// Every maximal run of 3+ distinct ranks, multiplied out over duplicate ranks
// (a "double run" is two separate runs, each listed).
function runs(all: Card[]): ScoreItem[] {
  const byRank = new Map<number, Card[]>();
  for (const c of all) byRank.set(c.rank, [...(byRank.get(c.rank) ?? []), c]);
  const ranks = [...byRank.keys()].sort((a, b) => a - b);
  const out: ScoreItem[] = [];
  let i = 0;
  while (i < ranks.length) {
    let j = i;
    while (j + 1 < ranks.length && ranks[j + 1] === ranks[j] + 1) j++;
    const len = j - i + 1;
    if (len >= 3) {
      let seqs: Card[][] = [[]];
      for (let r = i; r <= j; r++) {
        seqs = seqs.flatMap((s) => byRank.get(ranks[r])!.map((c) => [...s, c]));
      }
      for (const s of seqs) out.push({ kind: 'run', points: len, cards: s, label: `Run of ${len}` });
    }
    i = j + 1;
  }
  return out;
}

export function scoreShow(hand: Card[], starter: Card, isCrib: boolean): ScoreItem[] {
  const all = [...hand, starter];
  const items = [...fifteens(all), ...pairs(all), ...runs(all)];

  const suit = hand[0]?.suit;
  if (hand.length === 4 && hand.every((c) => c.suit === suit)) {
    if (starter.suit === suit) items.push({ kind: 'flush', points: 5, cards: all, label: 'Flush of 5' });
    else if (!isCrib) items.push({ kind: 'flush', points: 4, cards: hand, label: 'Flush of 4' });
  }

  const nob = hand.find((c) => c.rank === 11 && c.suit === starter.suit);
  if (nob) items.push({ kind: 'nobs', points: 1, cards: [nob], label: 'His nobs' });
  return items;
}

export const showTotal = (hand: Card[], starter: Card, isCrib: boolean) => sum(scoreShow(hand, starter, isCrib));

// --- The play (pegging) ---------------------------------------------------

/** Points for the card just added to `seq` (the cards played since the last reset). */
export function scorePegging(seq: Card[]): ScoreItem[] {
  const out: ScoreItem[] = [];
  const count = seq.reduce((n, c) => n + pipValue(c), 0);
  const last = seq[seq.length - 1];
  if (count === 15) out.push({ kind: 'fifteen', points: 2, cards: [last], label: 'Fifteen' });
  if (count === 31) out.push({ kind: 'thirty-one', points: 2, cards: [last], label: 'Thirty-one' });

  let same = 1;
  while (same < seq.length && seq[seq.length - 1 - same].rank === last.rank) same++;
  if (same >= 2) {
    const pts = { 2: 2, 3: 6, 4: 12 }[same]!;
    const label = { 2: 'Pair', 3: 'Pair royal', 4: 'Double pair royal' }[same]!;
    out.push({ kind: 'pair', points: pts, cards: seq.slice(-same), label });
  }

  for (let len = seq.length; len >= 3; len--) {
    const tail = seq.slice(-len).map((c) => c.rank);
    const distinct = new Set(tail).size === len;
    if (distinct && Math.max(...tail) - Math.min(...tail) === len - 1) {
      out.push({ kind: 'run', points: len, cards: seq.slice(-len), label: `Run of ${len}` });
      break;
    }
  }
  return out;
}

export const total = sum;
