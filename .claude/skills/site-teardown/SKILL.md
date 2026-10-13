---
name: site-teardown
description: Clean-room teardown of a browser-games website into an original build spec. Use when the user wants to "reverse engineer", "tear down", "analyse", "clone" or "make my own version of" a game site or a single game on it — captures pages with Playwright, documents information architecture, per-game rules/state machines, AI behaviour, UI layout, monetisation and tech stack, and writes a spec that can be built without copying the original's code, art or text.
---

# Site teardown (clean-room)

Goal: turn an existing game site into a **behavioural spec** you can build from
scratch. You study *what it does*, never *how its source is written*.

## Ground rules (non-negotiable)

1. **Observe, don't copy.** Game rules, layouts and UX patterns are ideas and
   can be re-implemented. Their JavaScript, card art, icons, sounds, rules
   text, name and logo are expression/branding and must not end up in the
   new build. Do not save, beautify or paste the target's JS/CSS source into
   the repo; the capture script stores only screenshots and *derived* facts.
2. **Write rules text yourself** from standard sources (Pagat.com, Hoyle-style
   rulebooks) — never paraphrase the target's rules pages line by line.
3. **Be polite to the server.** Respect `robots.txt`, keep the default
   delay (≥1.5 s between pages), cap pages (default 40). Read the site's
   terms of use before automated capture; if they forbid it, do the teardown
   manually in a normal browser instead.
4. **Separate facts from guesses.** Every spec line is tagged
   `[OBSERVED]` (seen in capture/play), `[INFERRED]` (deduced from behaviour)
   or `[DESIGN]` (our own decision for the new build).

## Workflow

### 1. Capture (automated)

```bash
node .claude/skills/site-teardown/scripts/capture.mjs https://example.com \
  --out teardown/example --max-pages 40 --delay 1500
```

Produces in `teardown/<site>/capture/`:
- `pages.json` – per page: URL, title, meta description, headings, nav links,
  canonical/hreflang, JSON-LD types, DOM stats (canvas/svg/img counts),
  colour + font frequency tables, third-party hosts by category.
- `screens/<slug>-desktop.png`, `screens/<slug>-mobile.png`
- `summary.md` – site map, top colours/fonts, third-party stack.

If the network blocks the host, say so and do **not** invent capture results.
Ask the user to capture in their own browser and upload instead:
- the page via Ctrl+S → "Webpage, Complete" (HTML plus scripts),
- a HAR via DevTools → Network → reload → "Save all as HAR",
- a short screen recording of a few hands.
Then run `python3 -I scripts/har_summary.py file.har --extract <scratch dir>`
on a copy in its own directory, and outline the HTML (ids, headings, options,
ad containers, hreflang/meta). Record facts in `teardown/<site>/`; keep
extracted bodies out of the repo.

### 2. Play-through (manual or Playwright-driven)

For each game worth cloning, play at least 3 full hands/rounds and fill in
`references/game-observation-checklist.md`. Record short screen captures if
animation timing matters. This is where most of the value is — the capture
script can't tell you how the AI bids in Spades.

### 3. Analyse

Write `teardown/<site>/SPEC.md` from `references/spec-template.md`:
1. Information architecture & URL scheme (from `pages.json`).
2. Game catalogue table: game, players, human vs AI seats, multiplayer?,
   priority for our build.
3. Per-game: rules variant, state machine, AI behaviour, settings, stats,
   win/lose screens, animation list.
4. Shared shell: header, game menu, settings, rules panel, ads, footer.
5. Tech stack & monetisation (from third-party hosts) — tagged `[INFERRED]`.
6. SEO pattern: one page per game, rules text under the table, hreflang.
7. Gaps & differentiation: what the target does badly, what we do instead.

### 4. Hand-off to build

End with a "Build order" section: shared card engine first (deck, shuffle
with seedable RNG, deal, trick resolution, drag/tap, animation queue), then
one solitaire (no AI) to prove the engine, then one trick-taking game with AI.

## Files

- `scripts/har_summary.py` – offline HAR reader for uploaded captures.
- `scripts/capture.mjs` – Playwright crawler (uses the globally installed
  `playwright`; set `PW_CHROMIUM` to override the browser path).
- `references/game-observation-checklist.md` – what to record per game.
- `references/spec-template.md` – skeleton for `SPEC.md`.
