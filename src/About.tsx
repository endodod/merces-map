import type { HideoutRules } from './types';

const Links = ({ sources }: { sources: string[] }) =>
  sources.length ? (
    <span className="sources">
      {' '}{sources.map((s, i) => <a key={s} href={s} target="_blank" rel="noreferrer">[{i + 1}]</a>)}
    </span>
  ) : null;

export function About({ snapshotDate, hideout, sources, onClose }: { snapshotDate: string; hideout: HideoutRules; sources: string[]; onClose: () => void }) {
  const bySite = new Map<string, string[]>();
  for (const s of sources) {
    const host = new URL(s).hostname.replace(/^www\./, '');
    bySite.set(host, [...(bySite.get(host) ?? []), s]);
  }
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <h2>About Merces Map</h2>
        <p>
          Merces Map is an unofficial, non-commercial fan helper for HITMAN World of Assassination's Freelancer mode.
          It is not affiliated with or endorsed by IO Interactive or HITMAPS.
        </p>

        <h3>Where every asset comes from</h3>
        <ul>
          <li><b>Floor maps (SVG)</b>: drawn by <a href="https://www.hitmaps.com" target="_blank" rel="noreferrer">HITMAPS</a>, copied from their media server.</li>
          <li><b>Map marker icons</b>: HITMAPS.</li>
          <li><b>Item, stash, safe, starting location and disguise-area positions</b>: HITMAPS public API.</li>
          <li><b>Disguise portraits</b>: in-game images from HITMAN by IO Interactive, as served by HITMAPS.</li>
          <li><b>Disguise descriptions</b>: summarised from the <a href="https://hitman.fandom.com" target="_blank" rel="noreferrer">Hitman Wiki</a> (CC BY-SA 3.0) and other public guides, linked per entry.</li>
          <li><b>Where disguises are found, fast tips and map briefings</b>: Hitman Wiki and public guides (GamePressure, PowerPyx, GamesHedge), linked per entry. Tips that rely on story targets or starting locations missing in Freelancer were left out.</li>
          <li><b>Rarity tiers and the collection checklist</b>: the Hitman Wiki's Freelancer rarity lists and Safehouse page.</li>
          <li><b>Stash/safe behaviour</b>: Hitman Wiki, PC Gamer and a Steam community guide.</li>
          <li><b>Merces Map logo, layout and code</b>: made for this project.</li>
        </ul>

        <h3>How it was built</h3>
        <ul>
          <li>
            <b>Maps, item positions, starting locations, stashes, safes and disguise areas</b> are a snapshot
            (taken {snapshotDate}) of the public <a href="https://www.hitmaps.com" target="_blank" rel="noreferrer">HITMAPS</a> API,
            filtered to each mission's "Freelancer – Standard" and "Freelancer – Alerted" variants.
            The snapshot script is <code>scripts/snapshot.mjs</code> in the repository. All map art, icons and
            item data are the work of the HITMAPS team and contributors.
          </li>
          <li>
            <b>Disguise descriptions</b> ("worn by", "how to get") were researched from the{' '}
            <a href="https://hitman.fandom.com" target="_blank" rel="noreferrer">Hitman Wiki</a> (CC BY-SA) and other public guides.
            Every entry links its sources. Where no source was found, the description is left out instead of
            guessed, and the disguise shows only its HITMAPS data (portrait, restricted areas, pickup spots).
          </li>
          <li>
            <b>Hideout rules</b> (which items count as Freelancer items) come from the sources listed below.
          </li>
          <li>The site itself is a React + Vite + Leaflet app.</li>
        </ul>

        <h3>Freelancer items: rules used</h3>
        <ul>
          {hideout.rules.map((r) => <li key={r.text}>{r.text}<Links sources={r.sources} /></li>)}
          {hideout.stashAndSafes && <li>{hideout.stashAndSafes.text}<Links sources={hideout.stashAndSafes.sources} /></li>}
        </ul>

        <h3>All sources ({sources.length})</h3>
        {[...bySite.entries()].sort((a, b) => b[1].length - a[1].length).map(([host, urls]) => (
          <details key={host}>
            <summary>{host} ({urls.length})</summary>
            <ul className="small">
              {urls.sort().map((u) => <li key={u}><a href={u} target="_blank" rel="noreferrer">{decodeURIComponent(u.replace(/^https?:\/\/(www\.)?/, ''))}</a></li>)}
            </ul>
          </details>
        ))}

        <h3>Legal</h3>
        <p className="muted">
          HITMAN, World of Assassination, Agent 47 and all related names, images and map designs are trademarks
          or copyrights of IO Interactive A/S. Map renderings and data © HITMAPS and contributors.
        </p>
      </div>
    </div>
  );
}
