const db = require('../config/db');

// Find user by username (used during login)
const findByUsername = async (username) => {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  return rows[0];
};

// Find user by ID (used to check session)
const findById = async (id) => {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
};

// Get all users
const getAllUsers = async () => {
  const [rows] = await db.execute(
    'SELECT id, name, username, role, created_at FROM users'
  );
  return rows;
};

// Create new user
const createUser = async (name, username, hashedPassword, role) => {
  const [result] = await db.execute(
    'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
    [name, username, hashedPassword, role]
  );
  return result;
};

module.exports = {
  findByUsername,
  findById,
  getAllUsers,
  createUser
};