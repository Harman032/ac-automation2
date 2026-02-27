
import pool from '../db.js';

export const getClients = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createClient = async (req, res) => {
  const { company_name, business_number, contact_person, email, phone, industry, fiscal_year_end } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO clients (company_name, business_number, contact_person, email, phone, industry, fiscal_year_end) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [company_name, business_number, contact_person, email, phone, industry, fiscal_year_end]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateClient = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    await pool.query('UPDATE clients SET ? WHERE id = ?', [updates, id]);
    res.json({ message: 'Client updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
