import database from '../database/database';
import { WorkoutSplit, Exercise, WorkoutPlan } from '../types';

export class WorkoutSplitService {
  async getAllSplits(): Promise<WorkoutSplit[]> {
    const sql = 'SELECT * FROM workout_splits ORDER BY id';
    return await database.query(sql);
  }

  async getSplitById(id: number): Promise<WorkoutSplit | null> {
    const sql = 'SELECT * FROM workout_splits WHERE id = ?';
    const result = await database.get(sql, [id]);
    return result || null;
  }

  async getExercisesBySplit(splitId: number): Promise<Exercise[]> {
    const sql = `
      SELECT DISTINCT e.* FROM exercises e
      JOIN exercise_splits es ON e.id = es.exercise_id
      WHERE es.split_id = ?
      ORDER BY RANDOM()
    `;
    return await database.query(sql, [splitId]);
  }

  async getWorkoutPlan(selectedSplit?: string): Promise<WorkoutPlan> {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Default PPL schedule: Mon=Pull, Tue=Push, Wed=Legs, Thu=Pull, Fri=Push, Sat=Legs, Sun=Rest
    const defaultSplitSchedule = [
      { day: 0, split: 'Rest' },    // Sunday
      { day: 1, split: 'Pull' },    // Monday
      { day: 2, split: 'Push' },    // Tuesday
      { day: 3, split: 'Legs' },    // Wednesday
      { day: 4, split: 'Pull' },    // Thursday
      { day: 5, split: 'Push' },    // Friday
      { day: 6, split: 'Legs' },    // Saturday
    ];

    // If user selected a specific split, use that instead
    const currentSplitName = selectedSplit || defaultSplitSchedule[dayOfWeek].split;
    const isRestDay = currentSplitName === 'Rest';
    
    // Get current split
    const currentSplit = await this.getSplitById(
      currentSplitName === 'Rest' ? 4 : 
      currentSplitName === 'Pull' ? 2 :
      currentSplitName === 'Push' ? 1 : 3
    );

    // Get recommended exercises for today (limit to 9 unique exercises)
    const allExercises = isRestDay ? [] : await this.getExercisesBySplit(currentSplit?.id || 1);
    // Ensure we get exactly 9 unique exercises by removing any potential duplicates
    const uniqueExercises = allExercises.filter((exercise, index, self) => 
      index === self.findIndex(e => e.id === exercise.id)
    );
    const recommendedExercises = uniqueExercises.slice(0, 9);

    // Calculate next workout day and suggest next split
    const nextWorkoutInfo = this.getNextWorkoutSuggestion(currentSplitName);

    return {
      today: today.toISOString().split('T')[0],
      currentSplit: currentSplit || { id: 4, name: 'Rest', description: 'Rest Day - Recovery', created_at: '' },
      recommendedExercises,
      isRestDay,
      nextWorkout: nextWorkoutInfo.date,
      nextSplit: nextWorkoutInfo.split
    };
  }

  private getNextWorkoutSuggestion(currentSplit: string): { date: string; split: string } {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Suggest next split based on current split
    let nextSplit: string;
    switch (currentSplit.toLowerCase()) {
      case 'push':
        nextSplit = 'Pull';
        break;
      case 'pull':
        nextSplit = 'Legs';
        break;
      case 'legs':
        nextSplit = 'Push';
        break;
      case 'rest':
        nextSplit = 'Push';
        break;
      default:
        nextSplit = 'Push';
    }
    
    return {
      date: nextDay.toISOString().split('T')[0],
      split: nextSplit
    };
  }

  private getNextWorkoutDay(currentDay: number, schedule: any[]): string {
    const nextDay = new Date();
    let daysToAdd = 1;
    
    // Find next non-rest day
    while (daysToAdd <= 7) {
      const nextDayIndex = (currentDay + daysToAdd) % 7;
      if (schedule[nextDayIndex].split !== 'Rest') {
        nextDay.setDate(nextDay.getDate() + daysToAdd);
        return nextDay.toISOString().split('T')[0];
      }
      daysToAdd++;
    }
    
    return nextDay.toISOString().split('T')[0];
  }

  async assignExerciseToSplit(exerciseId: number, splitId: number): Promise<void> {
    const sql = 'INSERT OR IGNORE INTO exercise_splits (exercise_id, split_id) VALUES (?, ?)';
    await database.run(sql, [exerciseId, splitId]);
  }

  async removeExerciseFromSplit(exerciseId: number, splitId: number): Promise<void> {
    const sql = 'DELETE FROM exercise_splits WHERE exercise_id = ? AND split_id = ?';
    await database.run(sql, [exerciseId, splitId]);
  }

  async getExercisesWithSplits(): Promise<any[]> {
    const sql = `
      SELECT 
        e.*,
        GROUP_CONCAT(ws.name) as split_names,
        GROUP_CONCAT(ws.id) as split_ids
      FROM exercises e
      LEFT JOIN exercise_splits es ON e.id = es.exercise_id
      LEFT JOIN workout_splits ws ON es.split_id = ws.id
      GROUP BY e.id
      ORDER BY e.name
    `;
    return await database.query(sql);
  }
}
