// src/utils/compileWorkout.test.ts
import { describe, it, expect } from 'vitest';
import { compileWorkout } from './compileWorkout';
import { calculateWorkoutDuration } from './calculateWorkoutDuration';
import type { Workout, WorkBlock, RestBlock, SectionBlock } from '@/types/workout';
import type { Exercise } from '@/types/exercise';

describe('compileWorkout', () => {
  const makeWorkBlock = (title: string, duration: number, exerciseId?: string): WorkBlock => ({
    id: crypto.randomUUID(),
    type: 'work',
    title,
    duration,
    exerciseId,
  });

  const makeRestBlock = (title: string, duration: number): RestBlock => ({
    id: crypto.randomUUID(),
    type: 'rest',
    title,
    duration,
  });

  const makeWorkout = (blocks: (WorkBlock | RestBlock | SectionBlock)[], circles = 1, systemRestSec = 5): Workout => ({
    id: crypto.randomUUID(),
    name: 'Test Workout',
    blocks,
    circles,
    systemRestSec,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const makeExercise = (title: string, isTwoSided = false): Exercise => ({
    id: crypto.randomUUID(),
    title,
    defaultDuration: 30,
    isTwoSided,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  it('compiles simple workout with prepare block', () => {
    const workout = makeWorkout([makeWorkBlock('Push-ups', 30)]);
    const result = compileWorkout(workout, []);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0]).toMatchObject({ type: 'prepare', title: 'Get Ready', duration: 5 });
    expect(result.blocks[1]).toMatchObject({ type: 'work', title: 'Push-ups', duration: 30 });
  });

  it('skips prepare block when systemRestSec is 0', () => {
    const workout = makeWorkout([makeWorkBlock('Push-ups', 30)], 1, 0);
    const result = compileWorkout(workout, []);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toMatchObject({ type: 'work', title: 'Push-ups' });
  });

  it('expands two-sided exercise into work-rest-work sequence', () => {
    const exercise = makeExercise('Side Plank', true);
    const workBlock = makeWorkBlock('Side Plank', 30, exercise.id);
    const workout = makeWorkout([workBlock], 1, 0);

    const result = compileWorkout(workout, [exercise]);

    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0]).toMatchObject({ type: 'work', title: 'Side Plank', duration: 30 });
    expect(result.blocks[1]).toMatchObject({ type: 'rest', title: 'Switch sides', duration: 10 });
    expect(result.blocks[2]).toMatchObject({ type: 'work', title: 'Side Plank (other side)', duration: 30 });
  });

  it('uses Russian text for two-sided exercises with Cyrillic titles', () => {
    const exercise = makeExercise('Боковая планка', true);
    const workBlock = makeWorkBlock('Боковая планка', 30, exercise.id);
    const workout = makeWorkout([workBlock], 1, 0);

    const result = compileWorkout(workout, [exercise]);

    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0]).toMatchObject({ type: 'work', title: 'Боковая планка', duration: 30 });
    expect(result.blocks[1]).toMatchObject({ type: 'rest', title: 'Смена стороны', duration: 10 });
    expect(result.blocks[2]).toMatchObject({ type: 'work', title: 'Боковая планка (другая сторона)', duration: 30 });
  });

  it('does not expand non-two-sided exercise', () => {
    const exercise = makeExercise('Push-ups', false);
    const workBlock = makeWorkBlock('Push-ups', 30, exercise.id);
    const workout = makeWorkout([workBlock], 1, 0);

    const result = compileWorkout(workout, [exercise]);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toMatchObject({ type: 'work', title: 'Push-ups' });
  });

  it('handles work block without exerciseId', () => {
    const workout = makeWorkout([makeWorkBlock('Custom Exercise', 45)], 1, 0);
    const result = compileWorkout(workout, []);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toMatchObject({ type: 'work', title: 'Custom Exercise', duration: 45 });
  });

  it('repeats blocks for multiple circles with rest between', () => {
    const workout = makeWorkout([makeWorkBlock('Squats', 30)], 2, 5);
    const result = compileWorkout(workout, []);

    expect(result.blocks).toHaveLength(4);
    expect(result.blocks[0]).toMatchObject({ type: 'prepare', title: 'Get Ready', circle: 1 });
    expect(result.blocks[1]).toMatchObject({ type: 'work', title: 'Squats', circle: 1 });
    expect(result.blocks[2]).toMatchObject({ type: 'prepare', title: 'Rest Between Rounds', circle: 2 });
    expect(result.blocks[3]).toMatchObject({ type: 'work', title: 'Squats', circle: 2 });
  });

  it('expands sections with loops', () => {
    const section: SectionBlock = {
      id: crypto.randomUUID(),
      type: 'section',
      title: 'HIIT Set',
      preparationTime: 3,
      loops: 2,
      blocks: [makeWorkBlock('Burpees', 20), makeRestBlock('Rest', 10)],
    };
    const workout = makeWorkout([section], 1, 0);

    const result = compileWorkout(workout, []);

    // 2 loops × (1 prepare + 1 work + 1 rest) = 6 blocks
    expect(result.blocks).toHaveLength(6);
    expect(result.blocks[0]).toMatchObject({ type: 'prepare', title: 'HIIT Set - Get Ready' });
    expect(result.blocks[1]).toMatchObject({ type: 'work', title: 'Burpees' });
    expect(result.blocks[2]).toMatchObject({ type: 'rest', title: 'Rest' });
    expect(result.blocks[3]).toMatchObject({ type: 'prepare', title: 'HIIT Set - Get Ready' });
    expect(result.blocks[4]).toMatchObject({ type: 'work', title: 'Burpees' });
    expect(result.blocks[5]).toMatchObject({ type: 'rest', title: 'Rest' });
  });

  it('expands two-sided exercises inside sections', () => {
    const exercise = makeExercise('Lunges', true);
    const section: SectionBlock = {
      id: crypto.randomUUID(),
      type: 'section',
      title: 'Leg Set',
      preparationTime: 0,
      loops: 1,
      blocks: [{ ...makeWorkBlock('Lunges', 30, exercise.id) }],
    };
    const workout = makeWorkout([section], 1, 0);

    const result = compileWorkout(workout, [exercise]);

    // 1 loop × (0 prepare + 3 blocks from two-sided) = 3 blocks
    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0]).toMatchObject({ type: 'work', title: 'Lunges' });
    expect(result.blocks[1]).toMatchObject({ type: 'rest', title: 'Switch sides' });
    expect(result.blocks[2]).toMatchObject({ type: 'work', title: 'Lunges (other side)' });
  });
});

describe('calculateWorkoutDuration', () => {
  const makeWorkBlock = (title: string, duration: number, exerciseId?: string): WorkBlock => ({
    id: crypto.randomUUID(),
    type: 'work',
    title,
    duration,
    exerciseId,
  });

  const makeWorkout = (blocks: (WorkBlock | RestBlock | SectionBlock)[], circles = 1, systemRestSec = 0): Workout => ({
    id: crypto.randomUUID(),
    name: 'Test Workout',
    blocks,
    circles,
    systemRestSec,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const makeExercise = (id: string, isTwoSided = false): Exercise => ({
    id,
    title: 'Test Exercise',
    defaultDuration: 30,
    isTwoSided,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  it('calculates duration for simple workout without two-sided exercises', () => {
    const workout = makeWorkout([makeWorkBlock('Push-ups', 30)]);
    const duration = calculateWorkoutDuration(workout, []);

    expect(duration).toBe(30);
  });

  it('calculates duration for two-sided exercise (30s + 10s switch + 30s = 70s)', () => {
    const exerciseId = 'exercise-1';
    const exercise = makeExercise(exerciseId, true);
    const workout = makeWorkout([makeWorkBlock('Side Plank', 30, exerciseId)]);

    const duration = calculateWorkoutDuration(workout, [exercise]);

    // 30s (side 1) + 10s (switch) + 30s (side 2) = 70s
    expect(duration).toBe(70);
  });

  it('calculates duration with preparation time and multiple circles', () => {
    const workout = makeWorkout([makeWorkBlock('Squats', 30)], 2, 5);

    const duration = calculateWorkoutDuration(workout, []);

    // Circle 1: 5s (prepare) + 30s (work)
    // Circle 2: 5s (rest between) + 30s (work)
    // Total: 70s
    expect(duration).toBe(70);
  });

  it('calculates duration for two-sided exercise with multiple circles', () => {
    const exerciseId = 'exercise-1';
    const exercise = makeExercise(exerciseId, true);
    const workout = makeWorkout([makeWorkBlock('Lunges', 30, exerciseId)], 2, 5);

    const duration = calculateWorkoutDuration(workout, [exercise]);

    // Circle 1: 5s (prepare) + 30s (side 1) + 10s (switch) + 30s (side 2)
    // Circle 2: 5s (rest between) + 30s (side 1) + 10s (switch) + 30s (side 2)
    // Total: 150s
    expect(duration).toBe(150);
  });
});
