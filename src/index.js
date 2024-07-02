const express = require('express');
const mysql = require('mysql2');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'wazirx'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
});

// Fetch top 10 results from WazirX API and store them in MySQL
app.get('/', async (req, res) => {
    try {
      const response = await axios.get('https://api.wazirx.com/api/v2/tickers');
      const tickers = response.data;
      
      // Extract the top 10 tickers
      const top10Tickers = Object.values(tickers)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);
      
      // Prepare data for insertion with timestamp
      const values = top10Tickers.map(ticker => [
        ticker.name,
        ticker.last,
        ticker.buy,
        ticker.sell,
        ticker.volume,
        ticker.base_unit,
        new Date() // Adding current timestamp for insertion
      ]);
  
      // Insert data into MySQL
      const sql = 'INSERT INTO tickers (name, last, buy, sell, volume, base_unit, timestamp) VALUES ?';
      db.query(sql, [values], (err, result) => {
        if (err) {
          console.error('Error inserting data:', err);
          return res.status(500).send('Error inserting data into the database.');
        }
        // Automatically redirect to /displaydata route after successful insertion
        res.redirect('/newlyadded');
      });
    } catch (error) {
      console.error('Error fetching data from WazirX API:', error);
      res.status(500).send('Error fetching data from WazirX API.');
    }
  });
  

// Route to display the data stored in the database
app.get('/displaydata', (req, res) => {
  const sql = 'SELECT * FROM tickers';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching data from the database:', err);
      return res.status(500).send('Error fetching data from the database.');
    }
    res.render('display-data', { tickers: results });
  });
});

// Route to display only the newly added data
app.get('/newlyadded', (req, res) => {
    // Fetch latest 10 entries based on timestamp, ordered by timestamp descending
    const sql = 'SELECT * FROM tickers ORDER BY timestamp DESC LIMIT 10';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching newly added data from the database:', err);
        return res.status(500).send('Error fetching newly added data from the database.');
      }
      res.render('newlyadded', { tickers: results });
    });
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
