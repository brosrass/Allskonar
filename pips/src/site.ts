// One place for the brand, so a rename is a one-line change.
export const SITE_NAME = 'Pips';
export const SITE_DOMAIN = 'pips.game';

export type Category = 'trick' | 'card' | 'solitaire' | 'together';

// Four categories, four suits.
export const CATEGORIES: { id: Category; suit: string; name: string; red: boolean }[] = [
  { id: 'trick', suit: '♥', name: 'Trick-taking', red: true },
  { id: 'card', suit: '♠', name: 'Card games', red: false },
  { id: 'solitaire', suit: '♦', name: 'Solitaires', red: true },
  { id: 'together', suit: '♣', name: 'Co-op & party', red: false },
];

export interface GameEntry {
  slug: string;
  name: string;
  category: Category;
  players: string;
  status: 'live' | 'planned';
  blurb: string;
}

// Order follows the research priorities: Cribbage first, then the
// multiplayer core and the regional games.
export const GAMES: GameEntry[] = [
  { slug: 'cribbage', name: 'Cribbage', category: 'card', players: '2', status: 'live', blurb: 'Peg to 121. Fifteens, runs and the crib.' },
  { slug: 'spite-and-malice', name: 'Spite & Malice', category: 'solitaire', players: '2', status: 'planned', blurb: 'Competitive patience. Build piles, block your rival.' },
  { slug: 'hearts', name: 'Hearts', category: 'trick', players: '4', status: 'planned', blurb: 'Avoid hearts and the queen of spades, or shoot the moon.' },
  { slug: 'spades', name: 'Spades', category: 'trick', players: '4', status: 'planned', blurb: 'Bid your tricks with a partner. Spades are always trump.' },
  { slug: 'schnapsen', name: 'Schnapsen', category: 'trick', players: '2', status: 'planned', blurb: 'Race to 66 with a 20-card deck. Close the talon at the right moment.' },
  { slug: 'durak', name: 'Durak', category: 'card', players: '2–4', status: 'planned', blurb: 'Defend every attack or pick them all up. Last one holding cards loses.' },
  { slug: 'crazy-eights', name: 'Crazy Eights', category: 'card', players: '2–4', status: 'planned', blurb: 'Match suit or rank, eights are wild. First to empty their hand wins.' },
  { slug: 'regicide', name: 'Regicide', category: 'together', players: '1–4', status: 'planned', blurb: 'Co-op: defeat all twelve royals with a standard deck.' },
];

export const NEWEST = 'cribbage';

const RECENT_KEY = 'pips.recent.v1';
export function recentGames(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]; } catch { return []; }
}
export function markPlayed(slug: string): void {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([slug, ...recentGames().filter((s) => s !== slug)].slice(0, 4))); } catch { /* no storage */ }
}
