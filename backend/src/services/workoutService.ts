import database from '../database/database';
import { Workout, WorkoutWithSets, CreateWorkoutRequest, UpdateWorkoutRequest, PersonalRecord, ProgressData } from '../types';

export class WorkoutService {
  async getAllWorkouts(): Promise<Workout[]> {
    const sql = 'SELECT * FROM workouts ORDER BY date DESC';
    return await database.query(sql);
  }

  async getWorkoutById(id: number): Promise<WorkoutWithSets | null> {
    const workoutSql = 'SELECT * FROM workouts WHERE id = ?';
    const workout = await database.get(workoutSql, [id]);
    
    if (!workout) return null;

    const setsSql = `
      SELECT ws.*, e.name as exercise_name, e.category as exercise_category
      FROM workout_sets ws
      JOIN exercises e ON ws.exercise_id = e.id
      WHERE ws.workout_id = ?
      ORDER BY ws.exercise_id, ws.set_order
    `;
    const sets = await database.query(setsSql, [id]);

    // Get split information from planned_workouts
    const splitSql = `
      SELECT ws.name as split_name
      FROM planned_workouts pw
      JOIN workout_splits ws ON pw.split_id = ws.id
      WHERE pw.date = ? AND pw.is_completed = 1
    `;
    const splitResult = await database.get(splitSql, [workout.date]);

    // Group sets by exercise
    const exerciseMap = new Map();
    sets.forEach((set: any) => {
      if (!exerciseMap.has(set.exercise_id)) {
        exerciseMap.set(set.exercise_id, {
          exercise: {
            id: set.exercise_id,
            name: set.exercise_name,
            category: set.exercise_category
          },
          sets: []
        });
      }
      exerciseMap.get(set.exercise_id).sets.push({
        id: set.id,
        workout_id: set.workout_id,
        exercise_id: set.exercise_id,
        weight: set.weight,
        reps: set.reps,
        set_order: set.set_order,
        created_at: set.created_at
      });
    });

    return {
      ...workout,
      exercises: Array.from(exerciseMap.values()),
      split: splitResult?.split_name || null
    };
  }

  async getWorkoutsByDateRange(startDate: string, endDate: string): Promise<Workout[]> {
    const sql = 'SELECT * FROM workouts WHERE date BETWEEN ? AND ? ORDER BY date DESC';
    return await database.query(sql, [startDate, endDate]);
  }

  async getWorkoutByDate(date: string): Promise<WorkoutWithSets | null> {
    const sql = 'SELECT * FROM workouts WHERE date = ?';
    const workout = await database.get(sql, [date]);
    
    if (!workout) return null;
    return await this.getWorkoutById(workout.id);
  }

  async createWorkout(data: CreateWorkoutRequest): Promise<WorkoutWithSets> {
    // Start transaction
    const workoutSql = 'INSERT INTO workouts (date, notes) VALUES (?, ?)';
    const workoutResult = await database.run(workoutSql, [data.date, data.notes || null]);
    const workoutId = workoutResult.lastID;

    // Insert sets
    for (const exerciseData of data.exercises) {
      for (let i = 0; i < exerciseData.sets.length; i++) {
        const set = exerciseData.sets[i];
        const setSql = 'INSERT INTO workout_sets (workout_id, exercise_id, weight, reps, set_order) VALUES (?, ?, ?, ?, ?)';
        await database.run(setSql, [workoutId, exerciseData.exercise_id, set.weight, set.reps, i + 1]);
      }
    }

    // Create planned workout entry for calendar display
    try {
      // Use provided split or determine from exercises
      let splitId: number;
      if (data.split) {
        // Map split name to ID
        const splitMap: { [key: string]: number } = {
          'Push': 1,
          'Pull': 2,
          'Legs': 3,
          'Rest': 4
        };
        splitId = splitMap[data.split] || 1;
      } else {
        // Fallback to exercise-based detection
        splitId = this.determineSplitFromExercises(data.exercises);
      }
      
      // Delete existing planned workout entry for this date
      const deletePlannedSql = 'DELETE FROM planned_workouts WHERE date = ?';
      await database.run(deletePlannedSql, [data.date]);
      
      // Insert new planned workout entry
      const plannedWorkoutSql = `
        INSERT INTO planned_workouts (date, split_id, notes, is_completed) 
        VALUES (?, ?, ?, 1)
      `;
      await database.run(plannedWorkoutSql, [data.date, splitId, data.notes || 'Completed workout']);
    } catch (error) {
      console.log('Note: Could not create planned workout entry:', error);
    }

    const newWorkout = await this.getWorkoutById(workoutId);
    if (!newWorkout) {
      throw new Error('Failed to create workout');
    }
    return newWorkout;
  }

  private determineSplitFromExercises(exercises: any[]): number {
    // Simple logic to determine split based on exercise categories
    const categories = exercises.map(ex => ex.category?.toLowerCase() || '');
    
    if (categories.some(cat => cat.includes('chest') || cat.includes('shoulder') || cat.includes('tricep'))) {
      return 1; // Push
    } else if (categories.some(cat => cat.includes('back') || cat.includes('bicep'))) {
      return 2; // Pull
    } else if (categories.some(cat => cat.includes('leg') || cat.includes('quad') || cat.includes('hamstring') || cat.includes('glute') || cat.includes('calf'))) {
      return 3; // Legs
    } else {
      return 1; // Default to Push
    }
  }

  // Method to sync existing workouts with planned workouts
  async syncWorkoutsWithPlanned(): Promise<void> {
    const workouts = await this.getAllWorkouts();
    
    for (const workout of workouts) {
      try {
        // Check if planned workout already exists
        const existingPlanned = await database.get(
          'SELECT * FROM planned_workouts WHERE date = ?',
          [workout.date]
        );
        
        if (!existingPlanned) {
          // Get workout details to determine split
          const workoutDetails = await this.getWorkoutById(workout.id);
          if (workoutDetails && workoutDetails.exercises.length > 0) {
            const splitId = this.determineSplitFromExercises(workoutDetails.exercises);
            const plannedWorkoutSql = `
              INSERT INTO planned_workouts (date, split_id, notes, is_completed) 
              VALUES (?, ?, ?, 1)
            `;
            await database.run(plannedWorkoutSql, [workout.date, splitId, workout.notes || 'Completed workout']);
          }
        }
      } catch (error) {
        console.log(`Could not sync workout ${workout.id}:`, error);
      }
    }
  }

  async updateWorkout(data: UpdateWorkoutRequest): Promise<WorkoutWithSets> {
    // Update workout
    const workoutSql = 'UPDATE workouts SET date = ?, notes = ? WHERE id = ?';
    await database.run(workoutSql, [data.date, data.notes || null, data.id]);

    // Delete existing sets
    const deleteSetsSql = 'DELETE FROM workout_sets WHERE workout_id = ?';
    await database.run(deleteSetsSql, [data.id]);

    // Insert new sets
    for (const exerciseData of data.exercises) {
      for (let i = 0; i < exerciseData.sets.length; i++) {
        const set = exerciseData.sets[i];
        const setSql = 'INSERT INTO workout_sets (workout_id, exercise_id, weight, reps, set_order) VALUES (?, ?, ?, ?, ?)';
        await database.run(setSql, [data.id, exerciseData.exercise_id, set.weight, set.reps, i + 1]);
      }
    }

    // Update planned workout entry for calendar display
    try {
      // Use provided split or determine from exercises
      let splitId: number;
      if (data.split) {
        // Map split name to ID
        const splitMap: { [key: string]: number } = {
          'Push': 1,
          'Pull': 2,
          'Legs': 3,
          'Rest': 4
        };
        splitId = splitMap[data.split] || 1;
      } else {
        // Fallback to exercise-based detection
        splitId = this.determineSplitFromExercises(data.exercises);
      }
      
      // Delete existing planned workout entry for this date
      const deletePlannedSql = 'DELETE FROM planned_workouts WHERE date = ?';
      await database.run(deletePlannedSql, [data.date]);
      
      // Insert new planned workout entry
      const plannedWorkoutSql = `
        INSERT INTO planned_workouts (date, split_id, notes, is_completed) 
        VALUES (?, ?, ?, 1)
      `;
      await database.run(plannedWorkoutSql, [data.date, splitId, data.notes || 'Completed workout']);
    } catch (error) {
      console.log('Note: Could not update planned workout entry:', error);
    }

    const updatedWorkout = await this.getWorkoutById(data.id);
    if (!updatedWorkout) {
      throw new Error('Workout not found');
    }
    return updatedWorkout;
  }

  async deleteWorkout(id: number): Promise<void> {
    const sql = 'DELETE FROM workouts WHERE id = ?';
    const result = await database.run(sql, [id]);
    if (result.changes === 0) {
      throw new Error('Workout not found');
    }
  }

  async getPersonalRecords(): Promise<PersonalRecord[]> {
    const sql = `
      SELECT 
        e.id as exercise_id,
        e.name as exercise_name,
        e.category as exercise_category,
        MAX(ws.weight) as max_weight,
        MAX(ws.reps) as max_reps,
        MAX(ws.weight * ws.reps) as max_volume,
        MAX(w.date) as last_achieved
      FROM exercises e
      LEFT JOIN workout_sets ws ON e.id = ws.exercise_id
      LEFT JOIN workouts w ON ws.workout_id = w.id
      GROUP BY e.id, e.name, e.category
      ORDER BY e.name
    `;
    return await database.query(sql);
  }

  async getProgressData(exerciseId: number, metric: 'max_weight' | 'total_volume'): Promise<ProgressData[]> {
    let sql: string;
    
    if (metric === 'max_weight') {
      sql = `
        SELECT 
          w.date,
          MAX(ws.weight) as max_weight,
          0 as total_volume
        FROM workouts w
        JOIN workout_sets ws ON w.id = ws.workout_id
        WHERE ws.exercise_id = ?
        GROUP BY w.date
        ORDER BY w.date
      `;
    } else {
      sql = `
        SELECT 
          w.date,
          0 as max_weight,
          SUM(ws.weight * ws.reps) as total_volume
        FROM workouts w
        JOIN workout_sets ws ON w.id = ws.workout_id
        WHERE ws.exercise_id = ?
        GROUP BY w.date
        ORDER BY w.date
      `;
    }
    
    return await database.query(sql, [exerciseId]);
  }

  async getWorkoutDates(): Promise<string[]> {
    const sql = 'SELECT DISTINCT date FROM workouts ORDER BY date DESC';
    const results = await database.query(sql);
    return results.map((row: any) => row.date);
  }
}
