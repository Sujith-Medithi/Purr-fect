import { Router } from 'express';
import { getWorkouts, createWorkout, updateWorkout, deleteWorkout, getWorkoutReport } from '../controllers/workoutController.js';
import protect from '../middleware/auth.js';

const router = Router();

// Protect all workout routes
router.use(protect);

router.route('/')
  .get(getWorkouts)
  .post(createWorkout);

router.get('/report', getWorkoutReport);

router.route('/:id')
  .put(updateWorkout)
  .delete(deleteWorkout);

export default router;
