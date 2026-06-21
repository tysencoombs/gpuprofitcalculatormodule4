// GPU Profit Dashboard with Live Pearl Price
// Web Apps Module Project
// This Node.js/Express app stores GPU entries in SQLite and pulls the current
// Pearl price from CoinGecko. The user enters estimated PRL earned per day,
// and the app calculates USD revenue, power cost, daily profit, monthly profit,
// and yearly profit.

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Configure Express and EJS templates.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// SQLite database. This file is created automatically when the app runs.
const db = new sqlite3.Database('./gpu_tracker.db');

// Cached Pearl price so the app still works if the price API is temporarily unavailable.
let pearlPriceCache = {
  priceUsd: 0.60,
  source: 'Default fallback price',
  updatedAt: null,
  error: null
};

// Create the table if it does not already exist.
db.run(`
  CREATE TABLE IF NOT EXISTS gpus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    hashrate REAL NOT NULL,
    watts REAL NOT NULL,
    powerCost REAL NOT NULL,
    dailyPrl REAL NOT NULL,
    notes TEXT
  )
`);

// This migration keeps the app from breaking if an older version of the database exists.
db.all("PRAGMA table_info(gpus)", [], (err, columns) => {
  if (!err && columns && !columns.some((column) => column.name === 'dailyPrl')) {
    db.run("ALTER TABLE gpus ADD COLUMN dailyPrl REAL DEFAULT 0");
  }
});

// Pull the Pearl price from CoinGecko's public simple price endpoint.
// If the request fails, the app continues using the last cached price.
async function updatePearlPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pearl-2&vs_currencies=usd');

    if (!response.ok) {
      throw new Error(`CoinGecko returned status ${response.status}`);
    }

    const data = await response.json();
    const price = Number(data?.['pearl-2']?.usd);

    if (!price || price <= 0) {
      throw new Error('Pearl price was not found in the API response.');
    }

    pearlPriceCache = {
      priceUsd: price,
      source: 'CoinGecko Pearl API',
      updatedAt: new Date(),
      error: null
    };
  } catch (error) {
    pearlPriceCache.error = error.message;
  }
}

// Convert one database row into a richer GPU object with calculated values.
function calculateGpuStats(gpu, pearlPriceUsd) {
  const dailyRevenue = gpu.dailyPrl * pearlPriceUsd;
  const dailyPowerCost = (gpu.watts / 1000) * 24 * gpu.powerCost;
  const dailyProfit = dailyRevenue - dailyPowerCost;
  const monthlyPrl = gpu.dailyPrl * 30;
  const monthlyRevenue = dailyRevenue * 30;
  const monthlyPowerCost = dailyPowerCost * 30;
  const monthlyProfit = dailyProfit * 30;
  const yearlyProfit = dailyProfit * 365;

  return {
    ...gpu,
    dailyRevenue,
    dailyPowerCost,
    dailyProfit,
    monthlyPrl,
    monthlyRevenue,
    monthlyPowerCost,
    monthlyProfit,
    yearlyProfit
  };
}

// Calculate totals for all saved GPUs.
function calculateTotals(gpus) {
  return gpus.reduce((totals, gpu) => {
    totals.totalHashrate += gpu.hashrate;
    totals.totalWatts += gpu.watts;
    totals.dailyPrl += gpu.dailyPrl;
    totals.dailyRevenue += gpu.dailyRevenue;
    totals.dailyPowerCost += gpu.dailyPowerCost;
    totals.dailyProfit += gpu.dailyProfit;
    totals.monthlyPrl += gpu.monthlyPrl;
    totals.monthlyRevenue += gpu.monthlyRevenue;
    totals.monthlyPowerCost += gpu.monthlyPowerCost;
    totals.monthlyProfit += gpu.monthlyProfit;
    totals.yearlyProfit += gpu.yearlyProfit;
    return totals;
  }, {
    totalHashrate: 0,
    totalWatts: 0,
    dailyPrl: 0,
    dailyRevenue: 0,
    dailyPowerCost: 0,
    dailyProfit: 0,
    monthlyPrl: 0,
    monthlyRevenue: 0,
    monthlyPowerCost: 0,
    monthlyProfit: 0,
    yearlyProfit: 0
  });
}

// Format currency values for the EJS pages.
function money(value) {
  return Number(value).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
}

function formatDate(date) {
  if (!date) {
    return 'Not refreshed yet';
  }

  return date.toLocaleString();
}

// Home dashboard page.
app.get('/', async (req, res) => {
  await updatePearlPrice();

  db.all('SELECT * FROM gpus ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Database error.');
    }

    const gpus = rows.map((row) => calculateGpuStats(row, pearlPriceCache.priceUsd));
    const totals = calculateTotals(gpus);

    res.render('index', {
      pageTitle: 'GPU Profit Dashboard',
      gpus,
      totals,
      pearlPrice: pearlPriceCache,
      money,
      formatDate
    });
  });
});

// Detailed saved GPU page.
app.get('/gpus', async (req, res) => {
  await updatePearlPrice();

  db.all('SELECT * FROM gpus ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Database error.');
    }

    const gpus = rows.map((row) => calculateGpuStats(row, pearlPriceCache.priceUsd));
    const totals = calculateTotals(gpus);

    res.render('gpus', {
      pageTitle: 'Saved GPUs',
      gpus,
      totals,
      pearlPrice: pearlPriceCache,
      money,
      formatDate
    });
  });
});

// Add GPU form page.
app.get('/add', (req, res) => {
  res.render('add', {
    pageTitle: 'Add GPU',
    error: null,
    formData: {}
  });
});

// Save user input to SQLite.
app.post('/add', (req, res) => {
  const name = (req.body.name || '').trim();
  const hashrate = Number(req.body.hashrate);
  const watts = Number(req.body.watts);
  const powerCost = Number(req.body.powerCost);
  const dailyPrl = Number(req.body.dailyPrl);
  const notes = (req.body.notes || '').trim();

  if (!name || hashrate <= 0 || watts <= 0 || powerCost < 0 || dailyPrl < 0) {
    return res.status(400).render('add', {
      pageTitle: 'Add GPU',
      error: 'Please enter a GPU name and valid numbers for every field.',
      formData: req.body
    });
  }

  db.run(
    'INSERT INTO gpus (name, hashrate, watts, powerCost, dailyPrl, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [name, hashrate, watts, powerCost, dailyPrl, notes],
    (err) => {
      if (err) {
        return res.status(500).send('Database error.');
      }
      res.redirect('/gpus');
    }
  );
});

// Delete a saved GPU.
app.post('/delete/:id', (req, res) => {
  db.run('DELETE FROM gpus WHERE id = ?', [req.params.id], () => {
    res.redirect('/gpus');
  });
});

// Add sample GPUs to make the app easy to demo.
app.post('/sample-data', (req, res) => {
  const samples = [
    ['RTX 5090', 309, 450, 0.11, 15.0, 'Main high-hashrate card'],
    ['RTX 5080', 185, 320, 0.11, 8.0, 'Secondary card estimate'],
    ['RTX 4090 Laptop', 120, 300, 0.11, 5.0, 'Laptop mining estimate']
  ];

  const statement = db.prepare(
    'INSERT INTO gpus (name, hashrate, watts, powerCost, dailyPrl, notes) VALUES (?, ?, ?, ?, ?, ?)'
  );

  samples.forEach((gpu) => statement.run(gpu));
  statement.finalize(() => res.redirect('/gpus'));
});

// Clear all saved GPUs for demo reset.
app.post('/clear', (req, res) => {
  db.run('DELETE FROM gpus', () => res.redirect('/'));
});

// Fallback page.
app.use((req, res) => {
  res.status(404).render('not-found', {
    pageTitle: 'Page Not Found'
  });
});

app.listen(PORT, async () => {
  await updatePearlPrice();
  console.log(`GPU Profit Dashboard running at http://localhost:${PORT}`);
});