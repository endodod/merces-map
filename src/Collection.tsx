import { useMemo, useState } from 'react';
import { RarityBadge } from './Briefing';
import { RARITY_ORDER, nameKey } from './data';
import { useStored } from './store';
import type { CollectionData, ItemIndexEntry, MapMeta } from './types';

interface Props {
  data: CollectionData;
  items: ItemIndexEntry[];
  maps: MapMeta[];
  onFind: (name: string, mapId: string) => void;
}

export function Collection({ data, items, maps, onFind }: Props) {
  const [owned, setOwned] = useStored<Record<string, boolean>>('mm.collection', {});
  const [show, setShow] = useState<'all' | 'missing' | 'owned'>('all');
  const [rarity, setRarity] = useState('');
  const [onMapsOnly, setOnMapsOnly] = useState(false);

  const byKey = useMemo(() => new Map(items.map((i) => [nameKey(i.name), i])), [items]);
  const mapName = (id: string) => maps.find((m) => m.id === id)?.destination ?? id;
  const total = data.groups.reduce((s, g) => s + g.items.length, 0);
  const done = data.groups.reduce((s, g) => s + g.items.filter((i) => owned[i.name]).length, 0);

  return (
    <section className="collection">
      <h3>Hideout collection</h3>
      <div className="progress"><div style={{ width: `${(done / total) * 100}%` }} /></div>
      <p className="small">{done} / {total} collected <span className="muted">(saved in this browser)</span></p>
      <div className="filters">
        <select value={show} onChange={(e) => setShow(e.target.value as typeof show)}>
          <option value="all">All items</option>
          <option value="missing">Missing</option>
          <option value="owned">Collected</option>
        </select>
        <select value={rarity} onChange={(e) => setRarity(e.target.value)}>
          <option value="">Any rarity</option>
          {RARITY_ORDER.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <label className="toggle-inline small">
        <input type="checkbox" checked={onMapsOnly} onChange={(e) => setOnMapsOnly(e.target.checked)} /> Only items lying on a map
      </label>

      {data.groups.map((g) => {
        const list = g.items.filter((i) =>
          (show === 'all' || (show === 'owned') === !!owned[i.name]) &&
          (!rarity || i.rarity === rarity) &&
          (!onMapsOnly || byKey.has(nameKey(i.name))));
        if (!list.length) return null;
        return (
          <div key={g.name} className="col-group">
            <h4>{g.name} <span className="muted">{g.items.filter((i) => owned[i.name]).length}/{g.items.length}</span></h4>
            <ul>
              {list.map((i) => {
                const found = byKey.get(nameKey(i.name));
                return (
                  <li key={i.name}>
                    <label>
                      <input type="checkbox" checked={!!owned[i.name]} onChange={(e) => setOwned({ ...owned, [i.name]: e.target.checked })} />
                      <span className={owned[i.name] ? 'owned' : ''}>{i.name}</span>
                      <RarityBadge rarity={i.rarity} />
                    </label>
                    {found && (
                      <div className="found-on small">
                        On map:{' '}
                        {Object.keys(found.maps).map((id) => (
                          <button key={id} className="link small" onClick={() => onFind(found.name, id)}>{mapName(id)}</button>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <p className="muted small">
        {data.basis}{' '}
        {data.sources.map((s, i) => <a key={s} href={s} target="_blank" rel="noreferrer">[{i + 1}]</a>)}
      </p>
      <button className="link small" onClick={() => confirm('Clear all collected marks?') && setOwned({})}>Reset checklist</button>
    </section>
  );
}
