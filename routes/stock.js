const express = require('express');
const router  = express.Router();
const stockModel = require('../models/stockModel');

const isLoggedIn = (req, res, next) => {
  if (req.session.user) return next();
  return res.status(401).json({ success: false, message: 'Please login first' });
};

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access only' });
};

// ✅ Accepts both staff (req.session.user) and customers (req.session.customer)
const isLoggedInAny = (req, res, next) => {
  if (req.session.user || req.session.customer) return next();
  return res.status(401).json({ success: false, message: 'Please login first' });
};

// Get all stock
router.get('/', isLoggedIn, async (req, res) => {
  try {
    const stock = await stockModel.getAllStock();
    res.json({ success: true, data: stock });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add new stock item (admin only)
router.post('/add', isAdmin, async (req, res) => {
  try {
    const { item_name, total_quantity, unit, alert_threshold, per_person_quota } = req.body;
    if (!item_name || !total_quantity || !unit) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    await stockModel.addStock(item_name, total_quantity, unit, alert_threshold || 10, per_person_quota || 0);
    res.json({ success: true, message: 'Stock added successfully' });
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update existing stock quantity (admin only)
router.post('/update/:id', isAdmin, async (req, res) => {
  try {
    const { quantity } = req.body;
    await stockModel.updateStock(req.params.id, quantity);
    res.json({ success: true, message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ GET /stock/alerts — open to both staff and customers
router.get('/alerts', isLoggedInAny, async (req, res) => {
  try {
    const lowStock = await stockModel.getLowStock();
    res.json({ success: true, data: lowStock });
  } catch (error) {
    console.error('Alert error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete stock item (admin only)
router.delete('/delete/:id', isAdmin, async (req, res) => {
  try {
    await stockModel.deleteStock(req.params.id);
    res.json({ success: true, message: 'Stock item deleted successfully' });
  } catch (error) {
    console.error('Delete stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;