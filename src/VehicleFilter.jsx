import { useState, useEffect, useMemo } from 'react';

const COMMON_MAKES = ['TOYOTA', 'HONDA', 'FORD', 'BMW', 'MERCEDES-BENZ', 'NISSAN', 'HYUNDAI', 'KIA'];

const makeIdOf = (m) => m.Make_ID ?? m.MakeId;
const makeNameOf = (m) => m.Make_Name ?? m.MakeName;
const modelIdOf = (m) => m.Model_ID ?? m.ModelId;
const modelNameOf = (m) => m.Model_Name ?? m.ModelName;

const pretty = (s = '') =>
  s.toLowerCase().replace(/(^|[\s-])(\w)/g, (_, a, b) => a + b.toUpperCase()).replace(/^Bmw$/, 'BMW');

// Year list: next model year down to 1980
const MAX_YEAR = new Date().getFullYear() + 1;
const MIN_YEAR = 1980;
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i);

export default function VehicleFilter() {
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [makeId, setMakeId] = useState('');
  const [year, setYear] = useState(''); // '' = any year
  const [model, setModel] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Loading makes…');

  // Load makes once
  useEffect(() => {
    fetch('/api/makes')
      .then((r) => r.json())
      .then((d) => {
        const all = d.Results || [];
        const seen = new Set();
        const unique = all.filter((m) => {
          const id = makeIdOf(m);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setMakes(unique);
        setStatus(unique.length ? '' : 'API returned no makes.');
      })
      .catch((e) => setStatus('Failed to load makes: ' + e.message));
  }, []);

  // Load models whenever make OR year changes
  useEffect(() => {
    setModel('');
    if (!makeId) {
      setModels([]);
      setStatus('');
      return;
    }

    let cancelled = false; // ignore stale responses if the user changes fast
    setStatus('Loading models…');

    const url = year ? `/api/models/${makeId}?year=${year}` : `/api/models/${makeId}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list = d.Results || [];
        setModels(list);
        setStatus(
          list.length ? '' : `No models found for this make${year ? ` in ${year}` : ''}.`
        );
      })
      .catch((e) => {
        if (!cancelled) setStatus('Failed to load models: ' + e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [makeId, year]);

  const orderedMakes = useMemo(() => {
    const q = search.trim().toUpperCase();
    const filtered = q
      ? makes.filter((m) => (makeNameOf(m) || '').toUpperCase().includes(q))
      : makes;

    const common = [];
    const others = [];
    for (const m of filtered) {
      const name = (makeNameOf(m) || '').trim().toUpperCase();
      if (COMMON_MAKES.includes(name)) common.push(m);
      else others.push(m);
    }
    common.sort(
      (a, b) =>
        COMMON_MAKES.indexOf((makeNameOf(a) || '').toUpperCase()) -
        COMMON_MAKES.indexOf((makeNameOf(b) || '').toUpperCase())
    );
    others.sort((a, b) => (makeNameOf(a) || '').localeCompare(makeNameOf(b) || ''));
    return { common, others };
  }, [makes, search]);

  const makeLabel = pretty(
    makeNameOf(makes.find((m) => String(makeIdOf(m)) === String(makeId)) || {}) || ''
  );

  return (
    <section className="card">
      <h2>Filter Vehicles</h2>
      <p className="hint">Browse all makes — popular ones are pinned to the top.</p>

      <div className="row">
        <input
          className="input search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search make…"
        />

        <select
          className="select"
          value={makeId}
          onChange={(e) => setMakeId(e.target.value)}
        >
          <option value="">Select Make</option>
          {orderedMakes.common.length > 0 && (
            <optgroup label="Popular">
              {orderedMakes.common.map((m) => (
                <option key={makeIdOf(m)} value={makeIdOf(m)}>
                  {pretty(makeNameOf(m))}
                </option>
              ))}
            </optgroup>
          )}
          {orderedMakes.others.length > 0 && (
            <optgroup label={`All Makes (${orderedMakes.others.length})`}>
              {orderedMakes.others.map((m) => (
                <option key={makeIdOf(m)} value={makeIdOf(m)}>
                  {pretty(makeNameOf(m))}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        <select
          className="select"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value="">Any Year</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          className="select"
          disabled={!makeId}
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="">Select Model</option>
          {models.map((m) => (
            <option key={modelIdOf(m)} value={modelNameOf(m)}>
              {modelNameOf(m)}
            </option>
          ))}
        </select>
      </div>

      {status && <div className="msg info">{status}</div>}
      {model && (
        <span className="chip">
          ✅ Selected: {year ? `${year} ` : ''}
          {makeLabel} {model}
        </span>
      )}
    </section>
  );
}