const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/products', (req, res) => {
  const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
  res.send(data);
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index2.html'));
})

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});