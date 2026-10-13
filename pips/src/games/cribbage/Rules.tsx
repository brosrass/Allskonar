// Pips' own rules write-up. Written from the standard two-player game,
// not adapted from any other site's text.
export function CribbageRules() {
  return (
    <article className="rules">
      <h2>How to play Cribbage</h2>
      <p>
        Two players race to 121 points, scored by moving pegs along a board. Each deal has three stages: you build a
        hand and a crib, you play cards out one at a time, then you count what your cards are worth. The game ends the
        instant someone reaches 121, even halfway through a count.
      </p>

      <h3>Dealing and the crib</h3>
      <p>
        Each player gets six cards. You both put two of them face down into the <em>crib</em>, a bonus hand that
        belongs to the dealer and is counted last. The deal alternates, so the crib swaps owners every hand. Throw
        good cards in when it's your crib, and awkward ones when it isn't.
      </p>
      <p>
        Then the top card of the deck is turned over as the <em>starter</em>. It counts as part of both hands and the
        crib. If the starter is a jack, the dealer pegs 2 straight away (<em>his heels</em>).
      </p>

      <h3>The play</h3>
      <p>
        The non-dealer leads. Players take turns laying a card and calling the running total: face cards count 10,
        aces 1, everything else its number. The total may never pass 31. If you can't play without going over, you
        say <em>go</em>. Your opponent then keeps playing as long as they can, and the last player to lay a card
        scores 1 (or 2 for hitting exactly 31). The count then resets to zero.
      </p>
      <table>
        <caption>Points during the play</caption>
        <tbody>
          <tr><td>Bring the count to 15</td><td>2</td></tr>
          <tr><td>Bring the count to 31</td><td>2</td></tr>
          <tr><td>Pair the card just played</td><td>2</td></tr>
          <tr><td>Three of a kind in a row (pair royal)</td><td>6</td></tr>
          <tr><td>Four of a kind in a row</td><td>12</td></tr>
          <tr><td>Complete a run of 3 or more, in any order</td><td>1 per card</td></tr>
          <tr><td>Go, or the last card of the play</td><td>1</td></tr>
        </tbody>
      </table>

      <h3>The show</h3>
      <p>
        Each four-card hand is counted together with the starter. The non-dealer counts first, then the dealer's hand,
        then the crib. Counting first matters: in a close game the non-dealer can reach 121 before the dealer's
        cards are counted.
      </p>
      <table>
        <caption>Points in the show</caption>
        <tbody>
          <tr><td>Each combination of cards adding to 15</td><td>2</td></tr>
          <tr><td>Each pair</td><td>2</td></tr>
          <tr><td>Each run of 3 or more (duplicates make extra runs)</td><td>1 per card</td></tr>
          <tr><td>Four cards of one suit in the hand (not the crib)</td><td>4</td></tr>
          <tr><td>Five cards of one suit, starter included</td><td>5</td></tr>
          <tr><td>Jack of the starter's suit in hand (his nobs)</td><td>1</td></tr>
        </tbody>
      </table>
      <p>
        The highest possible hand is 29: three fives and the jack of the starter's suit, with the fourth five turned
        as the starter. A hand worth nothing is jokingly called <em>nineteen</em>, because 19 is a total you can't make.
      </p>

      <h3>Winning and skunks</h3>
      <p>
        First to 121 wins. If the loser hasn't reached 91 it's a <em>skunk</em>, and under 61 a <em>double skunk</em>.
        Pips keeps count of both in your stats.
      </p>
    </article>
  );
}
