import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { type Card, SUIT_SYMBOL, rankLabel } from '../../engine/cards';
import { dailySeed, randomSeed } from '../../engine/rng';
import { PipsMascot } from '../../ui/PipsMascot';
import { PipsHost } from '../../ui/PipsHost';
import { SpreadDeck } from '../../ui/SpreadDeck';
import { PLAY_DELAY, type Settings, type Speed, loadSettings, saveSettings } from '../../settings';
import { narrate } from './narrate';
import { PlayingCard } from '../../ui/PlayingCard';
import { aiAction } from './ai';
import { Board } from './Board';
import { type Action, type CribbageState, MIN_CUT, apply, autoCutIndex, firstFreeDrawIndex, legalPlays, newGame } from './game';
import { total } from './score';

const FREE_KEY = 'pips.cribbage.v1';
const DAILY_RESULTS_KEY = 'pips.cribbage.daily.results.v1';
const todayKey = () => new Date().toISOString().slice(0, 10); // UTC, matches dailySeed
const STATS_KEY = 'pips.cribbage.stats.v1';
const NAMES: [string, string] = ['You', 'Siggi'];

interface Stats { played: number; won: number; skunksFor: number; skunksAgainst: number }
const emptyStats: Stats = { played: 0, won: 0, skunksFor: 0, skunksAgainst: 0 };

function load<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage blocked: play on without saving */ }
}

interface DailyResult { won: boolean; scores: [number, number]; skunk: number }

// Consecutive days, ending today or yesterday, with a finished daily game.
function dailyStreak(results: Record<string, DailyResult>): number {
  let n = 0;
  const d = new Date();
  if (!results[todayKey()]) d.setUTCDate(d.getUTCDate() - 1);
  while (results[d.toISOString().slice(0, 10)]) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

type Msg = Action | { type: 'new-game'; seed: number } | { type: 'restore'; state: CribbageState };
function reducer(s: CribbageState, m: Msg): CribbageState {
  if (m.type === 'new-game') return newGame(m.seed);
  if (m.type === 'restore') return m.state;
  try { return apply(s, m); } catch { return s; } // ignore stale clicks
}

export function CribbageTable({ daily = false }: { daily?: boolean }) {
  // The daily game is the same seeded game for everyone today; one try, no undo.
  const saveKey = daily ? `pips.cribbage.daily.${todayKey()}` : FREE_KEY;
  const [state, dispatch] = useReducer(reducer, null, () => load<CribbageState>(saveKey) ?? newGame(daily ? dailySeed() : randomSeed()));
  const [selected, setSelected] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>(() => load<Stats>(STATS_KEY) ?? emptyStats);
  const [dailyResults, setDailyResults] = useState<Record<string, DailyResult>>(() => load(DAILY_RESULTS_KEY) ?? {});
  // Undo: snapshots taken before each of your moves in the current deal.
  const [history, setHistory] = useState<CribbageState[]>([]);
  const [assisted, setAssisted] = useState(() => !daily && load<number>(`${FREE_KEY}.assisted`) === state.seed);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const setSettings = (patch: Partial<Settings>) => setSettingsState((prev) => { const next = { ...prev, ...patch }; saveSettings(next); return next; });
  // The daily game always draws and cuts automatically so everyone gets the same starter.
  const manualCut = settings.manualCut && !daily;

  useEffect(() => save(saveKey, state), [saveKey, state]);
  useEffect(() => setHistory([]), [state.deal, state.seed]);

  const act = (a: Action) => {
    if (!daily) setHistory((h) => [...h.slice(-30), state]);
    dispatch(a);
  };
  const canUndo = !daily && history.length > 0 && state.phase !== 'game-over';
  const undo = useCallback(() => {
    if (!canUndo) return;
    dispatch({ type: 'restore', state: history[history.length - 1] });
    setHistory((h) => h.slice(0, -1));
    setAssisted(true);
    save(`${FREE_KEY}.assisted`, state.seed);
  }, [canUndo, history, state.seed]);
  const startNew = () => {
    setHistory([]);
    setAssisted(false);
    dispatch({ type: 'new-game', seed: randomSeed() });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || (e.key === 'u' && !(e.target instanceof HTMLInputElement))) { e.preventDefault(); undo(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [undo]);

  // Siggi's moves, paced so a person can follow them.
  useEffect(() => {
    const a = aiAction(state, 1);
    if (!a) return;
    const play = PLAY_DELAY[settings.speed];
    const delay = a.type === 'discard' ? 250 : a.type === 'play' ? play : Math.round(play * 0.9);
    const t = setTimeout(() => dispatch(a), delay);
    return () => clearTimeout(t);
  }, [state, settings.speed]);

  // Automatic draw and cut for you, when you'd rather not do them by hand.
  useEffect(() => {
    if (manualCut) return;
    let a: Action | null = null;
    if (state.phase === 'draw' && state.draw.picks[0] === null) a = { type: 'draw', seat: 0, at: firstFreeDrawIndex(state) };
    if (state.phase === 'cut' && state.dealer === 1) a = { type: 'cut', seat: 0, at: autoCutIndex(state) };
    if (!a) return;
    const t = setTimeout(() => dispatch(a), 350);
    return () => clearTimeout(t);
  }, [state, manualCut]);

  // Record a finished game once.
  useEffect(() => {
    if (state.phase !== 'game-over') return;
    const won = state.winner === 0;
    if (daily) {
      const key = todayKey();
      if (load<Record<string, DailyResult>>(DAILY_RESULTS_KEY)?.[key]) return;
      const next = { ...dailyResults, [key]: { won, scores: state.scores, skunk: state.skunk } };
      save(DAILY_RESULTS_KEY, next);
      setDailyResults(next);
      return;
    }
    const tag = `${state.seed}:${state.deal}`;
    if (load<string>(STATS_KEY + '.last') === tag) return;
    save(STATS_KEY + '.last', tag);
    setStats((prev) => {
      // Wins with undo still count as played, not as won.
      const next = { played: prev.played + 1, won: prev.won + (won && !assisted ? 1 : 0),
        skunksFor: prev.skunksFor + (won && state.skunk ? 1 : 0), skunksAgainst: prev.skunksAgainst + (!won && state.skunk ? 1 : 0) };
      save(STATS_KEY, next);
      return next;
    });
  }, [state]);

  useEffect(() => setSelected([]), [state.phase, state.deal]);

  const youDeal = state.dealer === 0;
  const legal = useMemo(() => new Set(state.phase === 'pegging' ? legalPlays(state, 0).map((c) => c.id) : []), [state]);
  const scoringIds = new Set(state.lastScore?.items.flatMap((i) => i.cards.map((c) => c.id)) ?? []);
  const showStep = state.phase === 'show' || state.phase === 'deal-over' || state.phase === 'game-over'
    ? state.show.steps[state.show.shown - 1] : undefined;
  const nextStep = state.phase === 'show' ? state.show.steps[state.show.shown] : undefined;

  function clickCard(c: Card) {
    if (state.phase === 'discard' && state.kept[0].length === 0) {
      setSelected((sel) => (sel.includes(c.id) ? sel.filter((x) => x !== c.id) : sel.length < 2 ? [...sel, c.id] : [sel[1], c.id]));
    } else if (state.phase === 'pegging' && state.peg.toPlay === 0 && legal.has(c.id)) {
      act({ type: 'play', seat: 0, card: c.id });
    }
  }

  const line = narrate(state, { selected: selected.length, manualCut });

  const showing = state.phase === 'show' || state.phase === 'deal-over' || state.phase === 'game-over';
  const cribShown = showing && state.show.shown >= 3;
  const lastLog = state.log.slice(-6).reverse();

  return (
    <div className="crib-layout">
      <section className="table" aria-label="Card table">
        <div className="seat opp">
          <div className="seat-label">Siggi <span className="score p1">{state.scores[1]}</span> {state.phase !== 'draw' && state.dealer === 1 && <span className="chip">Dealer</span>}</div>
          <div className="hand fan">
            {showing
              ? state.hands[1].map((c) => <PlayingCard key={c.id} card={c} highlight={scoringIds.has(c.id) && showStep?.seat === 1 && showStep.what === 'hand'} />)
              : state.hands[1].map((c) => <PlayingCard key={c.id} faceDown />)}
          </div>
        </div>

        <div className="middle">
          <div className="stack">
            <span className="stack-label">Starter</span>
            {state.starter ? <PlayingCard card={state.starter} highlight={scoringIds.has(state.starter.id)} />
              : state.phase === 'draw' || state.phase === 'cut' ? <div className="slot" /> : <PlayingCard faceDown />}
          </div>

          <div className="play-area">
            {state.phase === 'draw' ? (
              <SpreadDeck count={state.deck.length} label="Deck spread for drawing"
                onPick={manualCut && state.draw.picks[0] === null ? (i) => dispatch({ type: 'draw', seat: 0, at: i }) : undefined}
                isPickable={(i) => !state.draw.used.includes(i)}
                faceUp={Object.fromEntries(state.draw.picks.flatMap((p) => (p === null ? [] : [[p, state.deck[p]]])))} />
            ) : state.phase === 'cut' ? (
              <SpreadDeck count={state.deck.length} label="Deck spread for cutting"
                onPick={manualCut && state.dealer === 1 ? (i) => dispatch({ type: 'cut', seat: 0, at: i }) : undefined}
                isPickable={(i) => i >= MIN_CUT && i <= state.deck.length - MIN_CUT} />
            ) : state.phase === 'pegging' || (state.peg.pile.length && !showing) ? (
              <>
                <div className="count" aria-label={`Count ${state.peg.count}`}>{state.peg.count}</div>
                <div className="seq">
                  {state.peg.pile.slice(-8).map(({ seat, card }) => (
                    <PlayingCard key={card.id} card={card} className={`${seat === 1 ? 'up' : 'down'} ${state.peg.seq.includes(card) || state.peg.seq.some((c) => c.id === card.id) ? '' : 'old'}`}
                      highlight={scoringIds.has(card.id)} />
                  ))}
                </div>
              </>
            ) : showStep ? (
              <ShowBreakdown step={showStep} />
            ) : (
              <div className="slot ghost" aria-hidden="true" />
            )}
          </div>

          <div className="stack">
            <span className="stack-label">{state.phase === 'draw' ? 'Crib' : youDeal ? 'Your crib' : "Siggi's crib"}</span>
            <div className="crib-pile">
              {cribShown
                ? state.show.steps[2].cards.map((c) => <PlayingCard key={c.id} card={c} highlight={scoringIds.has(c.id) && showStep?.what === 'crib'} />)
                : state.crib.length ? <PlayingCard faceDown /> : <div className="slot" />}
            </div>
          </div>
        </div>

        <div className="seat you">
          <div className="hand">
            {state.hands[0].map((c) => (
              <PlayingCard key={c.id} card={c}
                selected={selected.includes(c.id)}
                disabled={state.phase === 'pegging' ? state.peg.toPlay !== 0 || !legal.has(c.id) : state.phase === 'discard' && state.kept[0].length > 0}
                highlight={scoringIds.has(c.id) && showStep?.seat === 0 && showStep.what === 'hand'}
                onClick={state.phase === 'discard' || state.phase === 'pegging' ? () => clickCard(c) : undefined} />
            ))}
          </div>
          <div className="seat-label">You <span className="score p0">{state.scores[0]}</span> {state.phase !== 'draw' && youDeal && <span className="chip">Dealer</span>}</div>
        </div>

        <div className="controls">
          <PipsHost text={line.text} mood={line.mood} />
          {state.phase === 'discard' && state.kept[0].length === 0 && (
            <button className="btn primary" disabled={selected.length !== 2} onClick={() => act({ type: 'discard', seat: 0, cards: selected })}>
              Send to crib
            </button>
          )}
          {state.phase === 'show' && (
            <button className="btn primary" onClick={() => dispatch({ type: 'show-next' })}>
              Count {nextStep!.seat === 0 ? 'your' : "Siggi's"} {nextStep!.what}
            </button>
          )}
          {state.phase === 'deal-over' && <button className="btn primary" onClick={() => dispatch({ type: 'next-deal' })}>Next deal</button>}
          {state.phase === 'game-over' && (daily
            ? <a className="btn primary" href="#/cribbage">Play a free game</a>
            : <button className="btn primary" onClick={startNew}>Play again</button>)}
          {!daily && (
            <button className="btn quiet" onClick={undo} disabled={!canUndo} title="Undo your last move (U)">↶ Undo</button>
          )}
        </div>

        {state.phase === 'game-over' && (
          <div className="result" role="status">
            <PipsMascot mood={state.winner === 0 ? 'cheer' : 'sad'} size={72} />
            <strong>{state.winner === 0 ? 'You win' : 'Siggi wins'} {state.scores[0]}–{state.scores[1]}</strong>
            {state.skunk > 0 && <span>{state.skunk === 2 ? 'Double skunk!' : 'Skunk!'}</span>}
            {daily && <small>Today's deal is done. A new one comes at midnight UTC.</small>}
            {assisted && !daily && <small>Undo used, so this game doesn't count as a win in your stats.</small>}
          </div>
        )}
      </section>

      <aside className="sidebar">
        <Board scores={state.scores} backPegs={state.backPegs} names={NAMES} />
        <ol className="log" aria-label="Recent scoring">
          {lastLog.map((e, i) => (
            <li key={state.log.length - i} className={e.seat === null ? 'sys' : `p${e.seat}`}>
              <span>{e.seat === null ? '' : NAMES[e.seat]}</span> {e.text}{e.points ? <b> +{e.points}</b> : null}
            </li>
          ))}
        </ol>
        {daily ? (
          <dl className="stats">
            <div><dt>Deal</dt><dd>{todayKey().slice(5).replace('-', '/')}</dd></div>
            <div><dt>Streak</dt><dd>{dailyStreak(dailyResults)}</dd></div>
            <div><dt>Daily wins</dt><dd>{Object.values(dailyResults).filter((r) => r.won).length}</dd></div>
          </dl>
        ) : (
          <dl className="stats">
            <div><dt>Played</dt><dd>{stats.played}</dd></div>
            <div><dt>Won</dt><dd>{stats.played ? Math.round((stats.won / stats.played) * 100) : 0}%</dd></div>
            <div><dt>Skunks</dt><dd>{stats.skunksFor}</dd></div>
          </dl>
        )}
        <details className="settings">
          <summary>Settings</summary>
          <fieldset>
            <legend>Siggi's speed</legend>
            {(['slow', 'normal', 'fast'] as Speed[]).map((sp) => (
              <label key={sp} htmlFor={`speed-${sp}`}>
                <input id={`speed-${sp}`} type="radio" name="speed" checked={settings.speed === sp} onChange={() => setSettings({ speed: sp })} /> {sp[0].toUpperCase() + sp.slice(1)}
              </label>
            ))}
          </fieldset>
          <label htmlFor="manual-cut">
            <input id="manual-cut" type="checkbox" checked={settings.manualCut} onChange={(e) => setSettings({ manualCut: e.target.checked })} />
            Draw and cut the deck myself{daily ? ' (not in the daily game)' : ''}
          </label>
        </details>
        {daily
          ? <a className="btn ghost" href="#/cribbage">Free play</a>
          : <button className="btn ghost" onClick={startNew}>New game</button>}
        {assisted && !daily && <p className="note">Undo used this game</p>}
      </aside>
    </div>
  );
}

function ShowBreakdown({ step }: { step: CribbageState['show']['steps'][number] }) {
  const pts = total(step.items);
  let running = 0;
  return (
    <div className="breakdown">
      <h3>{step.seat === 0 ? 'Your' : "Siggi's"} {step.what}: {pts}</h3>
      {pts === 0 ? <p>Nineteen. No points.</p> : (
        <ul>
          {step.items.map((it, i) => {
            running += it.points;
            return <li key={i}><span>{it.label}</span><span className="cards">{it.cards.map((c) => rankLabel(c.rank) + SUIT_SYMBOL[c.suit]).join(' ')}</span><b>{running}</b></li>;
          })}
        </ul>
      )}
    </div>
  );
}
