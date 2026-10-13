import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, GAMES, NEWEST, SITE_NAME, recentGames } from '../site';
import { PipsMascot } from './PipsMascot';

// Full-screen game picker: search, recently played, four suit-headed
// categories and a promo strip (daily deal, random game, newest).
export function GameMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const recent = useMemo(() => (open ? recentGames() : []), [open]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    search.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  const needle = q.trim().toLowerCase();
  const matches = (name: string) => !needle || name.toLowerCase().includes(needle);
  const live = GAMES.filter((g) => g.status === 'live');
  const randomSlug = live[Math.floor(Math.random() * live.length)].slug;
  const newest = GAMES.find((g) => g.slug === NEWEST)!;
  const link = (slug: string) => `#/${slug}`;

  return (
    <div className="game-menu" role="dialog" aria-modal="true" aria-label="All games">
      <div className="gm-inner">
        <div className="gm-top">
          <PipsMascot mood={needle && !GAMES.some((g) => matches(g.name)) ? 'think' : 'wink'} size={64} />
          <label className="gm-search" htmlFor="game-search">
            <span className="sr-only">Search games</span>
            <input id="game-search" ref={search} type="search" placeholder="Find a game…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          </label>
          <button className="gm-close" type="button" onClick={onClose}>Close</button>
        </div>

        {!needle && recent.length > 0 && (
          <div className="gm-recent">
            <span className="gm-kicker">Played lately</span>
            <div>
              {recent.map((slug) => {
                const g = GAMES.find((x) => x.slug === slug);
                return g ? <a key={slug} href={link(slug)} onClick={onClose} className="gm-pill">{g.name}</a> : null;
              })}
            </div>
          </div>
        )}

        <div className="gm-cols">
          {CATEGORIES.map((cat) => {
            const games = GAMES.filter((g) => g.category === cat.id && matches(g.name));
            if (!games.length) return null;
            return (
              <section key={cat.id} className="gm-col">
                <h2><span className={cat.red ? 'suit red' : 'suit'}>{cat.suit}</span> {cat.name}</h2>
                <ul>
                  {games.map((g) => (
                    <li key={g.slug}>
                      <a href={link(g.slug)} onClick={onClose} className={g.status === 'planned' ? 'soon' : ''}>
                        {g.name}{g.status === 'planned' && <small>soon</small>}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {needle && !GAMES.some((g) => matches(g.name)) && <p className="gm-empty">No game called “{q}” yet. Tell us and {SITE_NAME} will think about it.</p>}
        </div>

        <div className="gm-promos">
          <a href="#/cribbage/daily" onClick={onClose}><span className="gm-kicker">Same deal for everyone</span><b>Daily Cribbage</b></a>
          <a href={link(randomSlug)} onClick={onClose}><span className="gm-kicker">Can't decide?</span><b>Random game</b></a>
          <a href={link(newest.slug)} onClick={onClose}><span className="gm-kicker">Newest game</span><b>{newest.name}</b></a>
        </div>
      </div>
    </div>
  );
}
