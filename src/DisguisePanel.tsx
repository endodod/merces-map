import { floorLabel } from './data';
import type { Disguise, DisguiseInfo, MapNode } from './types';

interface Props {
  disguises: Disguise[];
  info: Record<string, DisguiseInfo>;
  pickups: MapNode[];
  selected: Disguise | null;
  onSelect: (d: Disguise | null) => void;
  onFocus: (n: MapNode) => void;
}

function DisguiseCard({ d, info, pickups, onFocus }: { d: Disguise; info?: DisguiseInfo; pickups: MapNode[]; onFocus: Props['onFocus'] }) {
  const hasAreas = d.areas.some((a) => a.vertices.length >= 3);
  return (
    <div className="card">
      <div className="card-head">
        {d.image && <img src={d.image} alt="" />}
        <div>
          <div className="card-title">{d.name}</div>
          {d.suit && <div className="muted">47's own suit</div>}
        </div>
      </div>
      {info?.wornBy && <p><b>Worn by:</b> {info.wornBy}</p>}
      {info?.foundAt && <p><b>Found at:</b> {info.foundAt}</p>}
      {info?.howToGet && <p><b>How to get:</b> {info.howToGet}</p>}
      {info?.fastTip && <p><b>Fast tip:</b> {info.fastTip}</p>}
      {pickups.length > 0 && (
        <div>
          <b>Lying around ({pickups.length}):</b>
          <ul className="pickups">
            {pickups.map((p) => (
              <li key={p.id}>
                <button className="link" onClick={() => onFocus(p)}>
                  {floorLabel(p.level)}{p.notes.length ? ` — ${p.notes.map((x) => x.text).join(' ')}` : ''}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!d.suit && !info?.howToGet && !info?.fastTip && pickups.length === 0 && (
        <p className="muted">No specific tip found in sources. General method: subdue an NPC wearing it and take the outfit.</p>
      )}
      {info?.freelancerNote && <p className="warn">{info.freelancerNote}</p>}
      <div className="legend">
        {hasAreas ? (
          <>
            <span><i className="sw hostile" /> Hostile</span>
            <span><i className="sw trespass" /> Trespassing</span>
            <span><i className="sw free" /> Unmarked = allowed</span>
          </>
        ) : (
          <span className="muted">No restricted areas recorded for this disguise.</span>
        )}
      </div>
      {info && info.sources.length > 0 && (
        <div className="sources">
          Descriptions are based on main-mission guides; story targets and their scripted scenes are absent in Freelancer.<br />
          Sources: {info.sources.map((s, i) => <a key={s} href={s} target="_blank" rel="noreferrer">[{i + 1}]</a>)}
        </div>
      )}
    </div>
  );
}

export function DisguisePanel({ disguises, info, pickups, selected, onSelect, onFocus }: Props) {
  const npc = disguises.filter((d) => !d.suit);
  const suits = disguises.filter((d) => d.suit);
  const item = (d: Disguise) => (
    <button
      key={d.id}
      className={`disguise ${selected?.id === d.id ? 'active' : ''}`}
      onClick={() => onSelect(selected?.id === d.id ? null : d)}
      title={d.name}
    >
      {d.image ? <img src={d.image} alt="" loading="lazy" /> : <span className="noimg" />}
      <span>{d.name}</span>
    </button>
  );
  return (
    <section>
      <h3>Disguises <span className="muted">— select to show access</span></h3>
      {selected && (
        <DisguiseCard d={selected} info={info[selected.name]} pickups={pickups.filter((p) => p.name === selected.name)} onFocus={onFocus} />
      )}
      <div className="disguise-grid">{npc.map(item)}</div>
      {suits.length > 0 && (
        <>
          <h4 className="muted">47's suits</h4>
          <div className="disguise-grid">{suits.map(item)}</div>
        </>
      )}
    </section>
  );
}
