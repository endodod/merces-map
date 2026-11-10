import { RARITY_ORDER } from './data';
import type { BriefingPick } from './types';

interface Props {
  picks: BriefingPick[];
  loot: { name: string; icon: string; rarity: string; count: number }[];
  onDisguise: (name: string) => void;
  onItem: (name: string) => void;
}

export const RarityBadge = ({ rarity }: { rarity: string }) => (
  <span className={`rarity r-${rarity.toLowerCase()}`}>{rarity}</span>
);

export function Briefing({ picks, loot, onDisguise, onItem }: Props) {
  const sorted = [...loot].sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.name.localeCompare(b.name));
  return (
    <section>
      <h3>Briefing</h3>
      <h4>Best disguises</h4>
      {picks.length === 0 && <p className="muted small">No sourced recommendation found for this map yet.</p>}
      <ul className="brief">
        {picks.map((p) => (
          <li key={p.disguise}>
            <button className="link strong" onClick={() => onDisguise(p.disguise)}>{p.disguise}</button>
            <span> — {p.why}</span>
            {p.howToGet && <div className="muted small">How: {p.howToGet}</div>}
            <span className="sources">
              {p.sources.map((s, i) => <a key={s} href={s} target="_blank" rel="noreferrer">[{i + 1}]</a>)}
            </span>
          </li>
        ))}
      </ul>
      <h4>Bring back to the hideout</h4>
      {sorted.length === 0 && <p className="muted small">No items with a rarity tier on this map.</p>}
      <ul className="loot">
        {sorted.map((l) => (
          <li key={l.name}>
            <button className="link" onClick={() => onItem(l.name)}>
              <img src={`icons/${l.icon}.png`} alt="" /> {l.name}
            </button>
            {l.count > 1 && <span className="muted"> ×{l.count}</span>}
            <RarityBadge rarity={l.rarity} />
          </li>
        ))}
      </ul>
    </section>
  );
}
