import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface WorkoutRecommendation {
  exercise: string;
  sets: number;
  reps: string;
  weight?: string;
  notes: string;
}

export interface AIInsight {
  type: 'progress' | 'warning' | 'suggestion' | 'motivation';
  title: string;
  message: string;
  action?: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBqCZro37QpvCC1b17R3wM3A9cGyffo_jo';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async chatWithAI(messages: ChatMessage[], userContext?: any): Promise<string> {
    try {
      // Build context-aware prompt
      let contextPrompt = `You are GymBro AI, a helpful fitness coach and personal trainer. You help users with:
- Workout planning and exercise recommendations
- Form corrections and safety tips
- Nutrition and recovery advice
- Motivation and goal setting
- General fitness questions
- TDEE calculations and calorie recommendations
- Weight management advice

Be encouraging, professional, and provide practical advice. Keep responses concise but helpful. Always provide specific, actionable advice.`;

      if (userContext) {
        contextPrompt += `\n\nUser Context:
- Recent workouts: ${userContext.recentWorkouts || 'No recent data'}
- Fitness level: ${userContext.fitnessLevel || 'Not specified'}
- Goals: ${userContext.goals || 'General fitness'}
- Preferred split: ${userContext.preferredSplit || 'Not specified'}`;
      }

      // For now, just send the last message without chat history to avoid format issues
      const lastMessage = messages[messages.length - 1];
      const result = await this.model.generateContent(lastMessage.content);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Error with Gemini AI:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async getWorkoutRecommendations(
    split: string,
    fitnessLevel: string = 'intermediate',
    availableEquipment: string[] = ['bodyweight', 'dumbbells']
  ): Promise<WorkoutRecommendation[]> {
    try {
      const prompt = `As a fitness expert, recommend 5-6 exercises for a ${split} day workout for someone with ${fitnessLevel} fitness level.
Available equipment: ${availableEquipment.join(', ')}.

For each exercise, provide:
1. Exercise name
2. Sets (number)
3. Reps (range like "8-12" or "12-15")
4. Weight suggestion (if applicable)
5. Brief form notes

Format as JSON array with fields: exercise, sets, reps, weight, notes

Example:
[
  {
    "exercise": "Bench Press",
    "sets": 4,
    "reps": "8-12",
    "weight": "Body weight or 60-80% 1RM",
    "notes": "Keep core tight, lower to chest, press up explosively"
  }
]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: return basic recommendations
      return this.getFallbackRecommendations(split);
    } catch (error) {
      console.error('Error getting workout recommendations:', error);
      return this.getFallbackRecommendations(split);
    }
  }

  async analyzeWorkoutData(workoutData: any): Promise<AIInsight[]> {
    try {
      const prompt = `Analyze this workout data and provide insights:
${JSON.stringify(workoutData, null, 2)}

Provide 3-5 insights as JSON array with fields: type, title, message, action
Types: progress, warning, suggestion, motivation

Focus on:
- Progress trends
- Potential issues
- Improvement suggestions
- Motivational messages

Example:
[
  {
    "type": "progress",
    "title": "Strength Gains",
    "message": "Your bench press has improved by 10kg over the last month!",
    "action": "Consider increasing weight for other exercises"
  }
]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.getFallbackInsights();
    } catch (error) {
      console.error('Error analyzing workout data:', error);
      return this.getFallbackInsights();
    }
  }

  async getMotivationalMessage(workoutStreak: number, recentProgress?: any): Promise<string> {
    try {
      const prompt = `Generate a motivational message for someone who has:
- Workout streak: ${workoutStreak} days
- Recent progress: ${recentProgress ? JSON.stringify(recentProgress) : 'No recent data'}

Make it encouraging, specific, and actionable. Keep it under 100 words.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error getting motivational message:', error);
      return "Keep up the great work! Every workout brings you closer to your goals. 💪";
    }
  }

  private getFallbackRecommendations(split: string): WorkoutRecommendation[] {
    const recommendations: { [key: string]: WorkoutRecommendation[] } = {
      'Push': [
        { exercise: 'Push-ups', sets: 3, reps: '10-15', notes: 'Keep body straight, full range of motion' },
        { exercise: 'Dips', sets: 3, reps: '8-12', notes: 'Lower until shoulders are below elbows' },
        { exercise: 'Pike Push-ups', sets: 3, reps: '8-12', notes: 'Great for shoulder strength' },
        { exercise: 'Diamond Push-ups', sets: 3, reps: '6-10', notes: 'Focus on triceps' }
      ],
      'Pull': [
        { exercise: 'Pull-ups', sets: 3, reps: '5-10', notes: 'Full hang to chin over bar' },
        { exercise: 'Inverted Rows', sets: 3, reps: '10-15', notes: 'Keep body straight' },
        { exercise: 'Bicep Curls', sets: 3, reps: '12-15', notes: 'Control the weight, squeeze at top' },
        { exercise: 'Face Pulls', sets: 3, reps: '15-20', notes: 'Great for rear delts' }
      ],
      'Legs': [
        { exercise: 'Squats', sets: 4, reps: '12-15', notes: 'Keep knees behind toes' },
        { exercise: 'Lunges', sets: 3, reps: '10 each leg', notes: 'Alternate legs, keep front knee over ankle' },
        { exercise: 'Calf Raises', sets: 3, reps: '15-20', notes: 'Full range of motion' },
        { exercise: 'Glute Bridges', sets: 3, reps: '15-20', notes: 'Squeeze glutes at top' }
      ]
    };

    return recommendations[split] || recommendations['Push'];
  }

  private getFallbackInsights(): AIInsight[] {
    return [
      {
        type: 'motivation',
        title: 'Keep Going!',
        message: 'Consistency is key to achieving your fitness goals.',
        action: 'Try to maintain your current workout schedule'
      },
      {
        type: 'suggestion',
        title: 'Track Your Progress',
        message: 'Consider logging your workouts to better track your improvements.',
        action: 'Use the workout log feature regularly'
      }
    ];
  }

}
