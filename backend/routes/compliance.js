
import express from 'express';
import { getFilings, createFiling, updateFiling, deleteFiling } from '../controllers/complianceController.js';
const router = express.Router();

router.get('/', getFilings);
router.post('/', createFiling);
router.put('/:id', updateFiling);
router.delete('/:id', deleteFiling);

export default router;
