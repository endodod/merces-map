import { loadMap } from './data';
import type { Index } from './types';

/**
 * Downloads every map's data, floor SVGs, icons and disguise portraits once so the
 * service worker (public/sw.js) can serve them without a connection.
 */
export async function saveForOffline(index: Index, report: (status: string) => void) {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    report('Offline mode needs the published site (not available in dev) - reload once and retry');
    return;
  }
  const urls = new Set<string>();
  let done = 0;
  report('Collecting files…');
  for (const m of index.maps) {
    const data = await loadMap(m.id);
    for (const f of m.floors) urls.add(`maps/${m.mapFolder}/${f}.svg`);
    for (const n of data.nodes) urls.add(`icons/${n.icon}.png`);
    for (const d of data.disguises) if (d.image) urls.add(d.image);
    report(`Maps ${++done}/${index.maps.length}`);
  }
  const list = [...urls];
  for (let i = 0; i < list.length; i += 8) {
    await Promise.all(list.slice(i, i + 8).map((u) => fetch(u).catch(() => null)));
    report(`Files ${Math.min(i + 8, list.length)}/${list.length}`);
  }
  report('Saved - the site now works offline in this browser');
}
