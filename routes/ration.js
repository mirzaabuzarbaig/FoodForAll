const express = require('express');
const router  = express.Router();
const rationModel   = require('../models/rationModel');
const stockModel    = require('../models/stockModel');
const customerModel = require('../models/customerModel');
const db            = require('../config/db');

const isLoggedIn = (req, res, next) => {
  if (req.session.user) return next();
  return res.status(401).json({ success: false, message: 'Please login first' });
};

// ✅ Accepts both staff (req.session.user) and customers (req.session.customer)
const isLoggedInAny = (req, res, next) => {
  if (req.session.user || req.session.customer) return next();
  return res.status(401).json({ success: false, message: 'Please login first' });
};

// Issue ration
router.post('/issue', isLoggedIn, async (req, res) => {
  try {
    const { stock_id, beneficiary_name, ration_card_no, quantity_issued, family_members } = req.body;

    if (!stock_id || !beneficiary_name || !ration_card_no || !quantity_issued) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (!family_members || family_members < 1) {
      return res.status(400).json({ success: false, message: 'Please enter number of family members' });
    }

    const stock = await stockModel.getStockById(stock_id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }

    const remaining = stock.total_quantity - stock.distributed_quantity;
    if (parseFloat(quantity_issued) > parseFloat(remaining)) {
      return res.status(400).json({ success: false, message: `Only ${remaining} ${stock.unit} available in stock` });
    }

    const allowed_qty = stock.per_person_quota * parseInt(family_members);

    if (stock.per_person_quota > 0) {
      const already_issued = await rationModel.checkAlreadyIssued(ration_card_no, stock_id, stock.current_cycle);
      const total_if_issued = parseFloat(already_issued) + parseFloat(quantity_issued);

      if (total_if_issued > allowed_qty) {
        const remaining_quota = (allowed_qty - parseFloat(already_issued)).toFixed(1);
        if (remaining_quota <= 0) {
          return res.status(400).json({
            success: false,
            message: `❌ Quota exceeded! This family already received their full quota of ${allowed_qty} ${stock.unit} for this cycle.`
          });
        }
        return res.status(400).json({
          success: false,
          message: `❌ Too much! ${family_members} members × ${stock.per_person_quota} ${stock.unit} = ${allowed_qty} ${stock.unit} allowed. Only ${remaining_quota} ${stock.unit} remaining in their quota.`
        });
      }
    }

    await rationModel.issueRation(stock_id, beneficiary_name, ration_card_no, quantity_issued, req.session.user.id, stock.current_cycle);

    const customer = await customerModel.findByRationCard(ration_card_no);
    if (customer) {
      await db.execute('UPDATE customers SET family_members = ? WHERE ration_card_no = ?', [family_members, ration_card_no]);
    }

    await stockModel.reduceStock(stock_id, quantity_issued);
    return res.json({ success: true, message: '✅ Ration issued successfully!' });

  } catch (error) {
    console.error('Issue ration error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all transactions
router.get('/transactions', isLoggedIn, async (req, res) => {
  try {
    const transactions = await rationModel.getAllTransactions();
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search by ration card
router.get('/search/:card', isLoggedIn, async (req, res) => {
  try {
    const transactions = await rationModel.getByRationCard(req.params.card);
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ GET /ration/high-alerts — open to both staff and customers
router.get('/high-alerts', isLoggedInAny, async (req, res) => {
  try {
    const alerts = await rationModel.getHighQuantityAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('High alert error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reset stock cycle (admin only)
router.post('/reset-cycle/:id', isLoggedIn, async (req, res) => {
  try {
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    await stockModel.resetCycle(req.params.id);
    res.json({ success: true, message: '✅ Cycle reset! Customers can now receive ration again.' });
  } catch (error) {
    console.error('Reset cycle error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;