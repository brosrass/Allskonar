# Rival Cribbage: page and network teardown

Source: the user's saved page (HTML) and HAR of the rival's Cribbage page, 2026-10-13. A build from early October 2026.
Facts and architecture only. None of their code is copied here.
Tags: [OBSERVED] in the files · [INFERRED] deduced · [COMPUTED] counted.

## Stack
- jQuery 3.6.3 plus one bundle per game (352 KB for Cribbage, about 512 browserify-style modules, Babel-transpiled classes) [OBSERVED / INFERRED].
- A separate `translate.min.js` for i18n and a `stat.min.js` counter [OBSERVED].
- Asset URLs are versioned (`/<game>/<version>/…`). A version file carries the build date and commit and drives an "App out of date" dialog [OBSERVED].
- A country-lookup endpoint [OBSERVED]. Probably used to decide on consent and ads [INFERRED].
- Cards are PNG images embedded in one CSS file: 54 data-URI images, about 188 KB. Cards are drawn with DOM and CSS, not canvas [OBSERVED / INFERRED].
- The board has a fixed width of 700 px, with breakpoints at 350, 374, 730, 975 and 1115 px, plus a short-landscape rule [OBSERVED].
- There's a PWA manifest per game (standalone, portrait, green theme) but no service worker, so nothing works offline [OBSERVED].
- Randomness comes from `Math.random`. There's no seed, so a deal can't be replayed [OBSERVED].

## Multiplayer (it exists, and it's extensive) [OBSERVED]
- socket.io to a separate multiplayer service on the operator's own domain (dev and staging hosts are visible in the bundle).
- Lobby with public tables, private tables with a code or link, and challenges you can send, accept, decline or cancel. Bots can be added to or removed from a table. Rematch, concede, and a per-turn timer that one player can ask to switch off.
- Moves are sent one by one, plus a `sync-moves` resync. The game logic is move-based (NewGame, StartGame, PlayCard, EndGame …), so the game is probably replayed from a move log [INFERRED].
- Elo ratings and leaderboards.
- Players can talk only through canned phrases and emoji, with no free chat. There are about 30 phrases and 20 emoji. Players can block, mute and favourite each other, and change their display name.
- One way to stand out: free chat moderation and friend lists are both absent, so community features could set Pips apart.

## Single-player [OBSERVED]
- Three named computer opponents with SVG faces in happy and sad versions. A "Customize opponents" option exists.
- Options:
  - Game speed, 5 levels from very slow to very fast.
  - Spread cards.
  - Dark theme.
  - Photosensitive mode.
  - Holiday themes.
  - Confetti.
  - Hide the Multiplayer button.
  - Opt in to interstitial ads.
- Missing: difficulty levels, undo, hints, muggins, stinkhole, seeded or daily deals, replays (searched the bundle; none found).
- The error-report form offers "The game is rigged" as an issue type. Players clearly suspect the computer, as noted on the homepage.

## Ads and consent [OBSERVED]
- An ad-management network (ad containers and side rails, including a video slot on the right rail).
- Preconnects to Amazon ad system, Quantcast, Blockthrough (ad-block recovery) and Confiant (ad quality) [OBSERVED hosts; vendor roles KNOWN, MED].
- OneTrust consent manager with IAB TCF v2.
- Google Tag Manager.
- Interstitial ads are an opt-in setting.

## Page weight in this capture [COMPUTED from HAR]
- 39 requests. First-party about 1.15 MB, OneTrust about 1.82 MB. The ad scripts were blocked in this capture (status 0), so a normal load weighs more.
- Their consent banner alone outweighs their game.

## SEO [OBSERVED]
- `hreflang` for 10 languages plus `x-default`, a canonical URL, Open Graph `og:type=game`, and Twitter card meta.
- The meta description follows the pattern "Play the classic card game X online for free. No download required."
- The rules article sits under the game as H2 "Cribbage Rules" with H3 sections (Objective, The Deal, The Play, Scoring during The Play, The Show, The Show Scoring).

## What this means for Pips
1. **Multiplayer isn't open territory.** They already have lobbies, Elo, private tables and bots. Pips needs to be better at it, not merely have it.
2. **Gaps that are real** (confirmed absent from their code):
   - Seeded and daily deals.
   - Replays.
   - Undo and hints.
   - Difficulty levels.
   - Rule variants.
   - Offline play.
   - Free-form social features.
3. **Performance:** a fixed 700 px board, jQuery and a heavy ad and consent stack. Pips can beat them on speed and phone layout.
4. **Things to copy as ideas:**
   - Options for speed, dark theme, photosensitive mode and confetti.
   - Named opponents with moods.
   - A move-log architecture, which multiplayer, replays and bug reports all need.
   - Versioned asset paths with an update prompt.
