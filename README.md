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
  - **Stashes & safes**: the pool of possible spawn spots (not all are active in every run)
  - **Map-only items**: everything else (melee, explosives, poisons, distractions, keys, …), filterable by type
  - **Disguise pickups**, **Exits**, **Suppliers**
  - Optional: show checked items from other floors as faded markers with ▲/▼ ; click one to jump to that floor
- **Briefing** per map: the most useful disguises (with sources) and the Rare, Epic and Legendary items you can bring back to the hideout
- **Disguise panel**: pick a disguise to shade its hostile (red) and trespassing (yellow) areas on the map,
  see who wears it, where they are found, a fast way to get it and where it is lying around; place names
  in tips (e.g. "Kitchen", "Wine Cellars") are clickable and jump to that spot on the map
- All source links are collected in the site's *About & sources* dialog
- **Item search** across all maps ("where is a Katana?"), jumping straight to it
- **Collection** tab: checklist of every Freelancer rarity-tier weapon and tool for the Safehouse display,
  with search, filters and links to the maps where an item lies around
- **Campaign tracker**: mark maps done in the current campaign (✓ in the map list)
- **Shareable links**: the URL keeps map, floor, variant and selected disguise (`#paris/2/alerted/787`)
- **Offline mode**: "Save all maps for offline use" caches everything in the browser
- Checklists and settings are stored only in your browser (localStorage); there is no server or account
- Works on desktop and phone

## Where the data and assets come from

Full disclosure of everything this project did not create itself:

| What | Origin |
| --- | --- |
| Floor maps (SVG) | Drawn by [HITMAPS](https://www.hitmaps.com), copied from their media server |
| Map marker icons | HITMAPS |
| Item, stash, safe, starting location and disguise-area positions, item notes | HITMAPS public API |
| Disguise portraits | In-game images from *HITMAN* by IO Interactive, as served by HITMAPS |
| Disguise descriptions ("worn by", "found at", "how to get", "fast tip") | Summarised from the [Hitman Wiki](https://hitman.fandom.com) (CC BY-SA 3.0) and public guides ([GamePressure](https://www.gamepressure.com), PowerPyx, GamesHedge); every entry links its sources |
| Map briefings (best disguises) | GamePressure and GamesHedge guides, linked per entry |
| Freelancer rarity tiers, hideout rules, collection list | Hitman Wiki ([Freelancer](https://hitman.fandom.com/wiki/Freelancer), [Safehouse](https://hitman.fandom.com/wiki/Safehouse), rarity list templates) and [Shacknews](https://www.shacknews.com/article/133883/hitman-freelancer-weapons) |
| Stash and safe behaviour | Hitman Wiki, [PC Gamer](https://www.pcgamer.com/hitman-freelancer-safe-clues/), a [Steam community guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3127926392) |
| Logo, layout and code | Made for this project |

### How the data was assembled

1. **Snapshot.** `scripts/snapshot.mjs` reads the public HITMAPS API (`https://api.hitmaps.com/api`).
   For every mission flagged as supporting Freelancer it keeps only the nodes tagged with the
   *Freelancer – Standard* or *Freelancer – Alerted* variant, plus the mission's disguises and their
   restricted areas, and downloads the floor SVGs, marker icons and disguise portraits into `public/`.
2. **Disguise research.** Each disguise was looked up on the Hitman Wiki and other public guides.
   Only statements backed by a source were kept, with the source URLs stored next to the text in
   `public/data/disguise-info.json`. Disguises with no sourced description show only their HITMAPS data.
   Tips that depend on story targets, scripted story events or starting locations that Freelancer does not
   have were left out.
3. **Hideout rules.** Map item names were matched against the wiki's Freelancer rarity lists
   (Common, Rare, Epic, Legendary). Matches and their tiers are in `public/data/hideout.json`;
   everything else counts as a map-only item.
4. **Curated extras.** `briefings.json` and `collection.json` in `public/data/` were
   researched the same way (sources stored per entry). `items.json` is generated by the snapshot script.

Snapshot date: see `snapshotDate` in `public/data/maps.json` (also shown on the site).

## Development

Requires Node 18+.

```bash
npm install
npm run dev        # local dev server
npm run build      # production build into dist/
npm run snapshot   # refresh the HITMAPS snapshot (overwrites public/data/<map>.json, maps, icons)
```

`npm run snapshot` does not touch the curated files (`disguise-info.json`, `hideout.json`, `briefings.json`,
`collection.json`).

Offline mode uses a small service worker (`public/sw.js`) and only runs in the production build.

`dist/` is a static site; it can be served from any static host or sub-folder.

### Project layout

```
scripts/snapshot.mjs    HITMAPS snapshot script
public/data/            maps.json (index), <map>.json (nodes + disguises), items.json (item index),
                        hideout.json, disguise-info.json, briefings.json, collection.json
public/sw.js            offline service worker
public/maps/            floor SVGs per map
public/icons/           marker icons
public/disguises/       disguise portraits
src/App.tsx             layout, state, layer logic
src/MapView.tsx         Leaflet map (floors, markers, disguise areas)
src/DisguisePanel.tsx   disguise list and detail card
src/Briefing.tsx        per-map briefing
src/ItemSearch.tsx      item search across maps
src/Collection.tsx      hideout collection checklist
src/offline.ts          "save for offline" download
src/About.tsx           credits and sources dialog
```

## Legal

HITMAN, HITMAN World of Assassination, Agent 47 and all related names, images and map designs are
trademarks or copyrights of IO Interactive A/S. Map renderings, icons and map data are the work of the
HITMAPS team and contributors. Text adapted from the Hitman Wiki is available under CC BY-SA 3.0.
This project is not affiliated with, endorsed or sponsored by any of them.
