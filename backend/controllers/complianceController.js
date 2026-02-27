
import pool from '../db.js';

export const getFilings = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, c.company_name as client_name 
      FROM compliance_filings f
      JOIN clients c ON f.client_id = c.id
      ORDER BY f.due_date ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createFiling = async (req, res) => {
  try {
    const [result] = await pool.query('INSERT INTO compliance_filings SET ?', [req.body]);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateFiling = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    await pool.query('UPDATE compliance_filings SET ? WHERE id = ?', [data, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteFiling = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM compliance_filings WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
