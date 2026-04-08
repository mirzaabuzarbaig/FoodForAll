const db = require('../config/db');

const getAllStock = async () => {
  const [rows] = await db.execute(
    'SELECT * FROM stock ORDER BY created_at DESC'
  );
  return rows;
};

const getStockById = async (id) => {
  const [rows] = await db.execute(
    'SELECT * FROM stock WHERE id = ?',
    [id]
  );
  return rows[0];
};

const addStock = async (item_name, total_quantity, unit, alert_threshold, per_person_quota) => {
  const [result] = await db.execute(
    'INSERT INTO stock (item_name, total_quantity, unit, alert_threshold, per_person_quota) VALUES (?, ?, ?, ?, ?)',
    [item_name, total_quantity, unit, alert_threshold, per_person_quota]
  );
  return result;
};

const updateStock = async (id, quantity) => {
  const [result] = await db.execute(
    'UPDATE stock SET total_quantity = total_quantity + ? WHERE id = ?',
    [quantity, id]
  );
  return result;
};

const reduceStock = async (id, quantity) => {
  const [result] = await db.execute(
    'UPDATE stock SET distributed_quantity = distributed_quantity + ? WHERE id = ?',
    [quantity, id]
  );
  return result;
};

const getLowStock = async () => {
  const [rows] = await db.execute(
    `SELECT *, (total_quantity - distributed_quantity) AS remaining
     FROM stock
     WHERE (total_quantity - distributed_quantity) <= alert_threshold`
  );
  return rows;
};

const getSummary = async () => {
  const [rows] = await db.execute(
    `SELECT
      SUM(total_quantity) AS total,
      SUM(distributed_quantity) AS distributed,
      SUM(total_quantity - distributed_quantity) AS remaining
     FROM stock`
  );
  return rows[0];
};

// Reset cycle when stock is refilled
const resetCycle = async (id) => {
  const [result] = await db.execute(
    'UPDATE stock SET current_cycle = current_cycle + 1, distributed_quantity = 0 WHERE id = ?',
    [id]
  );
  return result;
};
const deleteStock = async (id) => {
  const [result] = await db.execute(
    'DELETE FROM stock WHERE id = ?',
    [id]
  );
  return result;
};
module.exports = {
  getAllStock,
  getStockById,
  addStock,
  updateStock,
  reduceStock,
  getLowStock,
  getSummary,
  resetCycle,
  deleteStock
};