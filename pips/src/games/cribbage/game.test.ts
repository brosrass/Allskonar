import { describe, expect, it } from 'vitest';
import { aiAction } from './ai';
import { type CribbageState, type Seat, WIN, apply, newGame } from './game';

function playOut(seed: number, check?: (s: CribbageState) => void): CribbageState {
  let s = newGame(seed);
  for (let i = 0; i < 2000 && s.phase !== 'game-over'; i++) {
    check?.(s);
    if (s.phase === 'show') { s = apply(s, { type: 'show-next' }); continue; }
    if (s.phase === 'deal-over') { s = apply(s, { type: 'next-deal' }); continue; }
    const a = aiAction(s, 0) ?? aiAction(s, 1);
    if (!a) throw new Error(`stuck in ${s.phase}`);
    s = apply(s, a);
  }
  return s;
}

describe('cribbage game', () => {
  it('is deterministic for a seed', () => {
    expect(playOut(42).scores).toEqual(playOut(42).scores);
  });

  it('plays 300 AI-vs-AI games to a legal finish', () => {
    let skunks = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const s = playOut(seed, (st) => {
        if (st.phase === 'pegging') {
          const held = st.hands[0].length + st.hands[1].length;
          expect(held + st.peg.pile.length).toBe(8);
          expect(st.crib).toHaveLength(4);
          expect(st.peg.count).toBeLessThanOrEqual(31);
        }
      });
      expect(s.phase).toBe('game-over');
      const w = s.winner as Seat;
      expect(s.scores[w]).toBe(WIN);
      expect(s.scores[w === 0 ? 1 : 0]).toBeLessThan(WIN);
      if (s.skunk) skunks++;
    }
    expect(skunks).toBeLessThan(150);
  });

  it('draws for deal, redraws on ties, and cuts within limits', () => {
    let s = newGame(3);
    expect(s.phase).toBe('draw');
    s = apply(s, { type: 'draw', seat: 0, at: 0 });
    expect(() => apply(s, { type: 'draw', seat: 1, at: 0 })).toThrow();
    // find a tie in the spread to check redraws
    const tieAt = s.deck.findIndex((c, i) => i > 0 && c.rank === s.deck[0].rank);
    const tied = apply(s, { type: 'draw', seat: 1, at: tieAt });
    expect(tied.phase).toBe('draw');
    expect(tied.draw.used).toEqual([0, tieAt]);
    s = apply(s, { type: 'draw', seat: 1, at: s.deck.findIndex((c) => c.rank !== s.deck[0].rank) });
    expect(s.phase).toBe('discard');
    expect(s.dealer).toBe(s.cutForDeal![0].rank < s.cutForDeal![1].rank ? 0 : 1);
    s = apply(s, aiAction(s, 0)!);
    s = apply(s, aiAction(s, 1)!);
    expect(s.phase).toBe('cut');
    const pone = s.dealer === 0 ? 1 : 0;
    expect(() => apply(s, { type: 'cut', seat: s.dealer, at: 10 })).toThrow();
    const stock = s.deck.slice();
    const cut = apply(s, { type: 'cut', seat: pone, at: 0 }); // clamped to MIN_CUT
    expect(cut.starter!.id).toBe(stock[4].id);
  });

  it('rejects illegal moves', () => {
    let s = newGame(7);
    s = apply(s, { type: 'draw', seat: 0, at: 0 });
    s = apply(s, { type: 'draw', seat: 1, at: s.deck.findIndex((c) => c.rank !== s.deck[0].rank) });
    expect(() => apply(s, { type: 'discard', seat: 0, cards: [s.hands[0][0].id] })).toThrow();
    expect(() => apply(s, { type: 'play', seat: 0, card: s.hands[0][0].id })).toThrow();
  });

  it('gives the dealer two for his heels', () => {
    for (let seed = 1; seed < 400; seed++) {
      let s = newGame(seed);
      while (s.phase !== 'pegging' && s.phase !== 'game-over') s = apply(s, (aiAction(s, 0) ?? aiAction(s, 1))!);
      if (s.starter!.rank === 11) {
        expect(s.scores[s.dealer]).toBe(2);
        return;
      }
    }
    throw new Error('no jack starter in 400 seeds');
  });
});

describe('Siggi (AI)', () => {
  it('beats a random player clearly over 200 games', async () => {
    const { nextRandom } = await import('../../engine/rng');
    const { legalPlays } = await import('./game');
    let wins = 0;
    for (let seed = 1; seed <= 200; seed++) {
      let s = newGame(seed);
      let r = seed * 7919;
      const pick = <T>(xs: T[]) => { const [v, n] = nextRandom(r); r = n; return xs[Math.floor(v * xs.length)]; };
      for (let i = 0; i < 2000 && s.phase !== 'game-over'; i++) {
        if (s.phase === 'show') { s = apply(s, { type: 'show-next' }); continue; }
        if (s.phase === 'deal-over') { s = apply(s, { type: 'next-deal' }); continue; }
        const smart = aiAction(s, 1);
        if (smart) { s = apply(s, smart); continue; }
        if (s.phase === 'draw' || s.phase === 'cut') { s = apply(s, aiAction(s, 0)!); continue; }
        if (s.phase === 'discard') {
          const h = s.hands[0].slice();
          const a = pick(h); const b = pick(h.filter((c) => c !== a));
          s = apply(s, { type: 'discard', seat: 0, cards: [a.id, b.id] });
        } else s = apply(s, { type: 'play', seat: 0, card: pick(legalPlays(s, 0)).id });
      }
      if (s.winner === 1) wins++;
    }
    expect(wins).toBeGreaterThan(130);
  });
});
