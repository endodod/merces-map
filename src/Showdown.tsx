import { useStored } from './store';
import type { ShowdownData } from './types';

const Links = ({ sources }: { sources: string[] }) => (
  <span className="sources">{sources.map((s, i) => <a key={s} href={s} target="_blank" rel="noreferrer">[{i + 1}]</a>)}</span>
);

export function Showdown({ data }: { data: ShowdownData }) {
  const [clues, setClues] = useStored<Record<string, boolean>>('mm.showdown', {});
  const marked = Object.values(clues).filter(Boolean).length;

  return (
    <section className="showdown">
      <h3>Showdown: leader clues</h3>
      <p className="small">{data.howItWorks.text} <Links sources={data.howItWorks.sources} /></p>
      <p className="muted small">Tick the traits you have learned about the leader, then rule out suspects that do not match.</p>
      {data.categories.map((c) => (
        <div key={c.name} className="clue-group">
          <h4>{c.name}</h4>
          {c.note && <p className="muted small">{c.note}</p>}
          <div className="clue-grid">
            {c.values.map((v) => {
              const key = `${c.name}:${v}`;
              return (
                <label key={v} className="toggle-inline small">
                  <input type="checkbox" checked={!!clues[key]} onChange={(e) => setClues({ ...clues, [key]: e.target.checked })} /> {v}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <button className="link small" disabled={!marked} onClick={() => setClues({})}>Clear clues</button>
      <h4>Tips</h4>
      <ul className="small">
        {data.tips.map((t) => <li key={t.text}>{t.text} <Links sources={t.sources} /></li>)}
      </ul>
    </section>
  );
}
