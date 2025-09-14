export interface Exercise {
  id: number;
  name: string;
  category?: string;
  created_at: string;
}

export interface Workout {
  id: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface WorkoutSet {
  id: number;
  workout_id: number;
  exercise_id: number;
  weight: number;
  reps: number;
  set_order: number;
  created_at: string;
}

export interface WorkoutWithSets extends Workout {
  exercises: Array<{
    exercise: Exercise;
    sets: WorkoutSet[];
  }>;
  split?: string;
}

export interface CreateExerciseRequest {
  name: string;
  category?: string;
}

export interface CreateWorkoutRequest {
  date: string;
  notes?: string;
  exercises: Array<{
    exercise_id: number;
    sets: Array<{
      weight: number;
      reps: number;
    }>;
  }>;
}

export interface PersonalRecord {
  exercise_id: number;
  exercise_name: string;
  exercise_category: string;
  max_weight: number;
  max_reps: number;
  max_volume: number;
  last_achieved: string;
}

export interface ProgressData {
  date: string;
  max_weight: number;
  total_volume: number;
}

export interface WorkoutExercise {
  exercise_id: number;
  sets: Array<{
    weight: number;
    reps: number;
  }>;
}

export interface WorkoutSplit {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface ExerciseSplit {
  id: number;
  exercise_id: number;
  split_id: number;
  created_at: string;
}

export interface ExerciseWithSplit extends Exercise {
  splits: WorkoutSplit[];
}

export interface WorkoutPlan {
  today: string;
  currentSplit: WorkoutSplit;
  recommendedExercises: Exercise[];
  isRestDay: boolean;
  nextWorkout: string;
  nextSplit?: string;
}

export interface PlannedWorkout {
  id: number;
  date: string;
  split_id: number;
  split_name: string;
  notes?: string;
  is_completed: boolean;
  created_at: string;
}

export interface WorkoutSchedule {
  id: number;
  user_id: number;
  preferred_days: number[];
  rest_days: number[];
  deload_frequency: number;
  last_deload_date?: string;
  created_at: string;
}

export interface CreatePlannedWorkoutRequest {
  date: string;
  split_id: number;
  notes?: string;
}
