import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { About } from './About';
import { Briefing } from './Briefing';
import { Collection } from './Collection';
import { DisguisePanel } from './DisguisePanel';
import { ItemSearch } from './ItemSearch';
import { MapView } from './MapView';
import { GAME_NAMES, MAP_GROUPS, floorLabel, layerOf, loadIndex, loadMap, type Layer } from './data';
import { saveForOffline } from './offline';
import { useStored } from './store';
import type { Disguise, Index, MapData, MapNode, Variant } from './types';

const LAYERS: { id: Layer; label: string; icon: string }[] = [
  { id: 'spawn', label: 'Starting locations', icon: 'starting-location' },
  { id: 'freelancer', label: 'Freelancer items (hideout)', icon: 'firearm' },
  { id: 'stash', label: 'Stashes & safes (possible spots)', icon: 'freelancer-item' },
  { id: 'map', label: 'Map-only items', icon: 'propane-flask' },
  { id: 'disguise', label: 'Disguise pickups', icon: 'disguise' },
  { id: 'exit', label: 'Exits', icon: 'exit-location' },
  { id: 'supplier', label: 'Suppliers', icon: 'supplier' },
];

type Tab = 'map' | 'collection';

function allSources(index: Index) {
  const urls = new Set<string>(index.collection.sources);
  for (const r of [...index.hideout.rules, ...(index.hideout.stashAndSafes ? [index.hideout.stashAndSafes] : [])]) r.sources.forEach((s) => urls.add(s));
  for (const map of Object.values(index.disguiseInfo)) for (const d of Object.values(map)) d.sources.forEach((s) => urls.add(s));
  for (const picks of Object.values(index.briefings)) for (const p of picks) p.sources.forEach((s) => urls.add(s));
  for (const list of Object.values(index.npcWeapons)) for (const w of list) w.sources.forEach((s) => urls.add(s));
  return [...urls].filter((u) => /^https?:\/\//.test(u));
}

/** URL hash: #map[/floor[/variant[/disguiseId]]] */
function parseHash() {
  const [map, floor, variant, disguise] = decodeURIComponent(location.hash.slice(1)).split('/');
  return {
    map: map || null,
    floor: floor !== undefined && floor !== '' && !isNaN(+floor) ? +floor : null,
    variant: variant === 'alerted' || variant === 'standard' ? (variant as Variant) : null,
    disguise: disguise ? +disguise : null,
  };
}

export default function App() {
  const initial = useRef(parseHash());
  const pending = useRef<{ floor: number | null; disguise: number | null; item: string | null }>({
    floor: initial.current.floor,
    disguise: initial.current.disguise,
    item: null,
  });
  const [index, setIndex] = useState<Index | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapId, setMapId] = useState(initial.current.map ?? 'paris');
  const [data, setData] = useState<MapData | null>(null);
  const [variant, setVariant] = useState<Variant>(initial.current.variant ?? 'standard');
  const [floor, setFloor] = useState(0);
  const [layers, setLayers] = useStored<Record<Layer, boolean>>('mm.layers', {
    spawn: true, freelancer: true, stash: true, map: false, disguise: false, exit: false, supplier: false,
  });
  const [groups, setGroups] = useState(() => new Set(MAP_GROUPS.map((g) => g.id)));
  const [ghost, setGhost] = useStored('mm.ghost', false);
  const [disguise, setDisguise] = useState<Disguise | null>(null);
  const [item, setItem] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapNode | null>(null);
  const [tab, setTab] = useState<Tab>('map');
  const [about, setAbout] = useState(false);
  const [panel, setPanel] = useState(() => innerWidth > 760);
  const [copied, setCopied] = useState(false);
  const [offline, setOffline] = useState<string | null>(null);

  useEffect(() => {
    loadIndex().then(setIndex, (e) => setError(String(e)));
    const onHash = () => {
      const h = parseHash();
      if (!h.map) return;
      pending.current = { floor: h.floor, disguise: h.disguise, item: null };
      if (h.variant) setVariant(h.variant);
      setMapId(h.map);
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  const meta = index?.maps.find((m) => m.id === mapId) ?? index?.maps[0];

  useEffect(() => {
    if (!meta) return;
    setData(null);
    setDisguise(null);
    setFocus(null);
    setItem(pending.current.item);
    setFloor(pending.current.floor ?? meta.startingFloor);
    loadMap(meta.id).then(setData, (e) => setError(String(e)));
  }, [meta]);

  useEffect(() => {
    if (!data || data.mapId !== meta?.id) return;
    const p = pending.current;
    if (p.disguise) setDisguise(data.disguises.find((d) => d.id === p.disguise) ?? null);
    if (p.item) {
      const first = data.nodes.find((n) => n.name === p.item && n[variant]);
      if (first && p.floor === null) setFloor(first.level);
    }
    pending.current = { floor: null, disguise: null, item: null };
  }, [data, meta, variant]);

  useEffect(() => {
    if (!meta || !data || data.mapId !== meta.id) return;
    history.replaceState(null, '', `#${meta.id}/${floor}/${variant}${disguise ? `/${disguise.id}` : ''}`);
  }, [meta, data, floor, variant, disguise]);

  const classified = useMemo(() => {
    if (!data || !index) return [];
    return data.nodes
      .filter((n) => n[variant])
      .map((n) => ({ n, layer: layerOf(n, index.hideout) }))
      .filter((x): x is { n: MapNode; layer: Layer } => x.layer !== null);
  }, [data, index, variant]);

  const visible = useMemo(() => {
    if (item) return classified.filter(({ n }) => n.name === item).map((x) => x.n);
    return classified
      .filter(({ n, layer }) => {
        if (disguise && layer === 'disguise' && n.name === disguise.name) return true;
        if (!layers[layer]) return false;
        return layer !== 'map' || groups.has(n.group);
      })
      .map((x) => x.n);
  }, [classified, layers, groups, disguise, item]);

  const highlight = useMemo(() => {
    if (item) return new Set(visible.map((n) => n.id));
    return new Set(disguise ? visible.filter((n) => n.group === 'Disguise' && n.name === disguise.name).map((n) => n.id) : []);
  }, [visible, disguise, item]);

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

  const groupCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const { n, layer } of classified) if (layer === 'map') c[n.group] = (c[n.group] ?? 0) + 1;
    return c;
  }, [classified]);

  const loot = useMemo(() => {
    if (!index) return [];
    const byName = new Map<string, { name: string; icon: string; rarity: string; count: number }>();
    for (const { n, layer } of classified) {
      if (layer !== 'freelancer') continue;
      const e = byName.get(n.name) ?? { name: n.name, icon: n.icon, rarity: index.hideout.rarity[n.name], count: 0 };
      e.count++;
      byName.set(n.name, e);
    }
    return [...byName.values()];
  }, [classified, index]);

  const areaNodes = useMemo(() => data?.nodes.filter((n) => n.group === 'Area' && n[variant]) ?? [], [data, variant]);

  const pickups = useMemo(() => classified.filter((x) => x.layer === 'disguise').map((x) => x.n), [classified]);

  const focusNode = useCallback((n: MapNode) => {
    setFloor(n.level);
    setFocus({ ...n });
  }, []);

  const findItem = (name: string, id: string) => {
    setTab('map');
    if (innerWidth <= 760) setPanel(false);
    if (id === meta?.id) {
      setDisguise(null);
      setItem(name);
      const first = classified.find(({ n }) => n.name === name);
      if (first && !classified.some(({ n }) => n.name === name && n.level === floor)) setFloor(first.n.level);
      return;
    }
    pending.current = { floor: null, disguise: null, item: name };
    setMapId(id);
  };

  const selectDisguiseByName = (name: string) => {
    const d = data?.disguises.find((x) => x.name === name);
    if (d) {
      setItem(null);
      setDisguise(d);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt('Copy this link:', location.href);
    }
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
          <nav className="tabs">
            {(['map', 'collection'] as Tab[]).map((t) => (
              <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
                {t === 'map' ? 'Map' : 'Collection'}
              </button>
            ))}
          </nav>
        </header>

        {tab === 'collection' && <Collection data={index.collection} items={index.items} maps={index.maps} onFind={findItem} />}

        {tab === 'map' && (
          <>
            <section>
              <label className="field">
                <span>Map</span>
                <select value={meta.id} onChange={(e) => { pending.current = { floor: null, disguise: null, item: null }; setMapId(e.target.value); }}>
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
              <ItemSearch items={index.items} maps={index.maps} currentMap={meta.id} rarity={index.hideout.rarity} onFind={findItem} />
            </section>

            <section>
              <h3>Layers</h3>
              {LAYERS.map((l) => (
                <div key={l.id}>
                  <label className="toggle">
                    <input type="checkbox" checked={layers[l.id]} onChange={(e) => setLayers({ ...layers, [l.id]: e.target.checked })} />
                    <img src={`icons/${l.icon}.png`} alt="" />
                    <span>{l.label}</span>
                    <span className="count">{layerCounts[l.id] ?? 0}</span>
                  </label>
                  {l.id === 'map' && layers.map && (
                    <div className="sublayers">
                      <div className="sublayers-head">
                        <span>Item types</span>
                        <button className="link" onClick={() => setGroups(new Set(MAP_GROUPS.map((g) => g.id)))}>All</button>
                        <button className="link" onClick={() => setGroups(new Set())}>None</button>
                      </div>
                      {MAP_GROUPS.map((g) => (
                        <label key={g.id} className="toggle sub">
                          <input
                            type="checkbox"
                            checked={groups.has(g.id)}
                            onChange={() => {
                              const next = new Set(groups);
                              if (next.has(g.id)) next.delete(g.id);
                              else next.add(g.id);
                              setGroups(next);
                            }}
                          />
                          <img src={`icons/${g.icon}.png`} alt="" />
                          <span>{g.label}</span>
                          <span className="count">{groupCounts[g.id] ?? 0}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <label className="toggle option">
                <input type="checkbox" checked={ghost} onChange={(e) => setGhost(e.target.checked)} />
                <span className="ghost-swatch">▲▼</span>
                <span>Show other floors (faded)</span>
                <span />
              </label>
            </section>

            {data && (
              <Briefing
                picks={index.briefings[meta.id] ?? []}
                npcWeapons={index.npcWeapons[meta.id] ?? []}
                loot={loot}
                onDisguise={selectDisguiseByName}
                onItem={(name) => findItem(name, meta.id)}
                areas={areaNodes}
                floor={floor}
                onFocus={focusNode}
              />
            )}

            {data && (
              <DisguisePanel
                disguises={data.disguises}
                info={index.disguiseInfo[meta.id] ?? {}}
                pickups={pickups}
                selected={disguise}
                onSelect={(d) => { setItem(null); setDisguise(d); }}
                onFocus={focusNode}
                areas={areaNodes}
                floor={floor}
              />
            )}
          </>
        )}

        <footer className="muted small">
          Unofficial fan project. Map and item data from HITMAPS (snapshot {index.snapshotDate}).
          HITMAN and its assets © IO Interactive.{' '}
          <button className="link" onClick={() => setAbout(true)}>Full credits</button>
          <div className="offline">
            <button className="link" disabled={!!offline && !offline.startsWith('Saved')} onClick={() => saveForOffline(index, setOffline)}>
              Save all maps for offline use
            </button>
            {offline && <span> · {offline}</span>}
          </div>
        </footer>
      </aside>

      <main className="stage">
        <button className="panel-toggle" onClick={() => setPanel(!panel)} aria-label="Toggle panel">
          {panel ? '‹' : '›'}
        </button>
        {data ? (
          <MapView
            meta={meta}
            floor={floor}
            nodes={visible}
            areas={disguise?.areas ?? []}
            highlight={highlight}
            focus={focus}
            rarity={index.hideout.rarity}
            ghost={ghost}
            onJump={focusNode}
          />
        ) : (
          <div className="splash">Loading {meta.destination}…</div>
        )}
        <div className="map-title">
          <div>{meta.destination}</div>
          <small>{meta.mission} · {variant === 'standard' ? 'Freelancer – Standard' : 'Freelancer – Alerted'}</small>
          <button className="link small share" onClick={copyLink}>{copied ? 'Link copied' : 'Copy link to this view'}</button>
        </div>
        {item && (
          <div className="item-banner">
            Showing <b>{item}</b> ({visible.length} on this map)
            <button className="link" onClick={() => setItem(null)} aria-label="Clear item filter">✕</button>
          </div>
        )}
        <nav className="floors" aria-label="Floors">
          {[...meta.floors].reverse().map((f) => (
            <button key={f} className={f === floor ? 'active' : ''} onClick={() => setFloor(f)} title={floorLabel(f)}>
              <span>{f}</span>
              {floorCounts.get(f) ? <small>{floorCounts.get(f)}</small> : null}
            </button>
          ))}
        </nav>
      </main>

      {about && <About snapshotDate={index.snapshotDate} hideout={index.hideout} sources={allSources(index)} onClose={() => setAbout(false)} />}
    </div>
  );
}
