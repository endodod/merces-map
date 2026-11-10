import type { HideoutRules, Index, MapData, MapNode } from './types';

export const GAME_NAMES = { hitman: 'HITMAN', hitman2: 'HITMAN 2', hitman3: 'HITMAN 3' } as const;

export type Layer = 'spawn' | 'freelancer' | 'stash' | 'map' | 'disguise' | 'exit' | 'supplier';

export const MAP_GROUPS = [
  { id: 'Lethal Melee', label: 'Lethal melee', icon: 'lethal-melee' },
  { id: 'Non-Lethal Melee', label: 'Non-lethal melee', icon: 'non-lethal-melee' },
  { id: 'Explosive', label: 'Explosives', icon: 'explosive' },
  { id: 'Poison', label: 'Poisons', icon: 'poison' },
  { id: 'Distraction', label: 'Distractions', icon: 'distraction' },
  { id: 'Firearm', label: 'Firearms', icon: 'firearm' },
  { id: 'Ammo', label: 'Ammo', icon: 'ammo' },
  { id: 'Misc Item', label: 'Keys & misc', icon: 'key' },
];

export const RARITY_ORDER = ['Legendary', 'Epic', 'Rare', 'Common'];

async function json<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

export async function loadIndex(): Promise<Index> {
  const [maps, hideout, disguiseInfo, items, briefings, collection] = await Promise.all([
    json<Pick<Index, 'snapshotDate' | 'maps'>>('data/maps.json'),
    json<HideoutRules>('data/hideout.json'),
    json<Index['disguiseInfo']>('data/disguise-info.json'),
    json<Index['items']>('data/items.json'),
    json<Index['briefings']>('data/briefings.json'),
    json<Index['collection']>('data/collection.json'),
  ]);
  return { ...maps, hideout, disguiseInfo, items, briefings, collection };
}

export const loadMap = async (id: string): Promise<MapData> => ({ ...(await json<Omit<MapData, 'mapId'>>(`data/${id}.json`)), mapId: id });

export function layerOf(n: MapNode, hideout: HideoutRules): Layer | null {
  if (n.group === 'Starting Location') return 'spawn';
  if (n.group === 'Stash' || n.group === 'Safe') return 'stash';
  if (n.group === 'Disguise') return 'disguise';
  if (n.group === 'Exit Location') return 'exit';
  if (n.group === 'Supplier') return 'supplier';
  if (n.type === 'Weapons and Tools' || n.group === 'Misc Item') return n.name in hideout.rarity ? 'freelancer' : 'map';
  return null;
}

export const floorLabel = (f: number) => `Level ${f}`;

/** Loose name key so "Sawed-Off Bartoli 12G" and "Sawed Off Bartoli 12G" match. */
export const nameKey = (s: string) => s.toLowerCase().replace(/-/g, ' ').replace(/[^a-z0-9/]/g, '');
