import Habit from '../models/Habit.js';

// Helper to calculate streak in a timezone-safe manner
const calculateStreak = (completedDates, todayStr) => {
  if (!completedDates || completedDates.length === 0) return 0;

  // Sort dates lexicographically descending ("YYYY-MM-DD" sorts perfectly)
  const sorted = [...new Set(completedDates)].sort((a, b) => b.localeCompare(a));

  const parseDate = (dStr) => {
    const [year, month, day] = dStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const todayUTC = parseDate(todayStr);
  const yesterdayUTC = new Date(todayUTC);
  yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
  const yesterdayStr = formatDate(yesterdayUTC);

  let checkStr = todayStr;
  if (!sorted.includes(todayStr)) {
    if (sorted.includes(yesterdayStr)) {
      checkStr = yesterdayStr;
    } else {
      return 0; // Not completed today or yesterday, streak is broken
    }
  }

  let streak = 0;
  let curr = parseDate(checkStr);

  while (true) {
    const formatted = formatDate(curr);
    if (sorted.includes(formatted)) {
      streak++;
      curr.setUTCDate(curr.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * @route   GET /api/habits
 * @desc    Get all habits for logged-in user
 * @access  Private
 */
export const getHabits = async (req, res) => {
  try {
    const todayStr = req.query.today || new Date().toISOString().split('T')[0];
    const habits = await Habit.find({ user: req.user.id });

    const formattedHabits = habits.map((habit) => {
      const isCompletedToday = habit.completedDates.includes(todayStr);
      const streak = calculateStreak(habit.completedDates, todayStr);
      return {
        _id: habit._id,
        name: habit.name,
        description: habit.description,
        completedDates: habit.completedDates,
        isCompletedToday,
        streak,
      };
    });

    res.status(200).json({ success: true, habits: formattedHabits });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ message: 'Server error retrieving habits' });
  }
};

/**
 * @route   POST /api/habits
 * @desc    Create a new habit
 * @access  Private
 */
export const createHabit = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Habit name is required' });
    }

    const habit = await Habit.create({
      user: req.user.id,
      name,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      habit: {
        _id: habit._id,
        name: habit.name,
        description: habit.description,
        completedDates: habit.completedDates,
        isCompletedToday: false,
        streak: 0,
      },
    });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ message: 'Server error creating habit' });
  }
};

/**
 * @route   PUT /api/habits/:id
 * @desc    Update a habit details
 * @access  Private
 */
export const updateHabit = async (req, res) => {
  try {
    const { name, description } = req.body;
    const todayStr = req.query.today || new Date().toISOString().split('T')[0];

    if (!name) {
      return res.status(400).json({ message: 'Habit name is required' });
    }

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name, description: description || '' },
      { new: true }
    );

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found or unauthorized' });
    }

    const isCompletedToday = habit.completedDates.includes(todayStr);
    const streak = calculateStreak(habit.completedDates, todayStr);

    res.status(200).json({
      success: true,
      habit: {
        _id: habit._id,
        name: habit.name,
        description: habit.description,
        completedDates: habit.completedDates,
        isCompletedToday,
        streak,
      },
    });
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ message: 'Server error updating habit' });
  }
};

/**
 * @route   DELETE /api/habits/:id
 * @desc    Delete a habit
 * @access  Private
 */
export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ message: 'Server error deleting habit' });
  }
};

/**
 * @route   POST /api/habits/:id/toggle
 * @desc    Toggle completion of a habit for a specific date
 * @access  Private
 */
export const toggleHabit = async (req, res) => {
  try {
    const { date } = req.body; // Expecting YYYY-MM-DD
    const todayStr = req.query.today || new Date().toISOString().split('T')[0];

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'A valid date (YYYY-MM-DD) is required to toggle completion' });
    }

    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found or unauthorized' });
    }

    const index = habit.completedDates.indexOf(date);
    if (index > -1) {
      // Already completed, remove date (mark incomplete)
      habit.completedDates.splice(index, 1);
    } else {
      // Mark complete, add date
      habit.completedDates.push(date);
    }

    await habit.save();

    const isCompletedToday = habit.completedDates.includes(todayStr);
    const streak = calculateStreak(habit.completedDates, todayStr);

    res.status(200).json({
      success: true,
      habit: {
        _id: habit._id,
        name: habit.name,
        description: habit.description,
        completedDates: habit.completedDates,
        isCompletedToday,
        streak,
      },
    });
  } catch (error) {
    console.error('Toggle habit error:', error);
    res.status(500).json({ message: 'Server error toggling habit' });
  }
};
