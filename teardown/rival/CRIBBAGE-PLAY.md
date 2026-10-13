# Rival Cribbage: play-through (recording 1)

Source: the user's 25.8 s screen recording (1920×928, VP9), 2026-10-13. It covers start → cut for deal → deal → discard → cut for starter → first two pegging plays.
Frames were reviewed at 2 fps, so timings are ±0.5 s.
Tags: [OBSERVED] seen in frames · [COMPUTED] from timestamps · [INFERRED] deduced.

## Sequence and timing

| t (s) | What happens | Tag |
|---|---|---|
| 0–3.5 | Idle start screen. A single face-down deck sits in the centre with a **Start** button; a yellow message box reads "click Start". the bot's avatar is at the top, yours at the bottom, plus a Multiplayer button. Peg board on the right with a the bot/You score table. | OBSERVED |
| 4.0 | Start spreads the whole deck face down in a long fan. The message asks you to pick a card; the lowest card deals. | OBSERVED |
| 5.5 | You click a card from the fan. It flips (J♦) and moves to your side. | OBSERVED |
| 6.5 | About 1 s later the bot draws (2♣). The message announces the result and that the bot deals. A DEALER hat appears on the bot's avatar. | OBSERVED / COMPUTED |
| 8.5–12.0 | The deck gathers up and deals alternately, one card at a time. 12 cards in about 3 s, roughly 250 ms per card. Your hand fans face up as it arrives. | COMPUTED |
| 12.5 | Hand sorted by rank (A 2 4 Q K K). The message tells you to pick 2 cards for the crib and click **Send to Crib**. The button stays disabled until 2 cards are picked. A "<BOT>'S CRIB" slot appears beside the dealer. | OBSERVED |
| 13–14 | The bot puts his two crib cards in straight away, while you are still choosing. | OBSERVED |
| 14.5 | After one pick, the message changes to "select one more card". Selected cards lift up. | OBSERVED |
| 15–17.5 | After the second pick, the message points at the Send to Crib button. Both cards fly to the bot's crib. | OBSERVED |
| 18–21.5 | The deck spreads again. **You pick the cut**: click a point in the fan and the deck splits there. | OBSERVED |
| 22.0 | The starter (A♣) turns face up on a small stack to the left. The message says it's your turn to lead. | OBSERVED |
| 23.6 | You play K♥. It slides to the centre pile and a large "10" appears beside the pile. Your avatar gets a speech bubble saying "10", and the message reads "You play ♥K, total value is 10." | OBSERVED |
| 25.0 | About 1.4 s later the bot plays 7♦. His bubble says "17", the pile count changes to 17, and the message narrates it. | COMPUTED |

## Interaction patterns
- **The player does the physical rituals**: picking a card for the deal, and cutting the deck by clicking a point in a spread fan. Pips currently does both automatically [OBSERVED].
- **The message box narrates every step**, including partial progress ("one more card"). It's a built-in tutorial [OBSERVED].
- **The count is shown three ways**: a large number by the pile, a speech bubble from whoever played, and the message text [OBSERVED].
- **The computer's moves**: about 1 s for its deal draw and about 1.4 s for a pegging reply. It discards while you're still thinking [COMPUTED / OBSERVED].
- **Layout**: the table is about 700 px wide, centred, with wide empty side margins at 1920 px. The ad rails were empty in this capture [OBSERVED]. Probably the ads were blocked or consent was declined [INFERRED].
- Time to the first pegging play: about 23 s, about 19 s of it after pressing Start. Most of that is ceremony: the deal draw, deal animation and cut [COMPUTED].

## Ideas for Pips [INFERRED]
1. **Pips the mascot narrates.** A speech bubble with the running count ("15 for 2!") instead of a separate message bar. One voice for both tutorial and commentary.
2. **The ceremony is optional, not skipped.** Tap to cut, with an "auto-cut" setting for speed; the deal animation lasts under 1.5 s.
3. **Keep three count cues** (big number, bubble, log). They help beginners.
4. **The computer discards immediately** and replies in about 0.8–1.2 s. Pips uses 0.75 s; add a speed setting like theirs.
5. **Use the full width.** The table scales to the screen instead of sitting at a fixed 700 px.

## Not yet seen (need a longer recording)
- Go and 31 handling, pair/run call-outs, pegging animation on the board.
- The show: how hands are counted and displayed, and whether counting is manual or automatic.
- End of game, skunk screen, statistics popup, rematch.
