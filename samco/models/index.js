const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Initialize shopping cart in session
router.use((req, res, next) => {
  if (!req.session.cart) req.session.cart = [];
  next();
});

// Home page
router.get('/', (req, res) => res.render('index'));

// Products listing
router.get('/products', async (req, res) => {
  const products = await Product.find();
  res.render('products', { products });
});

// Cart view
router.get('/cart', (req, res) => res.render('cart', { cart: req.session.cart }));

// Add to cart
router.post('/cart', async (req, res) => {
  const product = await Product.findById(req.body.productId);
  req.session.cart.push(product);
  res.redirect('/cart');
});

// Checkout page
router.get('/checkout', (req, res) => res.render('checkout'));

// Admin interface
router.get('/admin', (req, res) => res.render('admin'));
router.post('/admin', async (req, res) => {
  const { name, price, image, description } = req.body;
  await Product.create({ name, price, image, description });
  res.redirect('/products');
});

module.exports = router;
