const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// База даних
const db = new sqlite3.Database('data.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    soil INTEGER,
    temperature REAL,
    humidity REAL,
    device TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// API: прийом даних з ESP32
app.post('/api/data', (req, res) => {
  const { soil, temperature, humidity, device } = req.body;
  
  if (soil == null || temperature == null || humidity == null) {
    return res.status(400).json({ error: "Invalid data" });
  }

  db.run(
    `INSERT INTO readings (soil, temperature, humidity, device) VALUES (?, ?, ?, ?)`,
    [soil, temperature, humidity, device || "unknown"],
    function(err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "DB error" });
      } else {
        console.log(`New data: ${soil}, ${temperature}°C, ${humidity}%`);
        res.json({ success: true, id: this.lastID });
      }
    }
  );
});

// API: останні дані
app.get('/api/latest', (req, res) => {
  db.all(`SELECT * FROM readings ORDER BY timestamp DESC LIMIT 50`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.reverse()); // від старого до нового
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
