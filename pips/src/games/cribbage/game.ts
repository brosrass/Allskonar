// Two-player Cribbage to 121 as a pure state machine: apply(state, action) → state.
// No randomness outside the seeded RNG, no timers, no DOM — the UI and the AI
// both drive it through actions, and tests can play thousands of games headless.
import { type Card, cardName, rankName, standardDeck, sortCards } from '../../engine/cards';
import { shuffle } from '../../engine/rng';
import { type ScoreItem, pipValue, scorePegging, scoreShow, total } from './score';

export type Seat = 0 | 1; // 0 = you, 1 = computer
export const other = (s: Seat): Seat => (s === 0 ? 1 : 0);
export const WIN = 121;

export type Phase = 'draw' | 'discard' | 'cut' | 'pegging' | 'show' | 'deal-over' | 'game-over';

/** Cards on each side of a cut must be at least this many. */
export const MIN_CUT = 4;

export interface LogEntry { seat: Seat | null; text: string; points?: number }

export interface ShowStep { seat: Seat; what: 'hand' | 'crib'; cards: Card[]; items: ScoreItem[] }

export interface CribbageState {
  seed: number;
  rng: number;
  deal: number; // 1-based deal number
  phase: Phase;
  dealer: Seat;
  cutForDeal: [Card, Card] | null; // only on the first deal
  draw: { picks: [number | null, number | null]; used: number[] }; // spread-deck indexes picked for the deal
  scores: [number, number];
  backPegs: [number, number]; // previous score, for the two-peg board
  hands: [Card[], Card[]]; // cards still held
  kept: [Card[], Card[]]; // the four kept cards, for the show
  crib: Card[];
  deck: Card[];
  starter: Card | null;
  peg: {
    toPlay: Seat;
    count: number;
    seq: Card[]; // since last reset
    pile: { seat: Seat; card: Card }[]; // everything played this deal
    lastPlayer: Seat | null;
    saidGo: [boolean, boolean]; // in the current count
  };
  show: { steps: ShowStep[]; shown: number };
  log: LogEntry[];
  lastScore: { seat: Seat; items: ScoreItem[] } | null;
  winner: Seat | null;
  skunk: 0 | 1 | 2;
}

export type Action =
  | { type: 'draw'; seat: Seat; at: number } // pick a card from the spread deck to decide the dealer
  | { type: 'discard'; seat: Seat; cards: string[] } // card ids
  | { type: 'cut'; seat: Seat; at: number } // pone cuts the deck; the card at `at` becomes the starter
  | { type: 'play'; seat: Seat; card: string }
  | { type: 'show-next' }
  | { type: 'next-deal' };

const clone = <T>(x: T): T => structuredClone(x);
const SEAT_NAME = ['You', 'Siggi'] as const;

export function newGame(seed: number): CribbageState {
  const [deck, rng] = shuffle(standardDeck(), seed);
  // The game opens with both players drawing from the spread deck; lower card deals.
  return {
    seed, rng, deal: 0, phase: 'draw', dealer: 1, cutForDeal: null, draw: { picks: [null, null], used: [] },
    scores: [0, 0], backPegs: [0, 0], hands: [[], []], kept: [[], []], crib: [], deck,
    starter: null,
    peg: { toPlay: 0, count: 0, seq: [], pile: [], lastPlayer: null, saidGo: [false, false] },
    show: { steps: [], shown: 0 }, log: [{ seat: null, text: 'Draw a card: lowest card deals.' }], lastScore: null, winner: null, skunk: 0,
  };
}

/** Lowest unused spread index, used for automatic draws. */
export function firstFreeDrawIndex(s: CribbageState): number {
  let i = 0;
  while (s.draw.used.includes(i) || s.draw.picks.includes(i)) i++;
  return i;
}

/** The cut used when the player lets the game cut: the middle of the stock. */
export const autoCutIndex = (s: CribbageState) => Math.floor(s.deck.length / 2);

const label = (c: Card) => cardName(c);

function startDeal(s: CribbageState, deck: Card[], rng: number): CribbageState {
  const pone = other(s.dealer);
  s.deal += 1;
  s.phase = 'discard';
  s.rng = rng;
  // Deal alternately, pone first.
  const hands: [Card[], Card[]] = [[], []];
  for (let i = 0; i < 12; i++) hands[i % 2 === 0 ? pone : s.dealer].push(deck[i]);
  s.hands = [sortCards(hands[0]), sortCards(hands[1])];
  s.deck = deck.slice(12);
  s.kept = [[], []];
  s.crib = [];
  s.starter = null;
  s.peg = { toPlay: pone, count: 0, seq: [], pile: [], lastPlayer: null, saidGo: [false, false] };
  s.show = { steps: [], shown: 0 };
  s.lastScore = null;
  s.log.push({ seat: null, text: `Deal ${s.deal}: ${s.dealer === 0 ? 'your' : "Siggi's"} crib.` });
  return s;
}

function addScore(s: CribbageState, seat: Seat, items: ScoreItem[], why?: string): void {
  const pts = total(items);
  if (pts <= 0 || s.winner !== null) return;
  s.backPegs[seat] = s.scores[seat];
  s.scores[seat] = Math.min(WIN, s.scores[seat] + pts);
  s.lastScore = { seat, items };
  s.log.push({ seat, text: why ?? items.map((i) => i.label).join(', '), points: pts });
  if (s.scores[seat] >= WIN) {
    s.winner = seat;
    s.phase = 'game-over';
    const loser = s.scores[other(seat)];
    s.skunk = loser < 61 ? 2 : loser < 91 ? 1 : 0;
    s.log.push({ seat, text: `${SEAT_NAME[seat]} ${seat === 0 ? 'win' : 'wins'}${s.skunk === 2 ? ' with a double skunk' : s.skunk === 1 ? ' with a skunk' : ''}.` });
  }
}

export const canPlay = (s: CribbageState, seat: Seat) => s.hands[seat].some((c) => s.peg.count + pipValue(c) <= 31);
export const legalPlays = (s: CribbageState, seat: Seat) => s.hands[seat].filter((c) => s.peg.count + pipValue(c) <= 31);

// After a card is played (or at a reset), work out who acts next, handling "go"
// automatically: nobody is ever asked to press a Go button.
function settlePegging(s: CribbageState): void {
  for (let guard = 0; guard < 20 && s.phase === 'pegging'; guard++) {
    const handsEmpty = s.hands[0].length === 0 && s.hands[1].length === 0;
    const next = s.peg.toPlay;
    if (canPlay(s, next)) return;
    if (canPlay(s, other(next))) {
      if (s.hands[next].length > 0 && !s.peg.saidGo[next]) s.log.push({ seat: next, text: 'Go' });
      s.peg.saidGo[next] = true;
      s.peg.toPlay = other(next);
      return;
    }
    // Neither can play: last player scores go / last card (unless it was 31, already reset).
    const last = s.peg.lastPlayer;
    if (last !== null && s.peg.count > 0 && s.peg.count < 31) {
      addScore(s, last, [{ kind: 'go', points: 1, cards: [], label: handsEmpty ? 'Last card' : 'Go' }]);
      if (s.phase !== 'pegging') return;
    }
    s.peg.count = 0;
    s.peg.seq = [];
    s.peg.saidGo = [false, false];
    if (handsEmpty) { beginShow(s); return; }
    s.peg.toPlay = last === null ? next : other(last);
  }
}

function beginShow(s: CribbageState): void {
  const pone = other(s.dealer);
  const starter = s.starter!;
  s.phase = 'show';
  s.hands = [s.kept[0].slice(), s.kept[1].slice()];
  s.show = {
    shown: 0,
    steps: [
      { seat: pone, what: 'hand', cards: s.kept[pone], items: scoreShow(s.kept[pone], starter, false) },
      { seat: s.dealer, what: 'hand', cards: s.kept[s.dealer], items: scoreShow(s.kept[s.dealer], starter, false) },
      { seat: s.dealer, what: 'crib', cards: sortCards(s.crib), items: scoreShow(s.crib, starter, true) },
    ],
  };
}

export function apply(prev: CribbageState, action: Action): CribbageState {
  const s = clone(prev);
  switch (action.type) {
    case 'discard': {
      if (s.phase !== 'discard' || s.kept[action.seat].length) throw new Error('not discarding');
      if (action.cards.length !== 2) throw new Error('discard exactly two cards');
      const hand = s.hands[action.seat];
      const out = hand.filter((c) => action.cards.includes(c.id));
      if (out.length !== 2) throw new Error('cards not in hand');
      s.hands[action.seat] = hand.filter((c) => !action.cards.includes(c.id));
      s.kept[action.seat] = s.hands[action.seat].slice();
      s.crib.push(...out);
      if (s.kept[0].length && s.kept[1].length) s.phase = 'cut';
      return s;
    }
    case 'draw': {
      if (s.phase !== 'draw' || s.draw.picks[action.seat] !== null) throw new Error('not drawing');
      const at = action.at;
      if (at < 0 || at >= s.deck.length || s.draw.used.includes(at) || s.draw.picks.includes(at)) throw new Error('card not available');
      s.draw.picks[action.seat] = at;
      const [p0, p1] = s.draw.picks;
      if (p0 === null || p1 === null) return s;
      const a = s.deck[p0], b = s.deck[p1];
      if (a.rank === b.rank) {
        s.log.push({ seat: null, text: `Both drew ${rankName(a.rank)}s. Draw again.` });
        s.draw = { picks: [null, null], used: [...s.draw.used, p0, p1] };
        return s;
      }
      s.dealer = a.rank < b.rank ? 0 : 1;
      s.cutForDeal = [a, b];
      s.log.push({ seat: null, text: `You drew ${label(a)}, Siggi ${label(b)}. ${s.dealer === 0 ? 'You deal' : 'Siggi deals'}.` });
      const [deck, rng] = shuffle(standardDeck(), s.rng);
      return startDeal(s, deck, rng);
    }
    case 'cut': {
      if (s.phase !== 'cut' || action.seat !== other(s.dealer)) throw new Error('not your cut');
      const at = Math.min(Math.max(action.at, MIN_CUT), s.deck.length - MIN_CUT);
      // Lift the top part off, turn the top card of what's left.
      s.deck = [...s.deck.slice(at), ...s.deck.slice(0, at)];
      s.starter = s.deck[0];
      s.log.push({ seat: null, text: `${action.seat === 0 ? 'You cut' : 'Siggi cuts'}. Starter: ${label(s.starter)}.` });
      s.phase = 'pegging';
      if (s.starter.rank === 11) addScore(s, s.dealer, [{ kind: 'heels', points: 2, cards: [s.starter], label: 'His heels' }]);
      if (s.phase === 'pegging') settlePegging(s);
      return s;
    }
    case 'play': {
      if (s.phase !== 'pegging' || s.peg.toPlay !== action.seat) throw new Error('not your turn');
      const c = s.hands[action.seat].find((x) => x.id === action.card);
      if (!c) throw new Error('card not in hand');
      if (s.peg.count + pipValue(c) > 31) throw new Error('count would pass 31');
      s.hands[action.seat] = s.hands[action.seat].filter((x) => x.id !== c.id);
      s.peg.seq.push(c);
      s.peg.pile.push({ seat: action.seat, card: c });
      s.peg.count += pipValue(c);
      s.peg.lastPlayer = action.seat;
      s.lastScore = null;
      const items = scorePegging(s.peg.seq);
      if (items.length) addScore(s, action.seat, items, `${items.map((i) => i.label).join(', ')} (${s.peg.count})`);
      if (s.phase !== 'pegging') return s;
      if (s.peg.count === 31) { s.peg.count = 0; s.peg.seq = []; s.peg.saidGo = [false, false]; }
      s.peg.toPlay = other(action.seat);
      settlePegging(s);
      return s;
    }
    case 'show-next': {
      if (s.phase !== 'show') throw new Error('not in the show');
      const step = s.show.steps[s.show.shown];
      s.show.shown += 1;
      const pts = total(step.items);
      const whose = step.seat === 0 ? 'Your' : "Siggi's";
      if (pts > 0) addScore(s, step.seat, step.items, `${whose} ${step.what}`);
      else { s.lastScore = { seat: step.seat, items: [] }; s.log.push({ seat: step.seat, text: `${whose} ${step.what}: nineteen (no points)` }); }
      if (s.phase === 'show' && s.show.shown === s.show.steps.length) s.phase = 'deal-over';
      return s;
    }
    case 'next-deal': {
      if (s.phase !== 'deal-over') throw new Error('deal not over');
      s.dealer = other(s.dealer);
      s.cutForDeal = null;
      const [deck, rng] = shuffle(standardDeck(), s.rng);
      return startDeal(s, deck, rng);
    }
  }
}
