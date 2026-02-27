
import express from 'express';
import { getClients, createClient, updateClient } from '../controllers/clientController.js';
const router = express.Router();

router.get('/', getClients);
router.post('/', createClient);
router.put('/:id', updateClient);

export default router;
