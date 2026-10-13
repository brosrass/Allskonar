# <Our project name> — build spec (clean-room)

Source studied: <site> on <date>. Tags: [OBSERVED] [INFERRED] [DESIGN].

## 1. Positioning
- Who it is for, and the one reason to pick it over the original. [DESIGN]

## 2. Information architecture
- URL scheme, e.g. `/hearts`, `/spades`, `/<lang>/<game>`.
- Navigation model (game grid, categories, search).
- Page anatomy: header · table · controls · rules article · footer.

## 3. Game catalogue

| Game | Seats (human/AI) | Multiplayer | Effort (S/M/L) | Priority |
|---|---|---|---|---|

## 4. Shared engine
- Card model, deck builder, seeded RNG (fairness + replays + bug reports)
- Layout zones (hand, pile, tableau, foundation, trick area)
- Input layer (tap, drag, keyboard), animation queue, sound bus
- Persistence: settings, stats, resume

## 5. Per-game sections
For each game: rules variant · state machine (diagram) · AI · settings ·
stats · animation list · edge cases. Use the observation checklist as input.

## 6. Visual identity [DESIGN]
- Chosen art direction, tokens (colours, type), card face/back specs,
  minimum readable card width on mobile, colour-blind suit strategy.

## 7. Monetisation & tech
- What the original does [INFERRED from capture] and what we do. [DESIGN]

## 8. Gaps & differentiation

## 9. Build order
1. Engine + one solitaire (no AI)
2. One trick-taking game with AI
3. Shell, stats, settings, i18n
4. Further games by priority
