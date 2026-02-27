
import express from 'express';
import { getDashboardStats, getAlerts, sendBatchReminders } from '../controllers/dashboardController.js';
const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/alerts', getAlerts);
router.post('/remind/:type', sendBatchReminders);

export default router;
