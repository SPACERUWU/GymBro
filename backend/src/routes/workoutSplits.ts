import { Router } from 'express';
import { WorkoutSplitService } from '../services/workoutSplitService';

const router = Router();
const workoutSplitService = new WorkoutSplitService();

// GET /api/workout-splits/plan - Get today's workout plan
router.get('/plan', async (req, res) => {
  try {
    const { split } = req.query;
    const plan = await workoutSplitService.getWorkoutPlan(split as string);
    res.json(plan);
  } catch (error) {
    console.error('Error fetching workout plan:', error);
    res.status(500).json({ error: 'Failed to fetch workout plan' });
  }
});

// GET /api/workout-splits - Get all workout splits
router.get('/', async (req, res) => {
  try {
    const splits = await workoutSplitService.getAllSplits();
    res.json(splits);
  } catch (error) {
    console.error('Error fetching workout splits:', error);
    res.status(500).json({ error: 'Failed to fetch workout splits' });
  }
});

// GET /api/workout-splits/:id - Get workout split by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid split ID' });
    }

    const split = await workoutSplitService.getSplitById(id);
    if (!split) {
      return res.status(404).json({ error: 'Workout split not found' });
    }

    res.json(split);
  } catch (error) {
    console.error('Error fetching workout split:', error);
    res.status(500).json({ error: 'Failed to fetch workout split' });
  }
});

// GET /api/workout-splits/:id/exercises - Get exercises for a specific split
router.get('/:id/exercises', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid split ID' });
    }

    const exercises = await workoutSplitService.getExercisesBySplit(id);
    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises for split:', error);
    res.status(500).json({ error: 'Failed to fetch exercises for split' });
  }
});

// GET /api/workout-splits/exercises/with-splits - Get all exercises with their assigned splits
router.get('/exercises/with-splits', async (req, res) => {
  try {
    const exercises = await workoutSplitService.getExercisesWithSplits();
    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises with splits:', error);
    res.status(500).json({ error: 'Failed to fetch exercises with splits' });
  }
});

// POST /api/workout-splits/:splitId/exercises/:exerciseId - Assign exercise to split
router.post('/:splitId/exercises/:exerciseId', async (req, res) => {
  try {
    const splitId = parseInt(req.params.splitId);
    const exerciseId = parseInt(req.params.exerciseId);
    
    if (isNaN(splitId) || isNaN(exerciseId)) {
      return res.status(400).json({ error: 'Invalid split ID or exercise ID' });
    }

    await workoutSplitService.assignExerciseToSplit(exerciseId, splitId);
    res.status(201).json({ message: 'Exercise assigned to split successfully' });
  } catch (error) {
    console.error('Error assigning exercise to split:', error);
    res.status(500).json({ error: 'Failed to assign exercise to split' });
  }
});

// DELETE /api/workout-splits/:splitId/exercises/:exerciseId - Remove exercise from split
router.delete('/:splitId/exercises/:exerciseId', async (req, res) => {
  try {
    const splitId = parseInt(req.params.splitId);
    const exerciseId = parseInt(req.params.exerciseId);
    
    if (isNaN(splitId) || isNaN(exerciseId)) {
      return res.status(400).json({ error: 'Invalid split ID or exercise ID' });
    }

    await workoutSplitService.removeExerciseFromSplit(exerciseId, splitId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing exercise from split:', error);
    res.status(500).json({ error: 'Failed to remove exercise from split' });
  }
});

export default router;
