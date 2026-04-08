const express = require('express');
const router  = express.Router();
const stockModel  = require('../models/stockModel');
const rationModel = require('../models/rationModel');

const isLoggedIn = (req, res, next) => {
  if (req.session.user) return next();
  return res.status(401).json({ success: false, message: 'Please login first' });
};

router.get('/stats', isLoggedIn, async (req, res) => {
  try {
    const summary            = await stockModel.getSummary();
    const lowStock           = await stockModel.getLowStock();
    const recentTransactions = await rationModel.getAllTransactions();
    const highAlerts         = await rationModel.getHighQuantityAlerts();

    res.json({
      success: true,
      data: {
        summary,
        lowStockCount:        lowStock.length,
        lowStockItems:        lowStock,
        recentTransactions:   recentTransactions.slice(0, 5),
        highAlerts:           highAlerts.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;