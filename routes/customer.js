const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const customerModel = require('../models/customerModel');
const rationModel = require('../models/rationModel');
const stockModel = require('../models/stockModel');
const db = require('../config/db');

// Customer portal page
router.get('/portal', (req, res) => {
  if (!req.session.customer) {
    return res.redirect('/');
  }
  res.sendFile('customer-portal.html', { root: './public' });
});

// Customer login
router.post('/login', async (req, res) => {
  try {
    const { ration_card_no, password } = req.body;

    const customer = await customerModel.findByRationCard(ration_card_no);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid ration card number or password' });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid ration card number or password' });
    }

    req.session.customer = {
      id: customer.id,
      name: customer.name,
      ration_card_no: customer.ration_card_no,
      phone: customer.phone,
      address: customer.address
    };

    return res.json({ success: true });

  } catch (error) {
    console.error('Customer login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Customer register
router.post('/register', async (req, res) => {
  try {
    const { name, ration_card_no, phone, address, password, family_members } = req.body;

    if (!name || !ration_card_no || !password) {
      return res.status(400).json({ success: false, message: 'Name, ration card number and password are required' });
    }

    const existing = await customerModel.findByRationCard(ration_card_no);
    if (existing) {
      return res.status(400).json({ success: false, message: 'This ration card is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await customerModel.createCustomer(name, ration_card_no, phone, address, hashedPassword, family_members || 1);

    return res.json({ success: true, message: 'Registration successful! You can now login.' });

  } catch (error) {
    console.error('Customer register error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /customer/me
// Returns BOTH `customer` and `user` keys so all pages work without changes:
//   - customer-portal.js reads data.customer
//   - customer-alerts.html reads data.user
router.get('/me', (req, res) => {
  if (req.session.customer) {
    return res.json({
      success: true,
      customer: req.session.customer,
      user: req.session.customer
    });
  }
  return res.status(401).json({ success: false, message: 'Not logged in' });
});

// Get customer transactions
router.get('/my-transactions', async (req, res) => {
  if (!req.session.customer) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }
  try {
    const transactions = await rationModel.getByRationCard(req.session.customer.ration_card_no);
    return res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Transactions error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get available stock (read only for customer)
router.get('/available-stock', async (req, res) => {
  if (!req.session.customer) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }
  try {
    const stock = await stockModel.getAllStock();
    return res.json({ success: true, data: stock });
  } catch (error) {
    console.error('Stock error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Customer logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Get customer profile
router.get('/profile', async (req, res) => {
  if (!req.session.customer) return res.status(401).json({ success: false });
  try {
    const customer = await customerModel.findById(req.session.customer.id);
    res.json({ success: true, data: customer });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// Update customer profile
router.post('/update-profile', async (req, res) => {
  if (!req.session.customer) return res.status(401).json({ success: false });
  try {
    const { email, avatar_color, avatar_letter, language, notifications } = req.body;
    await db.execute(
      'UPDATE customers SET email=?, avatar_color=?, avatar_letter=?, language=?, notifications=? WHERE id=?',
      [email, avatar_color, avatar_letter, language, notifications, req.session.customer.id]
    );
    res.json({ success: true, message: '✅ Profile updated successfully!' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change customer password
router.post('/change-password', async (req, res) => {
  if (!req.session.customer) return res.status(401).json({ success: false });
  try {
    const { current_password, new_password } = req.body;
    const customer = await customerModel.findById(req.session.customer.id);
    const isMatch = await bcrypt.compare(current_password, customer.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(new_password, 10);
    await db.execute('UPDATE customers SET password=? WHERE id=?', [hashed, req.session.customer.id]);
    res.json({ success: true, message: '✅ Password changed successfully!' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;