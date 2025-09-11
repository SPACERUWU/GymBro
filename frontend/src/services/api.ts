import axios from 'axios';
import { Exercise, Workout, WorkoutWithSets, CreateExerciseRequest, CreateWorkoutRequest, PersonalRecord, ProgressData, WorkoutSplit, WorkoutPlan, PlannedWorkout, WorkoutSchedule, CreatePlannedWorkoutRequest } from '../types';

const API_BASE_URL = process.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Exercise API
export const exerciseApi = {
  getAll: (): Promise<Exercise[]> => api.get('/exercises').then(res => res.data),
  getById: (id: number): Promise<Exercise> => api.get(`/exercises/${id}`).then(res => res.data),
  search: (query: string): Promise<Exercise[]> => api.get(`/exercises/search?q=${encodeURIComponent(query)}`).then(res => res.data),
  create: (data: CreateExerciseRequest): Promise<Exercise> => api.post('/exercises', data).then(res => res.data),
  update: (id: number, data: Partial<CreateExerciseRequest>): Promise<Exercise> => api.put(`/exercises/${id}`, data).then(res => res.data),
  delete: (id: number): Promise<void> => api.delete(`/exercises/${id}`).then(() => undefined),
};

// Workout API
export const workoutApi = {
  getAll: (): Promise<Workout[]> => api.get('/workouts').then(res => res.data),
  getById: (id: number): Promise<WorkoutWithSets> => api.get(`/workouts/${id}`).then(res => res.data),
  getByDate: (date: string): Promise<WorkoutWithSets> => api.get(`/workouts/date/${date}`).then(res => res.data),
  getDates: (): Promise<string[]> => api.get('/workouts/dates').then(res => res.data),
  getByDateRange: (startDate: string, endDate: string): Promise<Workout[]> => 
    api.get(`/workouts/range?start=${startDate}&end=${endDate}`).then(res => res.data),
  create: (data: CreateWorkoutRequest): Promise<WorkoutWithSets> => api.post('/workouts', data).then(res => res.data),
  update: (id: number, data: CreateWorkoutRequest): Promise<WorkoutWithSets> => api.put(`/workouts/${id}`, data).then(res => res.data),
  delete: (id: number): Promise<void> => api.delete(`/workouts/${id}`).then(() => undefined),
};

// Stats API
export const statsApi = {
  getPersonalRecords: (): Promise<PersonalRecord[]> => api.get('/stats/personal-records').then(res => res.data),
  getProgressData: (exerciseId: number, metric: 'max_weight' | 'total_volume'): Promise<ProgressData[]> => 
    api.get(`/stats/progress/${exerciseId}?metric=${metric}`).then(res => res.data),
};

// Workout Split API
export const workoutSplitApi = {
  getWorkoutPlan: (split?: string): Promise<WorkoutPlan> => 
    api.get(`/workout-splits/plan${split ? `?split=${split}` : ''}`).then(res => res.data),
  getAllSplits: (): Promise<WorkoutSplit[]> => api.get('/workout-splits').then(res => res.data),
  getSplitById: (id: number): Promise<WorkoutSplit> => api.get(`/workout-splits/${id}`).then(res => res.data),
  getExercisesBySplit: (splitId: number): Promise<Exercise[]> => api.get(`/workout-splits/${splitId}/exercises`).then(res => res.data),
  getExercisesWithSplits: (): Promise<any[]> => api.get('/workout-splits/exercises/with-splits').then(res => res.data),
  assignExerciseToSplit: (exerciseId: number, splitId: number): Promise<void> => 
    api.post(`/workout-splits/${splitId}/exercises/${exerciseId}`).then(() => undefined),
  removeExerciseFromSplit: (exerciseId: number, splitId: number): Promise<void> => 
    api.delete(`/workout-splits/${splitId}/exercises/${exerciseId}`).then(() => undefined),
};

// Workout Planning API
export const workoutPlanningApi = {
  getPlannedWorkouts: (startDate?: string, endDate?: string): Promise<PlannedWorkout[]> => 
    api.get(`/workout-planning${startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`).then(res => res.data),
  getPlannedWorkoutByDate: (date: string): Promise<PlannedWorkout> => 
    api.get(`/workout-planning/date/${date}`).then(res => res.data),
  createPlannedWorkout: (data: CreatePlannedWorkoutRequest): Promise<PlannedWorkout> => 
    api.post('/workout-planning', data).then(res => res.data),
  updatePlannedWorkout: (id: number, data: Partial<CreatePlannedWorkoutRequest>): Promise<PlannedWorkout> => 
    api.put(`/workout-planning/${id}`, data).then(res => res.data),
  markWorkoutCompleted: (id: number): Promise<void> => 
    api.patch(`/workout-planning/${id}/complete`).then(() => undefined),
  deletePlannedWorkout: (id: number): Promise<void> => 
    api.delete(`/workout-planning/${id}`).then(() => undefined),
  getWorkoutSchedule: (): Promise<WorkoutSchedule> => 
    api.get('/workout-planning/schedule').then(res => res.data),
  updateWorkoutSchedule: (schedule: Partial<WorkoutSchedule>): Promise<WorkoutSchedule> => 
    api.put('/workout-planning/schedule', schedule).then(res => res.data),
  generateAutoSchedule: (startDate: string, weeks: number = 4): Promise<PlannedWorkout[]> => 
    api.post('/workout-planning/auto-schedule', { startDate, weeks }).then(res => res.data),
};

export default api;
