
import express from 'express';
import { getAccountants, createAccountant } from '../controllers/accountantController.js';
const router = express.Router();

router.get('/', getAccountants);
router.post('/', createAccountant);

export default router;
