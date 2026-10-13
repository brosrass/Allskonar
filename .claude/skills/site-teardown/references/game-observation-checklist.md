# Game observation checklist

Fill one copy per game. Tag every answer `[OBSERVED]`, `[INFERRED]` or `[DESIGN]`.

## Identity
- Game name / URL slug / page title pattern
- Players: total seats, human seats, AI seats, partnerships
- Online multiplayer? (room codes, invites, matchmaking, chat)

## Rules variant
- Deck(s): size, jokers, removed ranks
- Deal: count, direction, passing phase (e.g. Hearts pass left/right/across/hold)
- Bidding / trump / scoring rules and end condition (target score, rounds)
- House-rule toggles exposed in settings
- Cross-check against a neutral rules source; note every deviation

## State machine
- Phases in order (deal → pass → play → trick end → hand end → game end)
- What input is legal in each phase; how illegal moves are signalled
- Undo? Hints? Auto-play of forced moves? Auto-complete in solitaire?

## AI
- Difficulty levels (if any) and visible differences
- Bidding behaviour (over/under-bids? nil bids?)
- Play heuristics noticed (dumps high cards early, voids suits, counts cards?)
- Think delay per move (ms) — feels human or instant?

## Interaction
- Click vs drag vs both; double-click shortcuts
- Card selection affordance (lift, highlight, outline)
- Keyboard support; touch targets on mobile
- Sort order of the hand; can the user re-sort?

## Feedback & animation
- Deal animation (stagger ms, path), card flip, trick sweep, score tally
- Sounds (which events) and mute toggle
- Win / lose screens, confetti, statistics popups

## Persistence
- Stats tracked (games played, win %, streaks, best time)
- Where stored (localStorage key names visible in DevTools → Application)
- Resume an unfinished game after reload?

## Shell around the game
- Header / game menu / settings / rules panel / language switch
- Ad slots: position, size, how they behave on mobile
- Rules text below the table (length, headings) — for SEO pattern only, never copy

## Differentiation notes
- What feels dated, slow or annoying
- What we would do differently
