export type LatLng = [number, number];
export type Variant = 'standard' | 'alerted';

export interface MapMeta {
  id: string;
  game: 'hitman' | 'hitman2' | 'hitman3';
  destination: string;
  country: string;
  mission: string;
  mapFolder: string;
  floors: number[];
  startingFloor: number;
  center: LatLng;
  viewBounds: [LatLng, LatLng];
  imageBounds: [LatLng, LatLng];
  minZoom: number;
  maxZoom: number;
  source: string;
}

export interface Note {
  type: string;
  text: string;
}

export interface MapNode {
  id: number;
  type: string;
  group: string;
  icon: string;
  name: string;
  target: string | null;
  level: number;
  lat: number;
  lng: number;
  notes: Note[];
  quantity: number;
  standard: boolean;
  alerted: boolean;
}

export interface DisguiseArea {
  level: number;
  type: 'trespassing' | 'hostile';
  vertices: LatLng[];
}

export interface Disguise {
  id: number;
  name: string;
  image: string | null;
  suit: boolean;
  areas: DisguiseArea[];
}

export interface MapData {
  nodes: MapNode[];
  disguises: Disguise[];
}

export interface DisguiseInfo {
  wornBy: string | null;
  howToGet: string | null;
  freelancerNote: string | null;
  sources: string[];
}

export interface SourcedText {
  text: string;
  sources: string[];
}

export interface HideoutRules {
  rules: SourcedText[];
  stashAndSafes: SourcedText | null;
  rarity: Record<string, string>;
}

export interface Index {
  snapshotDate: string;
  maps: MapMeta[];
  hideout: HideoutRules;
  disguiseInfo: Record<string, Record<string, DisguiseInfo>>;
}
