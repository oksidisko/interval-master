export interface WorkBlock {
  id: string;
  type: 'work';
  title: string;
  duration: number; // seconds
  exerciseId?: string; // optional link to library exercise
}

export interface RestBlock {
  id: string;
  type: 'rest';
  title: string;
  duration: number; // seconds
}

export interface SectionBlock {
  id: string;
  type: 'section';
  title: string;
  preparationTime: number;  // seconds, rest before each loop
  loops: number;            // repetitions of contained blocks
  blocks: Array<WorkBlock | RestBlock>;  // one-level nesting only
}

export type Block = WorkBlock | RestBlock | SectionBlock;

export interface Workout {
  id: string;
  name: string;
  blocks: Block[];
  systemRestSec: number;
  circles: number;
  createdAt: number;
  updatedAt: number;
}

export type TimerState = 'idle' | 'running' | 'paused' | 'completed';
export type IntervalType = 'work' | 'rest' | 'prepare';
