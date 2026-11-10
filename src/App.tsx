import { useEffect, useMemo, useState } from 'react';
import { About } from './About';
import { DisguisePanel } from './DisguisePanel';
import { MapView } from './MapView';
import { GAME_NAMES, MAP_GROUPS, floorLabel, layerOf, loadIndex, loadMap, type Layer } from './data';
import type { Disguise, Index, MapData, MapNode, Variant } from './types';

const LAYERS: { id: Layer; label: string; icon: string }[] = [
  { id: 'spawn', label: 'Starting locations', icon: 'starting-location' },
  { id: 'freelancer', label: 'Freelancer items (hideout)', icon: 'firearm' },
  { id: 'stash', label: 'Stashes & safes', icon: 'freelancer-item' },
  { id: 'map', label: 'Map-only items', icon: 'propane-flask' },
  { id: 'disguise', label: 'Disguise pickups', icon: 'disguise' },
];

export default function App() {
  const [index, setIndex] = useState<Index | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapId, setMapId] = useState(() => decodeURIComponent(location.hash.slice(1)) || 'paris');
  const [data, setData] = useState<MapData | null>(null);
  const [variant, setVariant] = useState<Variant>('standard');
  const [floor, setFloor] = useState(0);
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ spawn: true, freelancer: true, stash: true, map: false, disguise: false });
  const [groups, setGroups] = useState(() => new Set(MAP_GROUPS.map((g) => g.id)));
  const [disguise, setDisguise] = useState<Disguise | null>(null);
  const [focus, setFocus] = useState<MapNode | null>(null);
  const [about, setAbout] = useState(false);
  const [panel, setPanel] = useState(() => innerWidth > 760);

  useEffect(() => {
    loadIndex().then(setIndex, (e) => setError(String(e)));
    const onHash = () => setMapId(decodeURIComponent(location.hash.slice(1)));
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  const meta = index?.maps.find((m) => m.id === mapId) ?? index?.maps[0];

  useEffect(() => {
    if (!meta) return;
    history.replaceState(null, '', `#${meta.id}`);
    setData(null);
    setDisguise(null);
    setFocus(null);
    setFloor(meta.startingFloor);
    loadMap(meta.id).then(setData, (e) => setError(String(e)));
  }, [meta]);

  const classified = useMemo(() => {
    if (!data || !index) return [];
    return data.nodes
      .filter((n) => n[variant])
      .map((n) => ({ n, layer: layerOf(n, index.hideout) }))
      .filter((x): x is { n: MapNode; layer: Layer } => x.layer !== null);
  }, [data, index, variant]);

  const visible = useMemo(
    () => classified
      .filter(({ n, layer }) => {
        if (disguise && layer === 'disguise' && n.name === disguise.name) return true;
        if (!layers[layer]) return false;
        return layer !== 'map' || groups.has(n.group);
      })
      .map((x) => x.n),
    [classified, layers, groups, disguise],
  );

  const highlight = useMemo(
    () => new Set(disguise ? visible.filter((n) => n.group === 'Disguise' && n.name === disguise.name).map((n) => n.id) : []),
    [visible, disguise],
  );

  const floorCounts = useMemo(() => {
    const c = new Map<number, number>();
    for (const n of visible) c.set(n.level, (c.get(n.level) ?? 0) + 1);
    return c;
  }, [visible]);

  const layerCounts = useMemo(() => {
    const c: Partial<Record<Layer, number>> = {};
    for (const { layer } of classified) c[layer] = (c[layer] ?? 0) + 1;
    return c;
  }, [classified]);

  const pickups = useMemo(() => classified.filter((x) => x.layer === 'disguise').map((x) => x.n), [classified]);

  const focusNode = (n: MapNode) => {
    setFloor(n.level);
    setFocus({ ...n });
  };

  if (error) return <div className="splash">Could not load data: {error}</div>;
  if (!index || !meta) return <div className="splash">Loading…</div>;

  const games = Object.keys(GAME_NAMES) as (keyof typeof GAME_NAMES)[];

  return (
    <div className={`app ${panel ? '' : 'panel-closed'}`}>
      <aside className="panel">
        <header>
          <div className="brand">
            <img className="logo" src="favicon.svg" alt="" />
            <div>
              <div className="title">Merces Map</div>
              <button className="link small" onClick={() => setAbout(true)}>About & sources</button>
            </div>
          </div>
        </header>

        <section>
          <label className="field">
            <span>Map</span>
            <select value={meta.id} onChange={(e) => setMapId(e.target.value)}>
              {games.map((g) => (
                <optgroup key={g} label={GAME_NAMES[g]}>
                  {index.maps.filter((m) => m.game === g).map((m) => (
                    <option key={m.id} value={m.id}>{m.destination} — {m.mission}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="segmented" role="group" aria-label="Freelancer variant">
            {(['standard', 'alerted'] as Variant[]).map((v) => (
              <button key={v} className={variant === v ? 'active' : ''} onClick={() => setVariant(v)}>
                {v === 'standard' ? 'Standard' : 'Alerted'}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>Layers</h3>
          {LAYERS.map((l) => (
            <label key={l.id} className="toggle">
              <input type="checkbox" checked={layers[l.id]} onChange={(e) => setLayers({ ...layers, [l.id]: e.target.checked })} />
              <img src={`icons/${l.icon}.png`} alt="" />
              <span>{l.label}</span>
              <span className="count">{layerCounts[l.id] ?? 0}</span>
            </label>
          ))}
          {layers.map && (
            <div className="chips">
              {MAP_GROUPS.map((g) => (
                <button
                  key={g.id}
                  className={`chip ${groups.has(g.id) ? 'active' : ''}`}
                  onClick={() => {
                    const next = new Set(groups);
                    if (next.has(g.id)) next.delete(g.id);
                    else next.add(g.id);
                    setGroups(next);
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </section>

        {data && (
          <DisguisePanel
            disguises={data.disguises}
            info={index.disguiseInfo[meta.id] ?? {}}
            pickups={pickups}
            selected={disguise}
            onSelect={setDisguise}
            onFocus={focusNode}
          />
        )}

        <footer className="muted small">
          Unofficial fan project. Map and item data from{' '}
          <a href={meta.source} target="_blank" rel="noreferrer">HITMAPS</a> (snapshot {index.snapshotDate}).
          HITMAN and its assets © IO Interactive.{' '}
          <button className="link" onClick={() => setAbout(true)}>Full credits</button>
        </footer>
      </aside>

      <main className="stage">
        <button className="panel-toggle" onClick={() => setPanel(!panel)} aria-label="Toggle panel">
          {panel ? '‹' : '›'}
        </button>
        {data ? (
          <MapView meta={meta} floor={floor} nodes={visible} areas={disguise?.areas ?? []} highlight={highlight} focus={focus} rarity={index.hideout.rarity} />
        ) : (
          <div className="splash">Loading {meta.destination}…</div>
        )}
        <div className="map-title">
          <div>{meta.destination}</div>
          <small>{meta.mission} · {variant === 'standard' ? 'Freelancer – Standard' : 'Freelancer – Alerted'}</small>
        </div>
        <nav className="floors" aria-label="Floors">
          {[...meta.floors].reverse().map((f) => (
            <button key={f} className={f === floor ? 'active' : ''} onClick={() => setFloor(f)} title={floorLabel(f)}>
              <span>{f}</span>
              {floorCounts.get(f) ? <small>{floorCounts.get(f)}</small> : null}
            </button>
          ))}
        </nav>
      </main>

      {about && <About snapshotDate={index.snapshotDate} hideout={index.hideout} onClose={() => setAbout(false)} />}
    </div>
  );
}
