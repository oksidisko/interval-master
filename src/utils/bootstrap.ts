import { saveWorkout } from '../db/workouts';
import { defaultWorkouts } from '../db/defaults';

const BOOT_KEY = 'workout-timer-initialized';

export async function bootstrapApp(): Promise<void> {
  const bootKey = localStorage.getItem(BOOT_KEY);

  if (!bootKey) {
    console.log('First run detected - seeding default workouts');

    try {
      for (const workout of defaultWorkouts) {
        await saveWorkout(workout);
      }

      const timestamp = Date.now().toString();
      localStorage.setItem(BOOT_KEY, timestamp);
      console.log('Bootstrap complete - default workouts seeded');
    } catch (error) {
      console.error('Failed to bootstrap app:', error);
      throw error;
    }
  }
}
