import { Router } from 'express';
import { ExerciseService } from '../services/exerciseService';
import { CreateExerciseRequest } from '../types';

const router = Router();
const exerciseService = new ExerciseService();

// GET /api/exercises - Get all exercises
router.get('/', async (req, res) => {
  try {
    const exercises = await exerciseService.getAllExercises();
    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// GET /api/exercises/search?q=query - Search exercises
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const exercises = await exerciseService.searchExercises(q);
    res.json(exercises);
  } catch (error) {
    console.error('Error searching exercises:', error);
    res.status(500).json({ error: 'Failed to search exercises' });
  }
});

// GET /api/exercises/:id - Get exercise by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid exercise ID' });
    }

    const exercise = await exerciseService.getExerciseById(id);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

// POST /api/exercises - Create new exercise
router.post('/', async (req, res) => {
  try {
    const data: CreateExerciseRequest = req.body;
    
    if (!data.name || typeof data.name !== 'string') {
      return res.status(400).json({ error: 'Exercise name is required' });
    }

    const exercise = await exerciseService.createExercise(data);
    res.status(201).json(exercise);
  } catch (error) {
    console.error('Error creating exercise:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Exercise with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create exercise' });
    }
  }
});

// PUT /api/exercises/:id - Update exercise
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid exercise ID' });
    }

    const data: Partial<CreateExerciseRequest> = req.body;
    const exercise = await exerciseService.updateExercise(id, data);
    res.json(exercise);
  } catch (error) {
    console.error('Error updating exercise:', error);
    if (error instanceof Error && error.message === 'Exercise not found') {
      res.status(404).json({ error: 'Exercise not found' });
    } else {
      res.status(500).json({ error: 'Failed to update exercise' });
    }
  }
});

// DELETE /api/exercises/:id - Delete exercise
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid exercise ID' });
    }

    await exerciseService.deleteExercise(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting exercise:', error);
    if (error instanceof Error && error.message === 'Exercise not found') {
      res.status(404).json({ error: 'Exercise not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete exercise' });
    }
  }
});

export default router;
