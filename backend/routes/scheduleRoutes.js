import express from 'express';
import { updateSchedule, deleteSchedule } from '../controllers/scheduleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:id')
  .put(protect, authorize('Opérateur'), updateSchedule)
  .delete(protect, authorize('Opérateur'), deleteSchedule);

export default router;
