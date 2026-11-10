# Merces Map

Interactive maps for the **Freelancer** mode of *HITMAN World of Assassination*.
An unofficial, non-commercial fan project, not affiliated with IO Interactive or HITMAPS.

## Features

- All 19 Freelancer maps (Paris, Sapienza, Marrakesh, Bangkok, Colorado, Hokkaido, Miami,
  Santa Fortuna, Mumbai, Whittleton Creek, Ambrose Island, Isle of Sgàil, New York, Haven Island,
  Dubai, Dartmoor, Berlin, Chongqing, Mendoza)
- Pan, zoom and switch floors; each floor button shows how many visible markers it holds
- Toggle between the *Freelancer – Standard* and *Freelancer – Alerted* layouts
- Layers:
  - **Starting locations**
  - **Freelancer items**: weapons and tools with a Freelancer rarity tier, which you keep in your
    Safehouse if you finish the mission carrying them (rarity shown in each popup)
  - **Stashes & safes**
  - **Map-only items**: everything else (melee, explosives, poisons, distractions, keys, …), filterable by type
  - **Disguise pickups**
- Disguise panel: pick a disguise to shade its hostile (red) and trespassing (yellow) areas on the map,
  see who wears it, where it is lying around, and the sources for each description
- Works on desktop and phone; the selected map is kept in the URL (`#paris`, `#mendoza`, …)

## Where the data and assets come from

Full disclosure of everything this project did not create itself:

| What | Origin |
| --- | --- |
| Floor maps (SVG) | Drawn by [HITMAPS](https://www.hitmaps.com), copied from their media server |
| Map marker icons | HITMAPS |
| Item, stash, safe, starting location and disguise-area positions, item notes | HITMAPS public API |
| Disguise portraits | In-game images from *HITMAN* by IO Interactive, as served by HITMAPS |
| Disguise descriptions ("worn by", "how to get") | Summarised from the [Hitman Wiki](https://hitman.fandom.com) (CC BY-SA 3.0) and other public guides; every entry links its sources |
| Freelancer rarity tiers and hideout rules | Hitman Wiki ([Freelancer](https://hitman.fandom.com/wiki/Freelancer), rarity list templates) and [Shacknews](https://www.shacknews.com/article/133883/hitman-freelancer-weapons) |
| Logo, layout and code | Made for this project |

### How the data was assembled

1. **Snapshot.** `scripts/snapshot.mjs` reads the public HITMAPS API (`https://api.hitmaps.com/api`).
   For every mission flagged as supporting Freelancer it keeps only the nodes tagged with the
   *Freelancer – Standard* or *Freelancer – Alerted* variant, plus the mission's disguises and their
   restricted areas, and downloads the floor SVGs, marker icons and disguise portraits into `public/`.
2. **Disguise research.** Each disguise was looked up on the Hitman Wiki and other public guides.
   Only statements backed by a source were kept, with the source URLs stored next to the text in
   `public/data/disguise-info.json`. Disguises with no sourced description show only their HITMAPS data.
3. **Hideout rules.** Map item names were matched against the wiki's Freelancer rarity lists
   (Common, Rare, Epic, Legendary). Matches and their tiers are in `public/data/hideout.json`;
   everything else counts as a map-only item.

Snapshot date: see `snapshotDate` in `public/data/maps.json` (also shown on the site).

## Development

Requires Node 18+.

```bash
npm install
npm run dev        # local dev server
npm run build      # production build into dist/
npm run snapshot   # refresh the HITMAPS snapshot (overwrites public/data/<map>.json, maps, icons)
```

`npm run snapshot` does not touch `disguise-info.json` or `hideout.json`, which are curated by hand.

`dist/` is a static site; it can be served from any static host or sub-folder.

### Project layout

```
scripts/snapshot.mjs    HITMAPS snapshot script
public/data/            maps.json (index), <map>.json (nodes + disguises), hideout.json, disguise-info.json
public/maps/            floor SVGs per map
public/icons/           marker icons
public/disguises/       disguise portraits
src/App.tsx             layout, state, layer logic
src/MapView.tsx         Leaflet map (floors, markers, disguise areas)
src/DisguisePanel.tsx   disguise list and detail card
src/About.tsx           credits and sources dialog
```

## Legal

HITMAN, HITMAN World of Assassination, Agent 47 and all related names, images and map designs are
trademarks or copyrights of IO Interactive A/S. Map renderings, icons and map data are the work of the
HITMAPS team and contributors. Text adapted from the Hitman Wiki is available under CC BY-SA 3.0.
This project is not affiliated with, endorsed or sponsored by any of them.
