export interface Block {
  id: string;
  type: 'work' | 'rest';
  title: string;
  duration: number; // seconds
}

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
