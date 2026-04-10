// Auto-start Python ML service
const { spawn } = require('child_process');
const mlProcess = spawn('python', ['-m', 'ml.ml_service'], {
  cwd: __dirname,
  stdio: 'inherit'
});

mlProcess.on('error', (err) => {
  console.log('ML service could not start:', err.message);
});

mlProcess.on('close', (code) => {
  console.log('ML service stopped with code:', code);
});

process.on('exit', () => {
  mlProcess.kill();
});

const express = require('express');
const session = require('express-session');
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

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// ── App Routes ────────────────────────────────────────────────
app.use('/auth',      authRoutes);
app.use('/stock',     stockRoutes);
app.use('/ration',    rationRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/customer',  customerRoutes);
app.use('/ml',        mlRoutes);

// ── /api/ml/* proxy → Flask on port 5001 ─────────────────────
// dashboard.js calls /api/ml/demand-forecast, /api/ml/fraud-detect etc.
// This manually proxies those requests to the Python ML service.
app.use('/api/ml', (req, res) => {
  const ML_HOST = process.env.ML_SERVICE_URL || 'http://localhost:5001';
  const target  = `${ML_HOST}/api/ml${req.url}`;

  const urlObj = new URL(target);

  const options = {
    hostname: urlObj.hostname,
    port:     urlObj.port || 5001,
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});