import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    exerciseName: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Workout date is required'],
      default: Date.now,
    },
    duration: {
      type: Number, // duration in minutes
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    totalReps: {
      type: Number,
      required: [true, 'Total reps is required'],
      min: [0, 'Total reps cannot be negative'],
    },
    accuracy: {
      type: Number, // percentage from 0 to 100
      default: 100,
      min: [0, 'Accuracy cannot be less than 0%'],
      max: [100, 'Accuracy cannot exceed 100%'],
    },
    calories: {
      type: Number,
      default: 0,
      min: [0, 'Calories cannot be negative'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    dayOfWeek: {
      type: String,
      default: function() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayIdx = new Date().getDay();
        return days[dayIdx];
      },
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    completedDates: {
      type: [Date],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;
