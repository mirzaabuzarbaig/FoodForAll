const db = require('../config/db');

const findByRationCard = async (ration_card_no) => {
  const [rows] = await db.execute(
    'SELECT * FROM customers WHERE ration_card_no = ?',
    [ration_card_no]
  );
  return rows[0];
};

const findById = async (id) => {
  const [rows] = await db.execute(
    'SELECT * FROM customers WHERE id = ?',
    [id]
  );
  return rows[0];
};

const createCustomer = async (name, ration_card_no, phone, address, hashedPassword, family_members) => {
  const [result] = await db.execute(
    'INSERT INTO customers (name, ration_card_no, phone, address, password, family_members) VALUES (?, ?, ?, ?, ?, ?)',
    [name, ration_card_no, phone, address, hashedPassword, family_members || 1]
  );
  return result;
};

const getAllCustomers = async () => {
  const [rows] = await db.execute(
    'SELECT id, name, ration_card_no, phone, address, family_members, created_at FROM customers ORDER BY created_at DESC'
  );
  return rows;
};

module.exports = {
  findByRationCard,
  findById,
  createCustomer,
  getAllCustomers
};