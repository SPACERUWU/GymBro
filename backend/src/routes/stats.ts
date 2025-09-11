import { Router } from 'express';
import { WorkoutService } from '../services/workoutService';

const router = Router();
const workoutService = new WorkoutService();

// GET /api/stats/personal-records - Get personal records
router.get('/personal-records', async (req, res) => {
  try {
    const personalRecords = await workoutService.getPersonalRecords();
    res.json(personalRecords);
  } catch (error) {
    console.error('Error fetching personal records:', error);
    res.status(500).json({ error: 'Failed to fetch personal records' });
  }
});

// GET /api/stats/progress/:exerciseId?metric=max_weight|total_volume - Get progress data
router.get('/progress/:exerciseId', async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.exerciseId);
    const { metric } = req.query;
    
    if (isNaN(exerciseId)) {
      return res.status(400).json({ error: 'Invalid exercise ID' });
    }

    if (!metric || (metric !== 'max_weight' && metric !== 'total_volume')) {
      return res.status(400).json({ error: 'Metric must be either "max_weight" or "total_volume"' });
    }

    const progressData = await workoutService.getProgressData(exerciseId, metric as 'max_weight' | 'total_volume');
    res.json(progressData);
  } catch (error) {
    console.error('Error fetching progress data:', error);
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

export default router;
