const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const http = require('http');
require('dotenv').config();

const authRoutes      = require('./routes/auth');
const stockRoutes     = require('./routes/stock');
const rationRoutes    = require('./routes/ration');
const dashboardRoutes = require('./routes/dashboard');
const customerRoutes  = require('./routes/customer');
const mlRoutes        = require('./routes/mlRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Store (MySQL — required for Vercel serverless)
const sessionStore = new MySQLStore({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000,
  createDatabaseTable: true
});

sessionStore.on('error', (err) => {
  console.error('Session store error:', err);
});

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: true,
    sameSite: 'none'
  }
}));

// ── App Routes ────────────────────────────────────────────────
app.use('/auth',      authRoutes);
app.use('/stock',     stockRoutes);
app.use('/ration',    rationRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/customer',  customerRoutes);
app.use('/ml',        mlRoutes);

// ── /api/ml/* proxy → Flask (Koyeb) ──────────────────────────
app.use('/api/ml', (req, res) => {
  const ML_HOST = process.env.ML_SERVICE_URL || 'http://localhost:5001';
  const target  = `${ML_HOST}/api/ml${req.url}`;

  const urlObj = new URL(target);

  const options = {
    hostname: urlObj.hostname,
    port:     urlObj.port || 443,
    path:     urlObj.pathname + (urlObj.search || ''),
    method:   req.method,
    headers:  { 'Content-Type': 'application/json' }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    res.setHeader('Content-Type', 'application/json');
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('ML proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: 'ML service unavailable',
      detail: err.message
    });
  });

  proxyReq.end();
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Debug routes — remove after fix ──────────────────────────
app.get('/debug-session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    user: req.session.user || null,
    cookie: req.session.cookie
  });
});

app.post('/debug-login', (req, res) => {
  req.session.regenerate((err) => {
    if (err) return res.json({ step: 'regenerate failed', error: err.message });

    req.session.user = { id: 1, name: 'Test', role: 'admin' };

    req.session.save((saveErr) => {
      if (saveErr) return res.json({ step: 'save failed', error: saveErr.message });
      res.json({ step: 'success', sessionID: req.sessionID, user: req.session.user });
    });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});