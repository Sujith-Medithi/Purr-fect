import Workout from '../models/Workout.js';

/**
 * @route   GET /api/workouts
 * @desc    Get all workout sessions for logged-in user
 * @access  Private
 */
export const getWorkouts = async (req, res) => {
  try {
    const sortOrder = req.query.sort === 'asc' ? 1 : -1; // Default to desc (-1)
    const workouts = await Workout.find({ user: req.user.id }).sort({ date: sortOrder });

    res.status(200).json({ success: true, workouts });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ message: 'Server error retrieving workout history' });
  }
};

/**
 * @route   POST /api/workouts
 * @desc    Create a new workout session
 * @access  Private
 */
export const createWorkout = async (req, res) => {
  try {
    const { exerciseName, date, duration, totalReps, accuracy, calories, completed, dayOfWeek, completedDates } = req.body;

    if (!exerciseName || duration === undefined || totalReps === undefined) {
      return res.status(400).json({ message: 'Please provide exerciseName, duration, and totalReps' });
    }

    const parsedDate = date ? new Date(date) : new Date();
    const finalAccuracy = accuracy !== undefined ? accuracy : 100;
    const finalCalories = calories !== undefined ? calories : 0;

    const workout = await Workout.create({
      user: req.user.id,
      exerciseName,
      date: parsedDate,
      duration,
      totalReps,
      accuracy: finalAccuracy,
      calories: finalCalories,
      completed: completed || false,
      dayOfWeek,
      completedDates: completedDates || [],
    });

    res.status(201).json({ success: true, workout });
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({ message: 'Server error creating workout session' });
  }
};

/**
 * @route   PUT /api/workouts/:id
 * @desc    Update an existing workout session
 * @access  Private
 */
export const updateWorkout = async (req, res) => {
  try {
    const { exerciseName, date, duration, totalReps, accuracy, calories, completed, dayOfWeek, completedDates } = req.body;

    if (!exerciseName || duration === undefined || totalReps === undefined) {
      return res.status(400).json({ message: 'Please provide exerciseName, duration, and totalReps' });
    }

    const parsedDate = date ? new Date(date) : new Date();
    const finalAccuracy = accuracy !== undefined ? accuracy : 100;
    const finalCalories = calories !== undefined ? calories : 0;

    const updateFields = {
      exerciseName,
      date: parsedDate,
      duration,
      totalReps,
      accuracy: finalAccuracy,
      calories: finalCalories,
      completed: completed !== undefined ? completed : false,
    };

    if (dayOfWeek !== undefined) updateFields.dayOfWeek = dayOfWeek;
    if (completedDates !== undefined) updateFields.completedDates = completedDates;

    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!workout) {
      return res.status(404).json({ message: 'Workout session not found or unauthorized' });
    }

    res.status(200).json({ success: true, workout });
  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({ message: 'Server error updating workout session' });
  }
};

/**
 * @route   DELETE /api/workouts/:id
 * @desc    Delete a workout session
 * @access  Private
 */
export const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!workout) {
      return res.status(404).json({ message: 'Workout session not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Workout session deleted successfully' });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ message: 'Server error deleting workout session' });
  }
};

/**
 * @route   GET /api/workouts/report
 * @desc    Generate performance report metrics and improvement suggestions
 * @access  Private
 */
export const getWorkoutReport = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.id });

    if (!workouts || workouts.length === 0) {
      return res.status(200).json({
        success: true,
        report: {
          totalWorkouts: 0,
          totalReps: 0,
          averageAccuracy: 0,
          bestExercise: 'N/A',
          weakestExercise: 'N/A',
          caloriesBurned: 0,
          workoutTime: 0,
          improvementSuggestions: ['Log your first workout to generate suggestions!'],
        }
      });
    }

    const totalWorkouts = workouts.length;
    const totalReps = workouts.reduce((sum, w) => sum + (w.totalReps || 0), 0);
    const caloriesBurned = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    const workoutTime = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const averageAccuracy = Math.round(workouts.reduce((sum, w) => sum + (w.accuracy || 0), 0) / totalWorkouts);

    // Group by exercise name for best and weakest calculations
    const exerciseGroups = workouts.reduce((groups, w) => {
      const name = w.exerciseName;
      if (!groups[name]) {
        groups[name] = { totalAcc: 0, count: 0 };
      }
      groups[name].totalAcc += w.accuracy || 0;
      groups[name].count += 1;
      return groups;
    }, {});

    const exerciseStats = Object.keys(exerciseGroups).map(name => ({
      name,
      avgAccuracy: Math.round(exerciseGroups[name].totalAcc / exerciseGroups[name].count),
      count: exerciseGroups[name].count
    }));

    // Find best and weakest based on accuracy
    let bestExercise = 'N/A';
    let weakestExercise = 'N/A';
    
    if (exerciseStats.length > 0) {
      const sortedAcc = [...exerciseStats].sort((a, b) => b.avgAccuracy - a.avgAccuracy);
      bestExercise = `${sortedAcc[0].name} (${sortedAcc[0].avgAccuracy}%)`;
      weakestExercise = `${sortedAcc[sortedAcc.length - 1].name} (${sortedAcc[sortedAcc.length - 1].avgAccuracy}%)`;
    }

    // Generate dynamic improvement suggestions
    const improvementSuggestions = [];

    // Rule 1: Frequency Check (within the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentWorkouts = workouts.filter(w => new Date(w.date) >= sevenDaysAgo).length;

    if (recentWorkouts < 3) {
      improvementSuggestions.push(
        `Try aiming for at least 3 workouts a week (you completed ${recentWorkouts} recently). Consistency is key to building stamina.`
      );
    } else {
      improvementSuggestions.push(
        `Great job maintaining a highly active workout schedule this week with ${recentWorkouts} sessions!`
      );
    }

    // Rule 2: Low Accuracy Check
    const lowAccuracyExercises = exerciseStats.filter(e => e.avgAccuracy < 80);
    if (lowAccuracyExercises.length > 0) {
      const names = lowAccuracyExercises.map(e => e.name).join(', ');
      improvementSuggestions.push(
        `Your accuracy for ${names} is currently under 80%. Consider slowing down the repetitions and enabling the real-time Voice Feedback to lock in perfect posture.`
      );
    }

    // Rule 3: Balance check
    const totalSquats = exerciseGroups['Squats']?.count || 0;
    const totalPushups = exerciseGroups['Push-ups']?.count || 0;
    if (totalSquats > 0 && totalPushups === 0) {
      improvementSuggestions.push(
        `You've been focused on lower-body training. Try adding Push-ups or Planks to balance with core and upper-body strength.`
      );
    } else if (totalPushups > 0 && totalSquats === 0) {
      improvementSuggestions.push(
        `You've been focused on upper-body training. Try adding Squats or Lunges to build base leg and knee stability.`
      );
    }

    // General encouragement
    if (averageAccuracy >= 90) {
      improvementSuggestions.push(
        `Your average alignment accuracy is exceptional (${averageAccuracy}%). Keep up the precise posture control!`
      );
    } else {
      improvementSuggestions.push(
        `Focus on standard movements. Pay close attention to red joint highlights on the webcam skeleton to correct alignment errors instantly.`
      );
    }

    res.status(200).json({
      success: true,
      report: {
        totalWorkouts,
        totalReps,
        averageAccuracy,
        bestExercise,
        weakestExercise,
        caloriesBurned,
        workoutTime,
        improvementSuggestions
      }
    });
  } catch (error) {
    console.error('Get workout report error:', error);
    res.status(500).json({ message: 'Server error generating workout report' });
  }
};
