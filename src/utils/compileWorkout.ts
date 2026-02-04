// src/utils/compileWorkout.ts
import type { Workout, SectionBlock, WorkBlock, RestBlock } from '@/types/workout';
import type { Exercise } from '@/types/exercise';
import { isSectionBlock } from './blockTypeGuards';

export interface ExecutionBlock {
  type: 'work' | 'rest' | 'prepare';
  title: string;
  duration: number;
  circle: number;
}

export interface CompiledWorkout {
  name: string;
  circles: number;
  blocks: ExecutionBlock[];
}

const TWO_SIDED_REST_DURATION = 10; // seconds between sides

export function compileWorkout(
  workout: Workout,
  exercises: Exercise[]
): CompiledWorkout {
  const exerciseMap = new Map(exercises.map(e => [e.id, e]));
  const sequence: ExecutionBlock[] = [];

  const expandTwoSided = (
    block: WorkBlock,
    circle: number,
    sequence: ExecutionBlock[]
  ): void => {
    const exercise = block.exerciseId ? exerciseMap.get(block.exerciseId) : undefined;

    if (exercise?.isTwoSided) {
      // First side
      sequence.push({
        type: 'work',
        title: block.title,
        duration: block.duration,
        circle,
      });

      // Rest between sides
      sequence.push({
        type: 'rest',
        title: 'Switch sides',
        duration: TWO_SIDED_REST_DURATION,
        circle,
      });

      // Second side
      sequence.push({
        type: 'work',
        title: `${block.title} (other side)`,
        duration: block.duration,
        circle,
      });
    } else {
      // Regular work block
      sequence.push({
        type: 'work',
        title: block.title,
        duration: block.duration,
        circle,
      });
    }
  };

  const expandBlock = (
    block: WorkBlock | RestBlock,
    circle: number,
    sequence: ExecutionBlock[]
  ): void => {
    if (block.type === 'work') {
      expandTwoSided(block as WorkBlock, circle, sequence);
    } else {
      sequence.push({
        type: 'rest',
        title: block.title,
        duration: block.duration,
        circle,
      });
    }
  };

  const expandSection = (
    section: SectionBlock,
    circle: number,
    sequence: ExecutionBlock[]
  ): void => {
    for (let loop = 1; loop <= section.loops; loop++) {
      // Add preparation before each section loop
      if (section.preparationTime > 0) {
        sequence.push({
          type: 'prepare',
          title: `${section.title} - Get Ready`,
          duration: section.preparationTime,
          circle,
        });
      }

      // Add all child blocks
      for (const childBlock of section.blocks) {
        expandBlock(childBlock, circle, sequence);
      }
    }
  };

  // Build execution sequence
  for (let circle = 1; circle <= workout.circles; circle++) {
    // Initial preparation
    if (circle === 1 && workout.systemRestSec > 0) {
      sequence.push({
        type: 'prepare',
        title: 'Get Ready',
        duration: workout.systemRestSec,
        circle: 1,
      });
    }

    // Process each block
    for (const block of workout.blocks) {
      if (isSectionBlock(block)) {
        expandSection(block, circle, sequence);
      } else {
        expandBlock(block as WorkBlock | RestBlock, circle, sequence);
      }
    }

    // Rest between rounds
    if (circle < workout.circles && workout.systemRestSec > 0) {
      sequence.push({
        type: 'prepare',
        title: 'Rest Between Rounds',
        duration: workout.systemRestSec,
        circle: circle + 1,
      });
    }
  }

  return {
    name: workout.name,
    circles: workout.circles,
    blocks: sequence,
  };
}
