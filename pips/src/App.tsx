import { useCallback, useEffect, useState } from 'react';
import { CribbageRules } from './games/cribbage/Rules';
import { CribbageTable } from './games/cribbage/CribbageTable';
import { GAMES, SITE_NAME, markPlayed } from './site';
import { GameMenu } from './ui/GameMenu';
import { PipsMascot } from './ui/PipsMascot';

// Hash routing keeps the MVP a static bundle that runs from any host or file.
// Routes: #/<game> and #/<game>/daily.
function parseRoute() {
  const [slug = 'cribbage', mode] = location.hash.replace(/^#\/?/, '').split('/');
  return { slug: slug || 'cribbage', daily: mode === 'daily' };
}

export function App() {
  const [route, setRoute] = useState(parseRoute);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const on = () => { setRoute(parseRoute()); scrollTo(0, 0); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);

  const game = GAMES.find((g) => g.slug === route.slug) ?? GAMES[0];
  useEffect(() => {
    document.title = `${route.daily ? `Daily ${game.name}` : `Play ${game.name} online, free`} · ${SITE_NAME}`;
    if (game.status === 'live') markPlayed(game.slug);
  }, [game, route.daily]);

  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="#/cribbage" aria-label={`${SITE_NAME} home`}>
          <PipsMascot size={38} />
          {SITE_NAME}
        </a>
        <nav aria-label="Popular games">
          <a href="#/cribbage" aria-current={game.slug === 'cribbage' && !route.daily ? 'page' : undefined}>Cribbage</a>
          <a href="#/cribbage/daily" aria-current={route.daily ? 'page' : undefined}>Daily</a>
        </nav>
        <button className="all-games" type="button" onClick={() => setMenuOpen(true)} aria-haspopup="dialog">
          <span aria-hidden="true">♠♥♦♣</span> All games
        </button>
      </header>
      <GameMenu open={menuOpen} onClose={closeMenu} />

      <main className="page">
        {game.slug === 'cribbage' ? (
          <>
            <h1>{route.daily ? 'Daily Cribbage' : 'Cribbage'}</h1>
            <CribbageTable key={route.daily ? 'daily' : 'free'} daily={route.daily} />
            <CribbageRules />
          </>
        ) : (
          <section className="soon-panel">
            <PipsMascot mood="think" size={96} />
            <div>
              <h1>{game.name}</h1>
              <p className="eyebrow">Coming to {SITE_NAME}</p>
              <p>{game.blurb}</p>
              <p>{game.players} players. Pips is still learning this one. <a href="#/cribbage">Play Cribbage</a> in the meantime.</p>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span>{SITE_NAME}. Card games in your browser, no sign-up.</span>
        <span>Every deal comes from a seed, so any game can be replayed.</span>
      </footer>
    </>
  );
}
