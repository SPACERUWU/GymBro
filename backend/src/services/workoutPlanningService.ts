import database from '../database/database';
import { WorkoutSplit } from '../types';

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

export class WorkoutPlanningService {
  async getPlannedWorkouts(startDate?: string, endDate?: string): Promise<PlannedWorkout[]> {
    let sql = `
      SELECT pw.*, ws.name as split_name 
      FROM planned_workouts pw
      JOIN workout_splits ws ON pw.split_id = ws.id
    `;
    const params: any[] = [];

    if (startDate && endDate) {
      sql += ' WHERE pw.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    sql += ' ORDER BY pw.date ASC';
    return await database.query(sql, params);
  }

  async getPlannedWorkoutByDate(date: string): Promise<PlannedWorkout | null> {
    const sql = `
      SELECT pw.*, ws.name as split_name 
      FROM planned_workouts pw
      JOIN workout_splits ws ON pw.split_id = ws.id
      WHERE pw.date = ?
    `;
    const result = await database.get(sql, [date]);
    return result || null;
  }

  async createPlannedWorkout(data: CreatePlannedWorkoutRequest): Promise<PlannedWorkout> {
    const sql = 'INSERT INTO planned_workouts (date, split_id, notes) VALUES (?, ?, ?)';
    const result = await database.run(sql, [data.date, data.split_id, data.notes || null]);
    
    const newPlannedWorkout = await this.getPlannedWorkoutById(result.lastID);
    if (!newPlannedWorkout) {
      throw new Error('Failed to create planned workout');
    }
    return newPlannedWorkout;
  }

  async updatePlannedWorkout(id: number, data: Partial<CreatePlannedWorkoutRequest>): Promise<PlannedWorkout> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.date !== undefined) {
      updates.push('date = ?');
      params.push(data.date);
    }
    if (data.split_id !== undefined) {
      updates.push('split_id = ?');
      params.push(data.split_id);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      params.push(data.notes);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(id);
    const sql = `UPDATE planned_workouts SET ${updates.join(', ')} WHERE id = ?`;
    await database.run(sql, params);

    const updatedPlannedWorkout = await this.getPlannedWorkoutById(id);
    if (!updatedPlannedWorkout) {
      throw new Error('Planned workout not found');
    }
    return updatedPlannedWorkout;
  }

  async markWorkoutCompleted(id: number): Promise<void> {
    const sql = 'UPDATE planned_workouts SET is_completed = TRUE WHERE id = ?';
    await database.run(sql, [id]);
  }

  async deletePlannedWorkout(id: number): Promise<void> {
    const sql = 'DELETE FROM planned_workouts WHERE id = ?';
    const result = await database.run(sql, [id]);
    if (result.changes === 0) {
      throw new Error('Planned workout not found');
    }
  }

  async getWorkoutSchedule(userId: number = 1): Promise<WorkoutSchedule | null> {
    const sql = 'SELECT * FROM workout_schedule WHERE user_id = ?';
    const result = await database.get(sql, [userId]);
    if (!result) return null;

    return {
      ...result,
      preferred_days: result.preferred_days ? JSON.parse(result.preferred_days) : [],
      rest_days: result.rest_days ? JSON.parse(result.rest_days) : []
    };
  }

  async updateWorkoutSchedule(userId: number, schedule: Partial<WorkoutSchedule>): Promise<WorkoutSchedule> {
    const updates: string[] = [];
    const params: any[] = [];

    if (schedule.preferred_days !== undefined) {
      updates.push('preferred_days = ?');
      params.push(JSON.stringify(schedule.preferred_days));
    }
    if (schedule.rest_days !== undefined) {
      updates.push('rest_days = ?');
      params.push(JSON.stringify(schedule.rest_days));
    }
    if (schedule.deload_frequency !== undefined) {
      updates.push('deload_frequency = ?');
      params.push(schedule.deload_frequency);
    }
    if (schedule.last_deload_date !== undefined) {
      updates.push('last_deload_date = ?');
      params.push(schedule.last_deload_date);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(userId);
    const sql = `UPDATE workout_schedule SET ${updates.join(', ')} WHERE user_id = ?`;
    await database.run(sql, params);

    const updatedSchedule = await this.getWorkoutSchedule(userId);
    if (!updatedSchedule) {
      throw new Error('Workout schedule not found');
    }
    return updatedSchedule;
  }

  async generateAutoSchedule(startDate: string, weeks: number = 4): Promise<PlannedWorkout[]> {
    const schedule = await this.getWorkoutSchedule();
    if (!schedule) {
      throw new Error('No workout schedule found');
    }

    const plannedWorkouts: PlannedWorkout[] = [];
    const start = new Date(startDate);
    const splits = await this.getWorkoutSplits();
    
    // PPL rotation with rest between Leg and Push
    const splitRotation = ['Push', 'Pull', 'Legs', 'Rest'];
    let splitIndex = 0;

    for (let week = 0; week < weeks; week++) {
      const isDeloadWeek = this.shouldDeload(start, schedule);
      
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + (week * 7) + day);
        
        // Skip rest days from schedule
        if (schedule.rest_days.includes(currentDate.getDay())) {
          continue;
        }

        // Skip non-preferred days
        if (!schedule.preferred_days.includes(currentDate.getDay())) {
          continue;
        }

        const splitName = isDeloadWeek ? 'Rest' : splitRotation[splitIndex % splitRotation.length];
        const split = splits.find(s => s.name === splitName);
        
        if (split) {
          const notes = isDeloadWeek ? 'Deload Week - Light Training' : 
                       splitName === 'Rest' ? 'Rest Day - Recovery' : undefined;
          
          try {
            const plannedWorkout = await this.createPlannedWorkout({
              date: currentDate.toISOString().split('T')[0],
              split_id: split.id,
              notes
            });
            plannedWorkouts.push(plannedWorkout);
          } catch (error) {
            // Skip if already exists
            console.log(`Workout already planned for ${currentDate.toISOString().split('T')[0]}`);
          }
        }

        // Always increment splitIndex for PPLR rotation
        splitIndex++;
      }
    }

    return plannedWorkouts;
  }

  private async getPlannedWorkoutById(id: number): Promise<PlannedWorkout | null> {
    const sql = `
      SELECT pw.*, ws.name as split_name 
      FROM planned_workouts pw
      JOIN workout_splits ws ON pw.split_id = ws.id
      WHERE pw.id = ?
    `;
    const result = await database.get(sql, [id]);
    return result || null;
  }

  private async getWorkoutSplits(): Promise<WorkoutSplit[]> {
    const sql = 'SELECT * FROM workout_splits ORDER BY id';
    return await database.query(sql);
  }

  private shouldDeload(date: Date, schedule: WorkoutSchedule): boolean {
    if (!schedule.last_deload_date) {
      return false;
    }

    const lastDeload = new Date(schedule.last_deload_date);
    const weeksSinceDeload = Math.floor((date.getTime() - lastDeload.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    return weeksSinceDeload >= schedule.deload_frequency;
  }
}
