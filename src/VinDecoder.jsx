import { useState } from 'react';

export default function VinDecoder() {
  const [vin, setVin] = useState('');
  const [result, setResult] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState({ make: '', model: '' });

  const decode = async () => {
    setResult(null);
    setFailed(false);

    const clean = vin.trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(clean)) {
      setFailed(true);
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`/api/decode/${clean}`);
      const data = await r.json();
      const item = data.Results?.[0];

      if (item?.Make && item?.Model) {
        setResult({ make: item.Make, model: item.Model, year: item.ModelYear });
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>VIN Decoder</h2>
      <p className="hint">Enter a 17-character VIN to auto-fill make and model.</p>

      <div className="row">
        <input
          className="input vin"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && decode()}
          placeholder="e.g. 1HGCM82633A004352"
          maxLength={17}
        />
        <button className="btn" onClick={decode} disabled={loading || !vin.trim()}>
          {loading ? 'Decoding…' : 'Decode'}
        </button>
      </div>

      {result && (
        <div className="msg success">
          <span>✅</span>
          <span>
            <strong>{result.year} {result.make} {result.model}</strong>
          </span>
        </div>
      )}

      {failed && (
        <div className="msg warning">
          <span>⚠️</span>
          <div>
            Could not decode this VIN — it may be a JDM chassis number or a
            non-U.S. vehicle.
            <div className="fallback">
              <strong>Enter make and model manually:</strong>
              <div className="row">
                <input
                  className="input"
                  placeholder="Make (e.g. Toyota)"
                  value={manual.make}
                  onChange={(e) => setManual({ ...manual, make: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Model (e.g. Vitz)"
                  value={manual.model}
                  onChange={(e) => setManual({ ...manual, model: e.target.value })}
                />
              </div>
              {manual.make && manual.model && (
                <span className="chip">
                  ✅ Saved: {manual.make} {manual.model}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}