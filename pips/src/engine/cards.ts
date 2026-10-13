export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string; // e.g. "QH", "10S"
  rank: Rank;
  suit: Suit;
}

export const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C'];
export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const SUIT_NAME: Record<Suit, string> = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };

export function rankLabel(rank: Rank): string {
  return rank === 1 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank);
}

export function rankName(rank: Rank): string {
  return ({ 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' } as Record<number, string>)[rank] ?? String(rank);
}

export function makeCard(rank: Rank, suit: Suit): Card {
  return { id: rankLabel(rank) + suit, rank, suit };
}

// Parse "5H", "10S", "JD", "AC" — handy in tests.
export function card(code: string): Card {
  const suit = code.slice(-1) as Suit;
  const r = code.slice(0, -1);
  const rank = (r === 'A' ? 1 : r === 'J' ? 11 : r === 'Q' ? 12 : r === 'K' ? 13 : Number(r)) as Rank;
  if (!SUITS.includes(suit) || !(rank >= 1 && rank <= 13)) throw new Error(`bad card code ${code}`);
  return makeCard(rank, suit);
}

export const cards = (codes: string) => codes.trim().split(/\s+/).map(card);

export function standardDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (let r = 1; r <= 13; r++) deck.push(makeCard(r as Rank, suit));
  return deck;
}

export const isRed = (c: Card) => c.suit === 'H' || c.suit === 'D';

export function cardName(c: Card): string {
  return `${rankName(c.rank)} of ${SUIT_NAME[c.suit]}`;
}

// Hand display order: by rank, then suit.
export function sortCards(cs: readonly Card[]): Card[] {
  return cs.slice().sort((a, b) => a.rank - b.rank || SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit));
}

export function combinations<T>(items: readonly T[], k: number): T[][] {
  const out: T[][] = [];
  const pick = (start: number, acc: T[]) => {
    if (acc.length === k) { out.push(acc.slice()); return; }
    for (let i = start; i <= items.length - (k - acc.length); i++) {
      acc.push(items[i]);
      pick(i + 1, acc);
      acc.pop();
    }
  };
  pick(0, []);
  return out;
}
