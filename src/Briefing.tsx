import { RARITY_ORDER } from './data';
import { Linked } from './Linked';
import type { BriefingPick, MapNode } from './types';

interface Props {
  picks: BriefingPick[];
  loot: { name: string; icon: string; rarity: string; count: number }[];
  onDisguise: (name: string) => void;
  onItem: (name: string) => void;
  areas: MapNode[];
  floor: number;
  onFocus: (n: MapNode) => void;
}

export const RarityBadge = ({ rarity }: { rarity: string }) => (
  <span className={`rarity r-${rarity.toLowerCase()}`}>{rarity}</span>
);

export function Briefing({ picks, loot, onDisguise, onItem, areas, floor, onFocus }: Props) {
  const L = (text: string) => <Linked text={text} areas={areas} floor={floor} onFocus={onFocus} />;
  // Common items (guard pistols, rifles, shotguns, ...) are on almost every map, so only Rare and up are listed.
  const sorted = loot
    .filter((l) => l.rarity !== 'Common')
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.name.localeCompare(b.name));
  const commonCount = loot.length - sorted.length;
  return (
    <section>
      <h3>Briefing</h3>
      <h4>Best disguises</h4>
      {picks.length === 0 && <p className="muted small">No sourced recommendation found for this map yet.</p>}
      <ul className="brief">
        {picks.map((p) => (
          <li key={p.disguise}>
            <button className="link strong" onClick={() => onDisguise(p.disguise)}>{p.disguise}</button>
            <span> — {L(p.why)}</span>
            {p.howToGet && <div className="muted small">How: {L(p.howToGet)}</div>}
          </li>
        ))}
      </ul>
      <h4>Bring back to the hideout</h4>
      {sorted.length === 0 && <p className="muted small">No Rare or better items on this map.</p>}
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
      {commonCount > 0 && (
        <p className="muted small">
          {commonCount} common item{commonCount > 1 ? 's' : ''} not listed (still shown on the map under Freelancer items).
        </p>
      )}
    </section>
  );
}
