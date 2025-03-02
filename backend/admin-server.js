const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8080;
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

app.use(express.json());

function getProducts() {
  const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

app.get('/api/products', (req, res) => {
  res.json(getProducts());
});

app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id, 10);
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      res.json(product); 
    } else {
      console.log('Товар не найден');
      res.status(404).send('Товар не найден');
    }
  });

app.post('/api/products', (req, res) => {
  const newProduct = req.body;
  const products = getProducts();
  newProduct.id = products.length + 1;
  products.push(newProduct);
  saveProducts(products);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id, 10);
    const updatedProduct = req.body;
    const products = getProducts();
  
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedProduct };
      saveProducts(products);
      res.json(products[index]);
    } else {
      console.log('Товар не найден');
      res.status(404).send('Товар не найден');
    }
});

app.patch('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id, 10);
    const updatedFields = req.body;
    const products = getProducts();
  
    console.log('Запрошен ID:', productId); 
    console.log('Текущие товары:', products);
  
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedFields };
      saveProducts(products);
      res.json(products[index]);
    } else {
      console.log('Товар не найден'); 
      res.status(404).send('Товар не найден');
    }
  });

app.delete('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const products = getProducts();
  const index = products.findIndex(p => p.id === productId);
  if (index !== -1) {
    products.splice(index, 1);
    saveProducts(products);
    res.json({ message: `Товар с ID ${productId} удален` });
  } else {
    res.status(404).send('Товар не найден');
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});