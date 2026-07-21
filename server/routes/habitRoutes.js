import { Router } from 'express';
import { getHabits, createHabit, updateHabit, deleteHabit, toggleHabit } from '../controllers/habitController.js';
import protect from '../middleware/auth.js';

const router = Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getHabits)
  .post(createHabit);

router.route('/:id')
  .put(updateHabit)
  .delete(deleteHabit);

router.post('/:id/toggle', toggleHabit);

export default router;
