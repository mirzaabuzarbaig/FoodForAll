const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const authRoutes      = require('./routes/auth');
const stockRoutes     = require('./routes/stock');
const rationRoutes    = require('./routes/ration');
const dashboardRoutes = require('./routes/dashboard');
const customerRoutes  = require('./routes/customer');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Routes
app.use('/auth',      authRoutes);
app.use('/stock',     stockRoutes);
app.use('/ration',    rationRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/customer',  customerRoutes);

// Root route - serve main login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
 
// Also add ML routes (move this line up)
const mlRoutes = require('./routes/mlRoutes');
app.use('/ml', mlRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
app.use('/api/ml', (req, res) => {
  // proxy to http://localhost:5001/api/ml
});