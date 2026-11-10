import { useMemo } from 'react';
import type { MapNode } from './types';

const key = (name: string) => name.replace(/^the\s+/i, '').toLowerCase();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Renders text with every named map area (from HITMAPS "Area" markers) turned into a link to that spot. */
export function Linked({ text, areas, floor, onFocus }: { text: string; areas: MapNode[]; floor: number; onFocus: (n: MapNode) => void }) {
  const { byName, re } = useMemo(() => {
    const byName = new Map<string, MapNode[]>();
    for (const a of areas) {
      const k = key(a.name);
      if (k.length >= 3) byName.set(k, [...(byName.get(k) ?? []), a]);
    }
    const names = [...byName.keys()].sort((a, b) => b.length - a.length);
    return { byName, re: names.length ? new RegExp(`\\b(${names.map(escapeRe).join('|')})\\b`, 'gi') : null };
  }, [areas]);

  if (!re) return <>{text}</>;
  return (
    <>
      {text.split(re).map((part, i) => {
        const hits = i % 2 ? byName.get(part.toLowerCase()) : undefined;
        if (!hits) return part;
        const target = hits.find((h) => h.level === floor) ?? hits[0];
        return (
          <button key={i} className="link place" onClick={() => onFocus(target)} title={`Show ${target.name} on the map (level ${target.level})`}>
            {part}
          </button>
        );
      })}
    </>
  );
}
