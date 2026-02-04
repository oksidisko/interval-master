import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Workout } from '../types/workout';
import { Exercise } from '../types/exercise';

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
  exercises: {
    key: string;
    value: Exercise;
    indexes: { 'by-title': string };
  };
}

const DB_NAME = 'workout-timer-db';
const DB_VERSION = 2;

export async function initDB(): Promise<IDBPDatabase<WorkoutTimerDB>> {
  return openDB<WorkoutTimerDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create workouts store (version 1)
      if (!db.objectStoreNames.contains('workouts')) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('by-updated', 'updatedAt');
      }

      // Create settings store (version 1)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Create exercises store (version 2)
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('exercises')) {
          const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
          exerciseStore.createIndex('by-title', 'title');
        }
      }
    },
  });
}
