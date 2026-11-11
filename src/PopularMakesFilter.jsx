import { useState, useEffect, useMemo } from 'react';

const COMMON_MAKES = ['TOYOTA', 'HONDA', 'FORD', 'BMW', 'MERCEDES-BENZ', 'NISSAN', 'HYUNDAI', 'KIA'];

const makeIdOf = (m) => m.Make_ID ?? m.MakeId;
const makeNameOf = (m) => m.Make_Name ?? m.MakeName;
const modelIdOf = (m) => m.Model_ID ?? m.ModelId;
const modelNameOf = (m) => m.Model_Name ?? m.ModelName;

const pretty = (s = '') =>
  s.toLowerCase().replace(/(^|[\s-])(\w)/g, (_, a, b) => a + b.toUpperCase()).replace(/^Bmw$/, 'BMW');

export default function PopularMakesFilter() {
  const [makes, setMakes] = useState([]);          // full list, loaded lazily
  const [makesLoaded, setMakesLoaded] = useState(false);
  const [models, setModels] = useState([]);
  const [makeId, setMakeId] = useState('');
  const [model, setModel] = useState('');
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [status, setStatus] = useState('');

  // Load full makes list once, lazily (when user first searches or opens the card)
  const loadMakes = () => {
    if (makesLoaded) return Promise.resolve(makes);
    return fetch('/api/makes')
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
        setMakesLoaded(true);
        return unique;
      });
  };

  // Popular makes — hardcoded IDs so we can render them instantly without the full list
  // NHTSA IDs: Toyota=440, Honda=474, Ford=460, BMW=452, Mercedes-Benz=449, Nissan=478, Hyundai=498, Kia=499
  const POPULAR = [
    { id: 440, name: 'Toyota' },
    { id: 474, name: 'Honda' },
    { id: 460, name: 'Ford' },
    { id: 452, name: 'BMW' },
    { id: 449, name: 'Mercedes-Benz' },
    { id: 478, name: 'Nissan' },
    { id: 498, name: 'Hyundai' },
    { id: 499, name: 'Kia' },
  ];

  // Load models when make changes
  useEffect(() => {
    setModel('');
    if (!makeId) {
      setModels([]);
      return;
    }
    let cancelled = false;
    setStatus('Loading models…');
    fetch(`/api/models/${makeId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list = d.Results || [];
        setModels(list);
        setStatus(list.length ? '' : 'No models found for this make.');
      })
      .catch((e) => {
        if (!cancelled) setStatus('Failed to load models: ' + e.message);
      });
    return () => { cancelled = true; };
  }, [makeId]);

  // Search results (only when user types 2+ chars)
  const searchResults = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (q.length < 2 || !makesLoaded) return [];
    return makes
      .filter((m) => (makeNameOf(m) || '').toUpperCase().includes(q))
      .slice(0, 30); // cap results so dropdown stays fast
  }, [search, makes, makesLoaded]);

  const onSearchChange = (e) => {
    const v = e.target.value;
    setSearch(v);
    setShowResults(true);
    if (!makesLoaded && v.trim().length >= 2) loadMakes();
  };

  const pickMake = (id, name) => {
    setMakeId(String(id));
    setSearch(name);
    setShowResults(false);
  };

  const clearMake = () => {
    setMakeId('');
    setSearch('');
    setModel('');
    setModels([]);
    setStatus('');
  };

  const selectedMakeName = useMemo(() => {
    const fromPopular = POPULAR.find((p) => String(p.id) === String(makeId));
    if (fromPopular) return fromPopular.name;
    const fromAll = makes.find((m) => String(makeIdOf(m)) === String(makeId));
    return fromAll ? pretty(makeNameOf(fromAll)) : '';
  }, [makeId, makes]);

  return (
    <section className="card">
      <h2>Quick Filter</h2>
      <p className="hint">Pick a popular make, or search all 12,000+ makes.</p>

      <div className="row">
        {/* Popular makes dropdown */}
        <select
          className="select"
          value={POPULAR.some((p) => String(p.id) === makeId) ? makeId : ''}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) { clearMake(); return; }
            const p = POPULAR.find((x) => String(x.id) === v);
            pickMake(v, p?.name || '');
          }}
        >
          <option value="">Popular makes</option>
          {POPULAR.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Search field for the rest */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input
            className="input search"
            style={{ width: '100%' }}
            value={search}
            onChange={onSearchChange}
            onFocus={() => search && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Search all makes…"
          />
          {makeId && (
            <button
              type="button"
              onClick={clearMake}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280',
                fontSize: 16, lineHeight: 1,
              }}
              aria-label="Clear make"
            >
              ×
            </button>
          )}

          {showResults && searchResults.length > 0 && (
            <ul
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                margin: '4px 0 0', padding: 4, listStyle: 'none',
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 8, boxShadow: 'var(--shadow)',
                maxHeight: 260, overflowY: 'auto',
              }}
            >
              {searchResults.map((m) => (
                <li key={makeIdOf(m)}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickMake(makeIdOf(m), pretty(makeNameOf(m)))}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px',
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      fontSize: 14, borderRadius: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {pretty(makeNameOf(m))}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showResults && search.trim().length >= 2 && makesLoaded && searchResults.length === 0 && (
            <div
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                margin: '4px 0 0', padding: '10px 12px',
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 8, boxShadow: 'var(--shadow)',
                fontSize: 13, color: '#6b7280',
              }}
            >
              No makes match "{search}".
            </div>
          )}
        </div>

        {/* Model dropdown */}
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
          ✅ Selected: {selectedMakeName} {model}
        </span>
      )}
    </section>
  );
}