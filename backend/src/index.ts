import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import exerciseRoutes from './routes/exercises';
import workoutRoutes from './routes/workouts';
import statsRoutes from './routes/stats';
import workoutSplitRoutes from './routes/workoutSplits';
import workoutPlanningRoutes from './routes/workoutPlanning';
import aiRoutes from './routes/ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/workout-splits', workoutSplitRoutes);
app.use('/api/workout-planning', workoutPlanningRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
