// src/db/exercises.ts
import { initDB } from './index';
import { Exercise } from '../types/exercise';

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await initDB();
  const exercises = await db.getAllFromIndex('exercises', 'by-title');
  return exercises;
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  const db = await initDB();
  return db.get('exercises', id);
}

export async function saveExercise(exercise: Exercise): Promise<void> {
  if (!exercise.title.trim()) {
    throw new Error('Exercise title cannot be empty');
  }
  if (exercise.defaultDuration <= 0) {
    throw new Error('Exercise duration must be positive');
  }

  const db = await initDB();
  exercise.updatedAt = Date.now();
  await db.put('exercises', exercise);
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('exercises', id);
}
