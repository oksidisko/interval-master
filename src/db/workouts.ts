import { initDB } from './index';
import { Workout } from '../types/workout';
import { validateBlockStructure } from '../utils/blockTypeGuards';

export async function getAllWorkouts(): Promise<Workout[]> {
  const db = await initDB();
  const workouts = await db.getAllFromIndex('workouts', 'by-updated');
  return workouts.reverse(); // Most recently updated first
}

export async function getWorkout(id: string): Promise<Workout | undefined> {
  const db = await initDB();
  return db.get('workouts', id);
}

export async function saveWorkout(workout: Workout): Promise<void> {
  const validationError = validateBlockStructure(workout.blocks);
  if (validationError) {
    throw new Error(`Invalid workout structure: ${validationError}`);
  }

  const db = await initDB();
  workout.updatedAt = Date.now();
  await db.put('workouts', workout);
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('workouts', id);
}
