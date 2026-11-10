import { useMemo, useState } from 'react';
import { RarityBadge } from './Briefing';
import type { ItemIndexEntry, MapMeta } from './types';

interface Props {
  items: ItemIndexEntry[];
  maps: MapMeta[];
  currentMap: string;
  rarity: Record<string, string>;
  onFind: (name: string, mapId: string) => void;
}

export function ItemSearch({ items, maps, currentMap, rarity, onFind }: Props) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return items.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 15);
  }, [items, query]);
  const mapName = (id: string) => maps.find((m) => m.id === id)?.destination ?? id;

  return (
    <div className="search">
      <input
        type="search"
        placeholder="Find an item on any map… (e.g. katana)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="results">
          {results.map((r) => {
            const ids = Object.keys(r.maps).sort((a, b) => (a === currentMap ? -1 : b === currentMap ? 1 : mapName(a).localeCompare(mapName(b))));
            return (
              <li key={r.name}>
                <div className="result-name">
                  <img src={`icons/${r.icon}.png`} alt="" /> {r.name}
                  {rarity[r.name] && <RarityBadge rarity={rarity[r.name]} />}
                </div>
                <div className="result-maps">
                  {ids.map((id) => (
                    <button key={id} className="link small" onClick={() => { onFind(r.name, id); setQuery(''); }}>
                      {mapName(id)}{r.maps[id] > 1 ? ` ×${r.maps[id]}` : ''}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {query.trim().length >= 2 && results.length === 0 && <p className="muted small">No item found.</p>}
    </div>
  );
}
