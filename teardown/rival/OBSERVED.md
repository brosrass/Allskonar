# Rival: homepage observations

Source: screenshot and homepage text supplied by the user, 2026-10-13.
Live capture is blocked from the build environment.
Tags: [OBSERVED] seen in the material · [INFERRED] deduced · [COMPUTED] counted.

## Catalogue: 46 games in 4 categories [OBSERVED, count COMPUTED]

| Category | n | Games |
|---|---|---|
| Trick-taking | 10 | Bridge, Euchre, Hearts, Lockup, Manni, Oh Hell!, Pinochle, Skat, Spades, Whist |
| Card games | 12 | Canasta, Crazy Eights, Cribbage, Escoba, Gin Rummy, Go Fish, Idiot, Rummy, Spit, Switch, Thirteen, War |
| Solitaires | 13 | Addiction, Canfield, Clock, Crescent, FreeCell, Golf, Kings in the Corners, Pyramid, Scorpion, Solitaire (Klondike), Spider, Tri Peaks, Yukon |
| Misc / board / dice | 11 | Backgammon, Checkers, Chess, Farkle, Mahjong, Minesweeper, Reversi, Sea Battle, Sudoku, Triangles, Yahtzee |

- The homepage icon grid shows 45 tiles. War is missing from the grid but present in the menu [OBSERVED].
- Newest game: Skat [OBSERVED].
- Not in their catalogue, but on our research list: Spite & Malice, Durak, Schnapsen, Barbu, Regicide [OBSERVED absence].

## Information architecture

- Flat URLs, `/<slug>/`, lowercase, words joined with no hyphens: `ginrummy`, `crazyeights`, `ohhell`. Most solitaires get a `solitaire` suffix (`spidersolitaire`); `freecell`, `solitaire`, `addiction` and `kingsinthecorners` don't [OBSERVED].
- Languages: 10, by path prefix `/de/ /es/ /fr/ /hi/ /it/ /nl/ /pl/ /pt/ /zh/`; English sits at the root [OBSERVED].
- The top bar holds Home plus 7 pinned games: Hearts, Solitaire, Spades, FreeCell, Cribbage, Yahtzee, Gin Rummy. "More games" opens the full menu [OBSERVED]. Those 7 are probably their top traffic games [INFERRED].
- The menu can be customised ("Customize…", "Hide 'Home' link"), so players can pin their own games [INFERRED].
- About, FAQ, Contact, More games and Customize are hash anchors on the homepage, so the homepage is one page whose sections toggle by hash [INFERRED].
- Extras:
  - Daily Solitaire with a leaderboard.
  - A random-game button.
  - A sister site with more games.
  - A blog of how-to-play and update posts at `/blog/`.
  - An error report form per game [OBSERVED].
- A version string in the footer [OBSERVED].
- Blog cadence: posts on 24 Aug, 8 Sep and 28 Sep 2026, about every 2–3 weeks [COMPUTED].

## Game menu overlay [OBSERVED from second screenshot]

- "More games" opens a full-screen overlay in dark felt green, translucent enough to show the board behind it.
- Four columns, one per category. Each heading is a suit symbol plus bold white uppercase text: ♥ trick-taking, ♠ card games, ♦ solitaires, ♣ misc. A thin rule sits under each heading.
- Games are listed as plain white text links with green bullet dots, alphabetical within each column. The menu is text only; the icon tiles appear only on the homepage.
- Promo strip below the columns, four cells, each a small yellow uppercase kicker over a white bold title:
  - Daily Solitaire ("top the leaderboard")
  - Random game ("not sure?")
  - Newest game, currently Skat
  - The sister site ("more games")
- Footer row: "Hide 'Home' link" on the left, a grey bevelled "CLOSE GAME MENU" button in the centre, "Customize…" on the right.
- The menu lists all 46 games, War included [OBSERVED, COMPUTED].
- One click reaches any game from any page [INFERRED]. The four suits map neatly onto four categories [INFERRED]; Pips could use the same device.

## Product rules (from their FAQ, summarised)

- One rule set per game, with no variants. Few on-screen controls. They say they turn down about 99% of feature requests [OBSERVED].
- No login. Stats live only in the browser, so they don't follow you to another device [OBSERVED].
- Deals are random. The computer players use only information a human would have [OBSERVED claim].
- A single named AI persona, who has a cartoon face and shows up across games. The community jokes about how good he is at Spades [OBSERVED].
- Money comes from display ads plus a cookie consent manager. Cookies are also used for screen and browser analytics [OBSERVED].
- Social presence: Facebook page and community group, X, Mastodon, YouTube, Instagram, Bluesky [OBSERVED].
- Operator: a small Icelandic company [OBSERVED].

## Visual language [OBSERVED from screenshot]

- Light-blue page background and one large green rounded panel (the "felt") holding the game grid.
- Square icon tiles with rounded corners and white borders. Each shows a miniature of its game: a card layout, a board, dice. The label sits below in white bold sans.
- Text-link nav in red, with "More games" picked out in yellow and red. The current page is underlined.
- Logo: chunky rounded white capitals with a grey drop shadow.
- Overall it reads as early-2010s flat web: high contrast, no motion on the homepage, no hero.

## Gaps Pips can exploit [INFERRED]

1. **Variants and house rules.** They refuse them as policy. Offer them per game (Cribbage: muggins, stinkhole), with the standard rules as default.
2. **Stats across devices.** Offer optional sign-in or sync; keep play without an account as the default.
3. **Games they don't have**, especially regional ones: Durak, Schnapsen, Spite & Malice, Barbu.
4. **Polish.** Their UI is deliberately static. Use animation, sound and a modern skin, but keep their one-tap simplicity.
5. **Daily challenges.** They have one, for Solitaire only. Extend to Daily Cribbage and others with a seeded deal (Pips already has `dailySeed`).
6. **Replays and visible fairness.** Their FAQ has to insist the bot doesn't cheat, so players clearly suspect it. Show the full replay after each game, using the seeded RNG.

## Still unknown (needs page source or play)

- Rendering per game (DOM, canvas or SVG), framework, bundle size.
- Ad networks and slot positions on game pages.
- Per-game AI behaviour, animation timing, stats keys in localStorage.
- Whether any game has real-time multiplayer.
