// Pips, the site's host: a round card-cream face wearing a gold crown whose
// four prongs end in a spade, a heart, a diamond and a clover leaf (the club).
// Original character; drawn as inline SVG so it scales from favicon to hero.
export type Mood = 'happy' | 'wink' | 'think' | 'sad' | 'cheer';

const INK = '#3a271d';

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'cheer') {
    return (
      <g fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round">
        <path d="M42 70 q6 -8 12 0" />
        <path d="M66 70 q6 -8 12 0" />
      </g>
    );
  }
  if (mood === 'wink') {
    return (
      <g>
        <ellipse cx="48" cy="68" rx="4.2" ry="6" fill={INK} />
        <circle cx="49.4" cy="65.6" r="1.4" fill="#fff" />
        <path d="M66 69 q6 5 12 0" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
      </g>
    );
  }
  const look = mood === 'think' ? 2.5 : 0;
  return (
    <g>
      {mood === 'sad' && (
        <g stroke={INK} strokeWidth="2.6" strokeLinecap="round">
          <path d="M41 61 l11 -4" />
          <path d="M79 61 l-11 -4" />
        </g>
      )}
      {mood === 'think' && <path d="M66 57 q7 -4 13 1" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />}
      <ellipse cx={48 + look} cy="68" rx="4.2" ry="6" fill={INK} />
      <ellipse cx={72 + look} cy="68" rx="4.2" ry="6" fill={INK} />
      <circle cx={49.4 + look} cy="65.6" r="1.4" fill="#fff" />
      <circle cx={73.4 + look} cy="65.6" r="1.4" fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  const p = { fill: 'none', stroke: INK, strokeWidth: 3.2, strokeLinecap: 'round' as const };
  switch (mood) {
    case 'cheer':
      return <path d="M47 82 q13 18 26 0 z" fill="#8a2a24" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />;
    case 'sad':
      return <path d="M50 90 q10 -8 20 0" {...p} />;
    case 'think':
      return <path d="M52 87 q6 -2 14 1" {...p} />;
    default:
      return <path d="M49 83 q11 11 22 0" {...p} />;
  }
}

export function PipsMascot({ mood = 'happy', size = 96, title }: { mood?: Mood; size?: number; title?: string }) {
  return (
    <svg className={`pips-mascot mood-${mood}`} width={size} height={size} viewBox="0 0 120 120" role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true} aria-label={title}>
      {/* crown */}
      <g stroke={INK} strokeWidth="2.6" strokeLinejoin="round">
        <path d="M30 44 L28 22 L42 34 L52 16 L60 32 L68 16 L78 34 L92 22 L90 44 Z" fill="#e3a940" />
        <rect x="29" y="38" width="62" height="8" rx="3" fill="#c98b26" />
      </g>
      {/* suit finials: spade, heart, diamond, clover leaf */}
      <g stroke={INK} strokeWidth="1.6" strokeLinejoin="round">
        <path d="M28 12 c-6 6 -8 9 -4 12 c2 1.5 3.4 .8 4 -.4 c.6 1.2 2 1.9 4 .4 c4 -3 2 -6 -4 -12 z M28 24 l-2 4 h4 z" fill="#2b211b" />
        <path d="M52 15 c-1.5 -3 -6.5 -3 -6.5 1.2 c0 3 4 5.4 6.5 8 c2.5 -2.6 6.5 -5 6.5 -8 c0 -4.2 -5 -4.2 -6.5 -1.2 z" fill="#d22e48" />
        <path d="M68 5 l5.5 8.5 l-5.5 8.5 l-5.5 -8.5 z" fill="#d22e48" />
        <g fill="#47703c">
          <circle cx="92" cy="12" r="3.6" />
          <circle cx="88.4" cy="17.4" r="3.6" />
          <circle cx="95.6" cy="17.4" r="3.6" />
          <path d="M92 18 q1 5 3 7" fill="none" stroke="#47703c" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </g>
      {/* face */}
      <circle cx="60" cy="74" r="36" fill="#f6ead6" stroke={INK} strokeWidth="3" />
      <ellipse cx="40" cy="81" rx="6.5" ry="4.2" fill="#d9776a" opacity=".55" />
      <ellipse cx="80" cy="81" rx="6.5" ry="4.2" fill="#d9776a" opacity=".55" />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {mood === 'think' && (
        <g fill={INK}>
          <circle cx="96" cy="96" r="2" /><circle cx="103" cy="92" r="2.6" /><circle cx="111" cy="86" r="3.2" />
        </g>
      )}
    </svg>
  );
}
