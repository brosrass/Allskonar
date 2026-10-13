// A two-lane cribbage board: 120 holes in four serpentine rows of 30
// (grouped in fives), a start area and a shared finish hole. Each player has
// a front peg (score) and a back peg (previous score), as on a real board.
const ROWS = 4;
const PER_ROW = 30;
const W = 340;
const ROW_H = 30;

function holeXY(score: number, lane: 0 | 1): [number, number] {
  if (score <= 0) return [8, 16 + lane * 10];
  if (score >= 121) return [W - 10, ROWS * ROW_H - 8];
  const h = score - 1;
  const row = Math.floor(h / PER_ROW);
  let col = h % PER_ROW;
  if (row % 2 === 1) col = PER_ROW - 1 - col;
  const x = 24 + col * 9.6 + Math.floor(col / 5) * 3;
  const y = 12 + row * ROW_H + lane * 10;
  return [x, y];
}

export function Board({ scores, backPegs, names }: { scores: [number, number]; backPegs: [number, number]; names: [string, string] }) {
  const holes = [];
  for (let s = 1; s <= 120; s++) {
    for (const lane of [0, 1] as const) {
      const [x, y] = holeXY(s, lane);
      holes.push(<circle key={`${s}-${lane}`} cx={x} cy={y} r={1.7} className="hole" />);
    }
  }
  const peg = (lane: 0 | 1, score: number, back: boolean) => {
    const [x, y] = holeXY(score, lane);
    return <circle cx={x} cy={y} r={back ? 3 : 3.8} className={`peg p${lane}${back ? ' back' : ''}`} style={{ transition: 'cx .5s, cy .5s' }} />;
  };
  return (
    <figure className="board">
      <svg viewBox={`0 0 ${W} ${ROWS * ROW_H + 4}`} role="img" aria-label={`Cribbage board: ${names[0]} ${scores[0]}, ${names[1]} ${scores[1]}`}>
        <rect x="1" y="1" width={W - 2} height={ROWS * ROW_H + 2} rx="10" className="wood" />
        {[0, 1, 2, 3].map((r) => (
          <text key={r} x={r % 2 ? W - 6 : 4} y={18 + r * ROW_H} className="rowmark" textAnchor={r % 2 ? 'end' : 'start'}>
            {r * 30 + (r % 2 ? 30 : 1)}
          </text>
        ))}
        {holes}
        <circle cx={W - 10} cy={ROWS * ROW_H - 8} r={4.5} className="hole finish" />
        {peg(0, backPegs[0], true)}
        {peg(1, backPegs[1], true)}
        {peg(0, scores[0], false)}
        {peg(1, scores[1], false)}
      </svg>
      <figcaption>
        <span className="who p0">{names[0]} <b>{scores[0]}</b></span>
        <span className="who p1">{names[1]} <b>{scores[1]}</b></span>
      </figcaption>
    </figure>
  );
}
