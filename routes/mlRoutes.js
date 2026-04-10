/**
 * routes/mlRoutes.js
 * Bridge between your Node.js Express app and the Python Flask ML service.
 */

const express = require('express');
const router  = express.Router();

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// ── Admin only (staff session) ────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// ── Allows both staff AND logged-in customers ─────────────────
function requireAny(req, res, next) {
  if ((req.session && req.session.user) || (req.session && req.session.customer)) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// ── Helper: call Flask ML service ────────────────────────────
async function callML(endpoint) {
  const res = await fetch(`${ML_BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`ML service error: ${res.status}`);
  return res.json();
}

// ── GET /ml/health ────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const data = await callML('/health');
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'ML service unavailable', detail: err.message });
  }
});

// ── GET /ml/demand-forecast ───────────────────────────────────
router.get('/demand-forecast', requireAdmin, async (req, res) => {
  try {
    const commodity = req.query.commodity || 'all';
    const data = await callML(`/api/ml/demand-forecast?commodity=${commodity}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /ml/stock-depletion ───────────────────────────────────
router.get('/stock-depletion', requireAdmin, async (req, res) => {
  try {
    const days = req.query.days || 30;
    const data = await callML(`/api/ml/stock-depletion?days=${days}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /ml/fraud-detect ──────────────────────────────────────
// ✅ Open to customers too — they can see suspicious activity
router.get('/fraud-detect', requireAny, async (req, res) => {
  try {
    const data = await callML('/api/ml/fraud-detect');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /ml/duplicate-detect ──────────────────────────────────
// ✅ Open to customers too — they can see duplicate alerts
router.get('/duplicate-detect', requireAny, async (req, res) => {
  try {
    const data = await callML('/api/ml/duplicate-detect');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;