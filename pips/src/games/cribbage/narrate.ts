// What Pips says about the table right now: one short line plus a mood.
// Pure, so it is easy to test and reuse for other games' hosts later.
import { rankName } from '../../engine/cards';
import type { Mood } from '../../ui/PipsMascot';
import type { CribbageState } from './game';
import { total } from './score';

const NAMES = ['You', 'Siggi'] as const;

export interface Line { text: string; mood: Mood }

export function narrate(s: CribbageState, opts: { selected: number; manualCut: boolean }): Line {
  const last = s.log[s.log.length - 1];
  switch (s.phase) {
    case 'draw': {
      if (last?.text.startsWith('Both drew')) return { text: `${last.text}`, mood: 'think' };
      if (s.draw.picks[0] === null) return { text: opts.manualCut ? 'Pick any card from the deck. Lowest card deals.' : 'Drawing for the deal…', mood: 'happy' };
      return { text: 'Siggi is drawing…', mood: 'think' };
    }
    case 'discard': {
      if (s.kept[0].length) return { text: 'Siggi is choosing his crib cards…', mood: 'think' };
      const whose = s.dealer === 0 ? 'your' : "Siggi's";
      const intro = s.deal === 1 && s.cutForDeal ? `${s.dealer === 0 ? 'You deal' : 'Siggi deals'}. ` : '';
      if (opts.selected === 0) return { text: `${intro}Pick two cards for ${whose} crib.`, mood: 'happy' };
      if (opts.selected === 1) return { text: 'One more card for the crib.', mood: 'happy' };
      return { text: 'Good. Send them to the crib.', mood: 'wink' };
    }
    case 'cut':
      return s.dealer === 1
        ? { text: opts.manualCut ? 'Your cut. Tap anywhere in the deck.' : 'Cutting the deck…', mood: 'happy' }
        : { text: 'Siggi cuts the deck…', mood: 'think' };
    case 'pegging': {
      if (s.lastScore && last?.points) {
        const who = s.lastScore.seat;
        const calls = s.lastScore.items.map((i) => i.label.toLowerCase()).join(', ');
        const pts = total(s.lastScore.items);
        const line = who === 0 ? `${cap(calls)} for ${pts}!` : `Siggi: ${calls} for ${pts}.`;
        return { text: line, mood: who === 0 ? 'cheer' : 'sad' };
      }
      if (last?.text === 'Go' && last.seat !== null) {
        return { text: last.seat === 0 ? 'You can\'t play. Go!' : 'Siggi says go. Keep playing if you can.', mood: 'think' };
      }
      const top = s.peg.pile[s.peg.pile.length - 1];
      const turn = s.peg.toPlay === 0 ? 'Your play.' : 'Siggi is thinking…';
      if (!top) return { text: s.peg.toPlay === 0 ? 'You lead. Cards under 5 are safe leads.' : 'Siggi leads…', mood: 'happy' };
      const count = s.peg.count === 0 ? 'Count starts again at 0.' : `${s.peg.count}.`;
      return { text: `${NAMES[top.seat]} ${top.seat === 0 ? 'play' : 'plays'} ${article(top.card.rank)} ${rankName(top.card.rank).toLowerCase()}. ${count} ${turn}`, mood: 'happy' };
    }
    case 'show': {
      const done = s.show.steps[s.show.shown - 1];
      if (!done) return { text: 'Counting time. Each hand scores with the starter.', mood: 'happy' };
      const pts = total(done.items);
      const whose = done.seat === 0 ? 'Your' : "Siggi's";
      if (pts === 0) return { text: `${whose} ${done.what}: nineteen. Nothing there.`, mood: done.seat === 0 ? 'sad' : 'wink' };
      return { text: `${whose} ${done.what} is worth ${pts}.`, mood: done.seat === 0 ? 'cheer' : 'think' };
    }
    case 'deal-over':
      return { text: `End of the deal. You ${s.scores[0]}, Siggi ${s.scores[1]}.`, mood: s.scores[0] >= s.scores[1] ? 'happy' : 'think' };
    case 'game-over':
      return s.winner === 0
        ? { text: s.skunk ? 'You won, and skunked Siggi!' : 'You won! Nicely pegged.', mood: 'cheer' }
        : { text: 'Siggi takes this one. Rematch?', mood: 'sad' };
  }
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const article = (rank: number) => (rank === 1 || rank === 8 ? 'an' : 'a');
