const db = require('../config/db');

const issueRation = async (stock_id, beneficiary_name, ration_card_no, quantity_issued, issued_by, cycle_id) => {
  const [result] = await db.execute(
    `INSERT INTO transactions
     (stock_id, beneficiary_name, ration_card_no, quantity_issued, issued_by, cycle_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [stock_id, beneficiary_name, ration_card_no, quantity_issued, issued_by, cycle_id]
  );
  return result;
};

const getAllTransactions = async () => {
  const [rows] = await db.execute(
    `SELECT t.*, s.item_name, s.unit, u.name AS issued_by_name
     FROM transactions t
     JOIN stock s ON t.stock_id = s.id
     JOIN users u ON t.issued_by = u.id
     ORDER BY t.issued_at DESC`
  );
  return rows;
};

const getByRationCard = async (ration_card_no) => {
  const [rows] = await db.execute(
    `SELECT t.*, s.item_name, s.unit
     FROM transactions t
     JOIN stock s ON t.stock_id = s.id
     WHERE t.ration_card_no = ?
     ORDER BY t.issued_at DESC`,
    [ration_card_no]
  );
  return rows;
};

// Check if customer already received ration for this stock in current cycle
const checkAlreadyIssued = async (ration_card_no, stock_id, cycle_id) => {
  const [rows] = await db.execute(
    `SELECT SUM(quantity_issued) AS total_issued
     FROM transactions
     WHERE ration_card_no = ? AND stock_id = ? AND cycle_id = ?`,
    [ration_card_no, stock_id, cycle_id]
  );
  return rows[0].total_issued || 0;
};

// Get high quantity alerts (transactions above allowed quota)
const getHighQuantityAlerts = async () => {
  const [rows] = await db.execute(
    `SELECT t.*, s.item_name, s.unit, s.per_person_quota, u.name AS issued_by_name,
            c.family_members,
            (s.per_person_quota * COALESCE(c.family_members, 1)) AS allowed_qty
     FROM transactions t
     JOIN stock s ON t.stock_id = s.id
     JOIN users u ON t.issued_by = u.id
     LEFT JOIN customers c ON t.ration_card_no = c.ration_card_no
     WHERE s.per_person_quota > 0
     AND t.quantity_issued > (s.per_person_quota * COALESCE(c.family_members, 1))
     ORDER BY t.issued_at DESC`
  );
  return rows;
};

module.exports = {
  issueRation,
  getAllTransactions,
  getByRationCard,
  checkAlreadyIssued,
  getHighQuantityAlerts
};