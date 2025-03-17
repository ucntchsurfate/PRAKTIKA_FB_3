const express = require('express');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');

const app = express();
const PORT = 4000;
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

app.use(cors());
app.use(express.json());

const swaggerDocument = yaml.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

function getProducts() {
  return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

const schema = buildSchema(`
  type Product {
    id: Int!
    name: String!
    price: Int!
    description: String
    categories: [String!]
  }
  type Query {
    products: [Product]
    product(id: Int!): Product
  }
  type Mutation {
    addProduct(name: String!, price: Int!, description: String, categories: [String!]): Product
    deleteProduct(id: Int!): Product
    updateProduct(id: Int!, name: String, price: Int, description: String, categories: [String!]): Product
  }
`);

const root = {
  products: () => getProducts(),
  product: ({ id }) => getProducts().find(p => p.id === id),
  addProduct: ({ name, price, description, categories }) => {
    const products = getProducts();
    const newProduct = { id: products.length + 1, name, price, description, categories };
    products.push(newProduct);
    saveProducts(products);
    return newProduct;
  },
  deleteProduct: ({ id }) => {
    let products = getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) return null;
    const deletedProduct = products.splice(productIndex, 1)[0];
    saveProducts(products);
    return deletedProduct;
  },
  updateProduct: ({ id, name, price, description, categories }) => {
    let products = getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) return null;
    if (name !== undefined) products[productIndex].name = name;
    if (price !== undefined) products[productIndex].price = price;
    if (description !== undefined) products[productIndex].description = description;
    if (categories !== undefined) products[productIndex].categories = categories;
    saveProducts(products);
    return products[productIndex];
  }
};

app.use('/graphql', graphqlHTTP({ schema, rootValue: root, graphiql: true }));

app.get('/api/products', (req, res) => res.json(getProducts()));

app.get('/api/products/:id', (req, res) => {
  const product = getProducts().find(p => p.id === parseInt(req.params.id));
  product ? res.json(product) : res.status(404).json({ error: "Товар не найден" });
});

app.post('/api/products', (req, res) => {
  const { name, price, description, categories } = req.body;
  const products = getProducts();
  const newProduct = { id: products.length + 1, name, price, description, categories };
  products.push(newProduct);
  saveProducts(products);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const products = getProducts();
  const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
  if (productIndex === -1) return res.status(404).json({ error: "Товар не найден" });
  Object.assign(products[productIndex], req.body);
  saveProducts(products);
  res.json(products[productIndex]);
});

app.delete('/api/products/:id', (req, res) => {
  let products = getProducts();
  const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
  if (productIndex === -1) return res.status(404).json({ error: "Товар не найден" });
  const deletedProduct = products.splice(productIndex, 1)[0];
  saveProducts(products);
  res.json(deletedProduct);
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on('connection', ws => {
  clients.add(ws);
  ws.on('message', message => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    });
  });
  ws.on('close', () => clients.delete(ws));
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}/graphql`);
  console.log(`Swagger доступен на http://localhost:${PORT}/api-docs`);
  console.log(`WebSocket сервер работает на ws://localhost:${PORT}`);
});
