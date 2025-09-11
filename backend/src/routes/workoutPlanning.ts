import { Router } from 'express';
import { WorkoutPlanningService } from '../services/workoutPlanningService';
import { CreatePlannedWorkoutRequest } from '../services/workoutPlanningService';

const router = Router();
const workoutPlanningService = new WorkoutPlanningService();

// GET /api/workout-planning - Get planned workouts
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const plannedWorkouts = await workoutPlanningService.getPlannedWorkouts(
      startDate as string,
      endDate as string
    );
    res.json(plannedWorkouts);
  } catch (error) {
    console.error('Error fetching planned workouts:', error);
    res.status(500).json({ error: 'Failed to fetch planned workouts' });
  }
});

// GET /api/workout-planning/schedule - Get workout schedule
router.get('/schedule', async (req, res) => {
  try {
    const schedule = await workoutPlanningService.getWorkoutSchedule();
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching workout schedule:', error);
    res.status(500).json({ error: 'Failed to fetch workout schedule' });
  }
});

// PUT /api/workout-planning/schedule - Update workout schedule
router.put('/schedule', async (req, res) => {
  try {
    const { userId = 1, ...scheduleData } = req.body;
    const schedule = await workoutPlanningService.updateWorkoutSchedule(userId, scheduleData);
    res.json(schedule);
  } catch (error) {
    console.error('Error updating workout schedule:', error);
    res.status(500).json({ error: 'Failed to update workout schedule' });
  }
});

// GET /api/workout-planning/date/:date - Get planned workout by date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const plannedWorkout = await workoutPlanningService.getPlannedWorkoutByDate(date);
    
    if (!plannedWorkout) {
      return res.status(404).json({ error: 'No planned workout found for this date' });
    }
    
    res.json(plannedWorkout);
  } catch (error) {
    console.error('Error fetching planned workout:', error);
    res.status(500).json({ error: 'Failed to fetch planned workout' });
  }
});

// POST /api/workout-planning - Create planned workout
router.post('/', async (req, res) => {
  try {
    const data: CreatePlannedWorkoutRequest = req.body;
    
    if (!data.date || !data.split_id) {
      return res.status(400).json({ error: 'Date and split_id are required' });
    }

    const plannedWorkout = await workoutPlanningService.createPlannedWorkout(data);
    res.status(201).json(plannedWorkout);
  } catch (error) {
    console.error('Error creating planned workout:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Workout already planned for this date' });
    } else {
      res.status(500).json({ error: 'Failed to create planned workout' });
    }
  }
});

// PUT /api/workout-planning/:id - Update planned workout
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid planned workout ID' });
    }

    const data: Partial<CreatePlannedWorkoutRequest> = req.body;
    const plannedWorkout = await workoutPlanningService.updatePlannedWorkout(id, data);
    res.json(plannedWorkout);
  } catch (error) {
    console.error('Error updating planned workout:', error);
    if (error instanceof Error && error.message === 'Planned workout not found') {
      res.status(404).json({ error: 'Planned workout not found' });
    } else {
      res.status(500).json({ error: 'Failed to update planned workout' });
    }
  }
});

// PATCH /api/workout-planning/:id/complete - Mark workout as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid planned workout ID' });
    }

    await workoutPlanningService.markWorkoutCompleted(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error marking workout as completed:', error);
    res.status(500).json({ error: 'Failed to mark workout as completed' });
  }
});

// DELETE /api/workout-planning/:id - Delete planned workout
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid planned workout ID' });
    }

    await workoutPlanningService.deletePlannedWorkout(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting planned workout:', error);
    if (error instanceof Error && error.message === 'Planned workout not found') {
      res.status(404).json({ error: 'Planned workout not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete planned workout' });
    }
  }
});

// POST /api/workout-planning/auto-schedule - Generate auto schedule
router.post('/auto-schedule', async (req, res) => {
  try {
    const { startDate, weeks = 4 } = req.body;
    
    if (!startDate) {
      return res.status(400).json({ error: 'Start date is required' });
    }

    const plannedWorkouts = await workoutPlanningService.generateAutoSchedule(startDate, weeks);
    res.status(201).json(plannedWorkouts);
  } catch (error) {
    console.error('Error generating auto schedule:', error);
    res.status(500).json({ error: 'Failed to generate auto schedule' });
  }
});

export default router;
