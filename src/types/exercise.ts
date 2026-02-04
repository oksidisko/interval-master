// src/types/exercise.ts
export interface Exercise {
  id: string;
  title: string;
  defaultDuration: number; // seconds
  isTwoSided: boolean;
  createdAt: number;
  updatedAt: number;
}
