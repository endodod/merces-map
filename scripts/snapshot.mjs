// Downloads a snapshot of the Freelancer-relevant map data from the HITMAPS public API
// (https://www.hitmaps.com) into public/. Run with: node scripts/snapshot.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.hitmaps.com/api/games';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const GAMES = ['hitman', 'hitman2', 'hitman3'];

async function get(url, type = 'json') {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'freelancer-map-snapshot' } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return type === 'json' ? res.json() : Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function save(rel, data) {
  const file = join(ROOT, rel);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data));
}

async function pool(items, size, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

const KEEP_GROUPS = ['Starting Location', 'Stash', 'Safe', 'Disguise', 'Misc Item'];
const round = (x) => Math.round(Number(x) * 1000) / 1000;

const maps = [];
const icons = new Set();

for (const game of GAMES) {
  for (const loc of await get(`${API}/${game}/locations`)) {
    for (const m of loc.missions ?? []) {
      const base = `${API}/${game}/locations/${loc.slug}/missions/${m.slug}`;
      const mission = await get(base);
      if (!mission.supportsFreelancer) continue;

      const standard = mission.variants.find((v) => v.slug === 'freelancer-standard');
      const alerted = mission.variants.find((v) => v.slug === 'freelancer-alerted');
      const variantIds = [standard?.id, alerted?.id].filter(Boolean);
      console.log(`${game}/${loc.slug}/${m.slug}`);

      const nodeData = await get(`${base}/nodes`);
      const nodes = nodeData.nodes
        .filter((n) => n.variants.some((v) => variantIds.includes(v)))
        .filter((n) => n.type === 'Weapons and Tools' || KEEP_GROUPS.includes(n.group))
        .map((n) => {
          icons.add(n.icon);
          return {
            id: n.id,
            type: n.type,
            group: n.group,
            subgroup: n.subgroup,
            icon: n.icon,
            name: n.name,
            target: n.target,
            level: n.level,
            lat: Number(n.latitude),
            lng: Number(n.longitude),
            notes: n.notes.map((x) => ({ type: x.type, text: x.text })),
            image: n.image,
            quantity: n.quantity,
            passageDestinationFloor: n.passageDestinationFloor,
            standard: n.variants.includes(standard?.id),
            alerted: n.variants.includes(alerted?.id),
          };
        });

      const { disguises } = await get(`${base}/disguises`);
      await pool(disguises, 4, async (d) => {
        const { disguiseAreas } = await get(`${base}/disguise-areas/${d.id}`);
        d.areas = disguiseAreas.map((a) => ({
          level: a.level,
          type: a.type,
          vertices: a.vertices.map((v) => v.split(',').map(round)),
        }));
        const img = await get(d.image, 'buffer').catch(() => null);
        if (img) {
          await save(`disguises/${d.id}.jpg`, img);
          d.image = `disguises/${d.id}.jpg`;
        } else d.image = null;
      });

      const folder = `${game}/${mission.mapFolderName}`;
      const floors = [];
      for (let f = mission.lowestFloorNumber; f <= mission.highestFloorNumber; f++) floors.push(f);
      await pool(floors, 4, async (f) => {
        await save(`maps/${folder}/${f}.svg`, await get(`https://media.hitmaps.com/img/${game}/maps/${mission.mapFolderName}/${f}.svg`, 'buffer'));
      });
      if (mission.satelliteView) {
        const sat = await get(`https://media.hitmaps.com/img/${game}/maps/${mission.mapFolderName}/satellite.svg`, 'buffer').catch(() => null);
        if (sat) await save(`maps/${folder}/satellite.svg`, sat);
      }

      const id = loc.slug;
      await save(`data/${id}.json`, { nodes, disguises });
      maps.push({
        id,
        game,
        destination: mission.location.destination,
        country: mission.location.destinationCountry,
        mission: mission.name,
        background: mission.backgroundUrl,
        mapFolder: folder,
        floors,
        startingFloor: mission.startingFloorNumber,
        floorNames: mission.floorNames,
        center: [Number(mission.mapCenterLatitude), Number(mission.mapCenterLongitude)],
        viewBounds: [
          [Number(mission.topLeftCoordinateLatitude), Number(mission.topLeftCoordinateLongitude)],
          [Number(mission.bottomRightCoordinateLatitude), Number(mission.bottomRightCoordinateLongitude)],
        ],
        imageBounds: [
          [Number(mission.boundingBoxTopLeftLatitude), Number(mission.boundingBoxTopLeftLongitude)],
          [Number(mission.boundingBoxBottomRightLatitude), Number(mission.boundingBoxBottomRightLongitude)],
        ],
        minZoom: mission.minZoom,
        maxZoom: mission.maxZoom,
        source: `https://www.hitmaps.com/games/${game}/${loc.slug}/${m.slug}`,
      });
    }
  }
}

await pool([...icons], 6, async (icon) => {
  const png = await get(`https://media.hitmaps.com/img/hitmaps-custom/site/map-icons/${icon}.png`, 'buffer').catch(() => null);
  if (png) await save(`icons/${icon}.png`, png);
  else console.warn(`missing icon: ${icon}`);
});

await save('data/maps.json', { snapshotDate: new Date().toISOString().slice(0, 10), maps });
console.log(`done: ${maps.length} maps, ${icons.size} icons`);
