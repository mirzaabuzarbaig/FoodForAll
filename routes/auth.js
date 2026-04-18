const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const db = require('../config/db');

// Login page
router.get('/login', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// Login submit
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await userModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Save user in session

    req.session.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, message: 'Session error' });
      }
      return res.json({ success: true, role: user.role });
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Get current logged in user
router.get('/me', (req, res) => {
  if (req.session.user) {
    return res.json({ success: true, user: req.session.user });
  }
  return res.status(401).json({ success: false, message: 'Not logged in' });
});
// Get admin profile
router.get('/profile', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false });
  try {
    const user = await userModel.findById(req.session.user.id);
    res.json({ success: true, data: user });
  } catch (e) { res.status(500).json({ success: false }); }
});

// Update admin profile
router.post('/update-profile', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false });
  try {
    const { name, email, phone, theme, language, notifications } = req.body;
    await db.execute(
      'UPDATE users SET name=?, email=?, phone=?, theme=?, language=?, notifications=? WHERE id=?',
      [name, email, phone, theme, language, notifications, req.session.user.id]
    );
    req.session.user.name = name;
    res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Change admin password
router.post('/change-password', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false });
  try {
    const { current_password, new_password } = req.body;
    const user    = await userModel.findById(req.session.user.id);
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(new_password, 10);
    await db.execute('UPDATE users SET password=? WHERE id=?', [hashed, req.session.user.id]);
    res.json({ success: true, message: '✅ Password changed successfully!' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error' }); }
});
module.exports = router;