
import pool from '../db.js';

export const getAccountants = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM accountants ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createAccountant = async (req, res) => {
  try {
    const [result] = await pool.query('INSERT INTO accountants SET ?', [req.body]);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
