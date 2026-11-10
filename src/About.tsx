import type { HideoutRules } from './types';

const Links = ({ sources }: { sources: string[] }) =>
  sources.length ? (
    <span className="sources">
      {' '}{sources.map((s, i) => <a key={s} href={s} target="_blank" rel="noreferrer">[{i + 1}]</a>)}
    </span>
  ) : null;

export function About({ snapshotDate, hideout, onClose }: { snapshotDate: string; hideout: HideoutRules; onClose: () => void }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <h2>About this site</h2>
        <p>
          An unofficial, non-commercial helper for HITMAN World of Assassination's Freelancer mode.
          It is not affiliated with or endorsed by IO Interactive or HITMAPS.
        </p>

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
            Every entry links its sources. Where no source was found, the field is left empty instead of guessed.
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

        <h3>Legal</h3>
        <p className="muted">
          HITMAN, World of Assassination, Agent 47 and all related names, images and map designs are trademarks
          or copyrights of IO Interactive A/S. Map renderings and data © HITMAPS and contributors.
        </p>
      </div>
    </div>
  );
}
