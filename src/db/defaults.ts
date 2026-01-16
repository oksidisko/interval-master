import { Workout } from '../types/workout';

export const defaultWorkouts: Workout[] = [
  {
    id: '1',
    name: 'HIIT Burner',
    blocks: [
      { id: 'b1', type: 'work', title: 'Sprint', duration: 30 },
      { id: 'b2', type: 'rest', title: 'Recovery', duration: 15 },
      { id: 'b3', type: 'work', title: 'Burpees', duration: 45 },
      { id: 'b4', type: 'rest', title: 'Rest', duration: 30 },
      { id: 'b5', type: 'work', title: 'Jump Squats', duration: 30 },
      { id: 'b6', type: 'rest', title: 'Recovery', duration: 15 },
      { id: 'b7', type: 'work', title: 'Mountain Climbers', duration: 40 },
      { id: 'b8', type: 'rest', title: 'Rest', duration: 20 },
    ],
    systemRestSec: 10,
    circles: 3,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2',
    name: 'Tabata Classic',
    blocks: [
      { id: 't1', type: 'work', title: 'Work', duration: 20 },
      { id: 't2', type: 'rest', title: 'Rest', duration: 10 },
    ],
    systemRestSec: 60,
    circles: 8,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '3',
    name: 'Endurance Builder',
    blocks: [
      { id: 'e1', type: 'work', title: 'Cardio', duration: 180 },
      { id: 'e2', type: 'rest', title: 'Active Recovery', duration: 60 },
      { id: 'e3', type: 'work', title: 'Strength', duration: 120 },
      { id: 'e4', type: 'rest', title: 'Rest', duration: 90 },
      { id: 'e5', type: 'work', title: 'Core', duration: 90 },
      { id: 'e6', type: 'rest', title: 'Active Recovery', duration: 60 },
    ],
    systemRestSec: 120,
    circles: 3,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '4',
    name: 'Quick Warm-Up',
    blocks: [
      { id: 'w1', type: 'work', title: 'Light Jog', duration: 60 },
      { id: 'w2', type: 'rest', title: 'Rest', duration: 15 },
      { id: 'w3', type: 'work', title: 'Dynamic Stretch', duration: 45 },
      { id: 'w4', type: 'rest', title: 'Rest', duration: 15 },
    ],
    systemRestSec: 5,
    circles: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
