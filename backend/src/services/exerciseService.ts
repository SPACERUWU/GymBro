import database from '../database/database';
import { Exercise, CreateExerciseRequest } from '../types';

export class ExerciseService {
  async getAllExercises(): Promise<Exercise[]> {
    const sql = 'SELECT * FROM exercises ORDER BY name';
    return await database.query(sql);
  }

  async getExerciseById(id: number): Promise<Exercise | null> {
    const sql = 'SELECT * FROM exercises WHERE id = ?';
    const result = await database.get(sql, [id]);
    return result || null;
  }

  async createExercise(data: CreateExerciseRequest): Promise<Exercise> {
    const sql = 'INSERT INTO exercises (name, category) VALUES (?, ?)';
    const result = await database.run(sql, [data.name, data.category || null]);
    
    const newExercise = await this.getExerciseById(result.lastID);
    if (!newExercise) {
      throw new Error('Failed to create exercise');
    }
    return newExercise;
  }

  async updateExercise(id: number, data: Partial<CreateExerciseRequest>): Promise<Exercise> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      params.push(data.category);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(id);
    const sql = `UPDATE exercises SET ${updates.join(', ')} WHERE id = ?`;
    await database.run(sql, params);

    const updatedExercise = await this.getExerciseById(id);
    if (!updatedExercise) {
      throw new Error('Exercise not found');
    }
    return updatedExercise;
  }

  async deleteExercise(id: number): Promise<void> {
    const sql = 'DELETE FROM exercises WHERE id = ?';
    const result = await database.run(sql, [id]);
    if (result.changes === 0) {
      throw new Error('Exercise not found');
    }
  }

  async searchExercises(query: string): Promise<Exercise[]> {
    const sql = 'SELECT * FROM exercises WHERE name LIKE ? ORDER BY name';
    return await database.query(sql, [`%${query}%`]);
  }
}
