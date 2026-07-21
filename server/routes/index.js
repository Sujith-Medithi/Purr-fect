import { Router } from 'express';
import authRoutes from './authRoutes.js';
import habitRoutes from './habitRoutes.js';
import workoutRoutes from './workoutRoutes.js';

const router = Router();

// Register route modules below
router.use('/auth', authRoutes);
router.use('/habits', habitRoutes);
router.use('/workouts', workoutRoutes);

export default router;
