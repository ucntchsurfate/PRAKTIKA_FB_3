const express = require('express');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

app.use(cors());

function getProducts() {
  const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
  return JSON.parse(data);
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
`);

const root = {
  products: () => getProducts(),
  product: ({ id }) => {
    const products = getProducts();
    return products.find(product => product.id === id);
  }
};

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true, 
}));

app.listen(PORT, () => {
  console.log(`GraphQL сервер запущен на http://localhost:${PORT}/graphql`);
});