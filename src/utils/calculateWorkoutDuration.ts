// src/utils/calculateWorkoutDuration.ts
import { compileWorkout } from './compileWorkout';
import type { Workout } from '@/types/workout';
import type { Exercise } from '@/types/exercise';

/**
 * Calculate total workout duration by compiling the workout
 * and summing all execution block durations.
 *
 * This accounts for two-sided exercises which expand to:
 * duration (side 1) + 10s (switch) + duration (side 2)
 */
export function calculateWorkoutDuration(workout: Workout, exercises: Exercise[]): number {
  const compiled = compileWorkout(workout, exercises);
  return compiled.blocks.reduce((sum, block) => sum + block.duration, 0);
}
