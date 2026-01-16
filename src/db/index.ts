import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Workout } from '../types/workout';

interface WorkoutTimerDB extends DBSchema {
  workouts: {
    key: string;
    value: Workout;
    indexes: { 'by-updated': number };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'workout-timer-db';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<WorkoutTimerDB>> {
  return openDB<WorkoutTimerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create workouts store
      if (!db.objectStoreNames.contains('workouts')) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('by-updated', 'updatedAt');
      }

      // Create settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
}
