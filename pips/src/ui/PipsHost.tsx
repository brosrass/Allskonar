import { PipsMascot, type Mood } from './PipsMascot';

// Pips at the table: the mascot with a speech bubble that narrates play.
export function PipsHost({ text, mood }: { text: string; mood: Mood }) {
  return (
    <div className="host">
      <PipsMascot mood={mood} size={56} />
      <p className="bubble" aria-live="polite" key={text}>{text}</p>
    </div>
  );
}
