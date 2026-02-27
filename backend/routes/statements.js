
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Logic implemented directly for speed in MVP
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, c.company_name as client_name 
      FROM statements s JOIN clients c ON s.client_id = c.id
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const [result] = await pool.query('INSERT INTO statements SET ?', [req.body]);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE statements SET ? WHERE id = ?', [req.body, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM statements WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
