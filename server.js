import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());


const NHTSA = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// Decode VIN
app.get('/api/decode/:vin', async (req, res) => {
  try {
    const r = await fetch(`${NHTSA}/DecodeVinValues/${encodeURIComponent(req.params.vin)}?format=json`);
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: 'Decode failed' });
  }
});

// All makes (cached in memory)
let makesCache = null;
app.get('/api/makes', async (req, res) => {
  if (makesCache) return res.json(makesCache);
  try {
    const r = await fetch(`${NHTSA}/GetAllMakes?format=json`);
    makesCache = await r.json();
    res.json(makesCache);
  } catch (e) {
    res.status(500).json({ error: 'Fetch makes failed' });
  }
});

// Models by make ID
// Models by make ID (optionally filtered by ?year=2015)
app.get('/api/models/:makeId', async (req, res) => {
  const { makeId } = req.params;
  const { year } = req.query;
  const url = year
    ? `${NHTSA}/GetModelsForMakeIdYear/makeId/${encodeURIComponent(makeId)}/modelyear/${encodeURIComponent(year)}?format=json`
    : `${NHTSA}/GetModelsForMakeId/${encodeURIComponent(makeId)}?format=json`;
  try {
    const r = await fetch(url);
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: 'Fetch models failed' });
  }
});

// Serve the built React app
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
