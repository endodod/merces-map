import type { HideoutRules, Index, MapData, MapNode } from './types';

export const GAME_NAMES = { hitman: 'HITMAN', hitman2: 'HITMAN 2', hitman3: 'HITMAN 3' } as const;

export type Layer = 'spawn' | 'freelancer' | 'stash' | 'map' | 'disguise';

export const MAP_GROUPS = [
  { id: 'Lethal Melee', label: 'Lethal melee' },
  { id: 'Non-Lethal Melee', label: 'Non-lethal melee' },
  { id: 'Explosive', label: 'Explosive' },
  { id: 'Poison', label: 'Poison' },
  { id: 'Distraction', label: 'Distraction' },
  { id: 'Firearm', label: 'Firearm' },
  { id: 'Ammo', label: 'Ammo' },
  { id: 'Misc Item', label: 'Keys & misc' },
];

async function json<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

export async function loadIndex(): Promise<Index> {
  const [maps, hideout, disguiseInfo] = await Promise.all([
    json<Pick<Index, 'snapshotDate' | 'maps'>>('data/maps.json'),
    json<HideoutRules>('data/hideout.json'),
    json<Index['disguiseInfo']>('data/disguise-info.json'),
  ]);
  return { ...maps, hideout, disguiseInfo };
}

export const loadMap = (id: string) => json<MapData>(`data/${id}.json`);

export function layerOf(n: MapNode, hideout: HideoutRules): Layer | null {
  if (n.group === 'Starting Location') return 'spawn';
  if (n.group === 'Stash' || n.group === 'Safe') return 'stash';
  if (n.group === 'Disguise') return 'disguise';
  if (n.type === 'Weapons and Tools' || n.group === 'Misc Item') return n.name in hideout.rarity ? 'freelancer' : 'map';
  return null;
}

export const floorLabel = (f: number) => `Level ${f}`;
