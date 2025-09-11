import { Router } from 'express';
import { WorkoutService } from '../services/workoutService';
import { CreateWorkoutRequest, UpdateWorkoutRequest } from '../types';

const router = Router();
const workoutService = new WorkoutService();

// GET /api/workouts - Get all workouts
router.get('/', async (req, res) => {
  try {
    const workouts = await workoutService.getAllWorkouts();
    res.json(workouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// GET /api/workouts/dates - Get all workout dates
router.get('/dates', async (req, res) => {
  try {
    const dates = await workoutService.getWorkoutDates();
    res.json(dates);
  } catch (error) {
    console.error('Error fetching workout dates:', error);
    res.status(500).json({ error: 'Failed to fetch workout dates' });
  }
});

// GET /api/workouts/range?start=date&end=date - Get workouts by date range
router.get('/range', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end || typeof start !== 'string' || typeof end !== 'string') {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const workouts = await workoutService.getWorkoutsByDateRange(start, end);
    res.json(workouts);
  } catch (error) {
    console.error('Error fetching workouts by range:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// GET /api/workouts/date/:date - Get workout by specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const workout = await workoutService.getWorkoutByDate(date);
    
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found for this date' });
    }

    res.json(workout);
  } catch (error) {
    console.error('Error fetching workout by date:', error);
    res.status(500).json({ error: 'Failed to fetch workout' });
  }
});

// GET /api/workouts/:id - Get workout by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workout ID' });
    }

    const workout = await workoutService.getWorkoutById(id);
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    res.json(workout);
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.status(500).json({ error: 'Failed to fetch workout' });
  }
});

// POST /api/workouts - Create new workout
router.post('/', async (req, res) => {
  try {
    const data: CreateWorkoutRequest = req.body;
    
    if (!data.date || typeof data.date !== 'string') {
      return res.status(400).json({ error: 'Workout date is required' });
    }

    if (!data.exercises || !Array.isArray(data.exercises)) {
      return res.status(400).json({ error: 'Exercises array is required' });
    }

    // Validate exercises data
    for (const exercise of data.exercises) {
      if (!exercise.exercise_id || !exercise.sets || !Array.isArray(exercise.sets)) {
        return res.status(400).json({ error: 'Invalid exercise data' });
      }
      
      for (const set of exercise.sets) {
        if (typeof set.weight !== 'number' || typeof set.reps !== 'number') {
          return res.status(400).json({ error: 'Weight and reps must be numbers' });
        }
      }
    }

    const workout = await workoutService.createWorkout(data);
    res.status(201).json(workout);
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

// PUT /api/workouts/:id - Update workout
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workout ID' });
    }

    const data: UpdateWorkoutRequest = { ...req.body, id };
    
    if (!data.date || typeof data.date !== 'string') {
      return res.status(400).json({ error: 'Workout date is required' });
    }

    if (!data.exercises || !Array.isArray(data.exercises)) {
      return res.status(400).json({ error: 'Exercises array is required' });
    }

    const workout = await workoutService.updateWorkout(data);
    res.json(workout);
  } catch (error) {
    console.error('Error updating workout:', error);
    if (error instanceof Error && error.message === 'Workout not found') {
      res.status(404).json({ error: 'Workout not found' });
    } else {
      res.status(500).json({ error: 'Failed to update workout' });
    }
  }
});

// DELETE /api/workouts/:id - Delete workout
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid workout ID' });
    }

    await workoutService.deleteWorkout(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workout:', error);
    if (error instanceof Error && error.message === 'Workout not found') {
      res.status(404).json({ error: 'Workout not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete workout' });
    }
  }
});

// POST /api/workouts/sync - Sync existing workouts with planned workouts
router.post('/sync', async (req, res) => {
  try {
    await workoutService.syncWorkoutsWithPlanned();
    res.json({ message: 'Workouts synced with planned workouts successfully' });
  } catch (error) {
    console.error('Error syncing workouts:', error);
    res.status(500).json({ error: 'Failed to sync workouts' });
  }
});

export default router;
