import { Router } from 'express';
import { GeminiService, ChatMessage, WorkoutRecommendation, AIInsight } from '../services/geminiService';

const router = Router();
const geminiService = new GeminiService();

// POST /api/ai/chat - Chat with AI
router.post('/chat', async (req, res) => {
  try {
    const { messages, userContext } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await geminiService.chatWithAI(messages, userContext);
    res.json({ response });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// POST /api/ai/recommendations - Get workout recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const { split, fitnessLevel, availableEquipment } = req.body;
    
    if (!split) {
      return res.status(400).json({ error: 'Split is required' });
    }

    const recommendations = await geminiService.getWorkoutRecommendations(
      split,
      fitnessLevel || 'intermediate',
      availableEquipment || ['bodyweight', 'dumbbells']
    );
    
    res.json({ recommendations });
  } catch (error) {
    console.error('Error getting workout recommendations:', error);
    res.status(500).json({ error: 'Failed to get workout recommendations' });
  }
});

// POST /api/ai/analyze - Analyze workout data
router.post('/analyze', async (req, res) => {
  try {
    const { workoutData } = req.body;
    
    if (!workoutData) {
      return res.status(400).json({ error: 'Workout data is required' });
    }

    const insights = await geminiService.analyzeWorkoutData(workoutData);
    res.json({ insights });
  } catch (error) {
    console.error('Error analyzing workout data:', error);
    res.status(500).json({ error: 'Failed to analyze workout data' });
  }
});

// POST /api/ai/motivation - Get motivational message
router.post('/motivation', async (req, res) => {
  try {
    const { workoutStreak, recentProgress } = req.body;
    
    const message = await geminiService.getMotivationalMessage(
      workoutStreak || 0,
      recentProgress
    );
    
    res.json({ message });
  } catch (error) {
    console.error('Error getting motivational message:', error);
    res.status(500).json({ error: 'Failed to get motivational message' });
  }
});

export default router;
