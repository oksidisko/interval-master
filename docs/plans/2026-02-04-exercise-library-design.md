# Exercise Library Design

## Overview

Add an exercise library feature that allows users to manage reusable exercises with default durations. Exercises can be selected when creating work blocks, with optional linking for title sync. Two-sided exercises (e.g., Bulgarian split squats, side plank) automatically expand into paired work blocks during workout execution.

## Data Model

### New Exercise Type

```typescript
interface Exercise {
  id: string;
  title: string;
  defaultDuration: number; // seconds
  isTwoSided: boolean;     // e.g., left/right exercises
  createdAt: number;
  updatedAt: number;
}
```

### Updated WorkBlock Type

```typescript
interface WorkBlock {
  id: string;
  type: 'work';
  title: string;
  duration: number;
  exerciseId?: string; // Optional link to library exercise
}
```

When `exerciseId` is present, the block is linked. The title syncs from the library exercise (for typo fixes/renames). The duration remains independent.

### Execution Types (for compiled workouts)

```typescript
interface ExecutionBlock {
  type: 'work' | 'rest';
  title: string;
  duration: number;
}

interface CompiledWorkout {
  name: string;
  blocks: ExecutionBlock[];
}
```

### IndexedDB Changes

New store added in version 2:

```typescript
exercises: {
  key: string;           // Exercise ID
  value: Exercise;
  indexes: { 'by-title': string };
}
```

## Exercise Library Screen

**Route:** `/library`

**Navigation:** Button on home screen labeled "Exercise Library"

**UI Layout:**
- Header with "Exercise Library" title and back button
- Alphabetically sorted list of exercises
- Each row shows: title, default duration, two-sided indicator (if applicable)
- Tap row to edit
- Bottom button: "+ Add Exercise"

**Add/Edit Dialog:**
- Title input (required)
- Default duration input (seconds)
- Two-sided checkbox
- Save / Cancel buttons
- Delete button (edit mode, with confirmation)

**Empty state:** "No exercises yet. Add your first exercise to build your library."

## Exercise Selection in WorkoutEditor

Replace the work block title input with an autocomplete combobox.

**Behavior:**
1. On focus, show all library exercises as suggestions
2. As user types, filter suggestions (case-insensitive substring match)
3. Selecting a suggestion:
   - Sets title to exercise title
   - Sets duration to exercise's defaultDuration
   - Sets exerciseId to link the block
4. Typing custom value (not selecting):
   - Uses typed text as title
   - Keeps current duration
   - Clears exerciseId (unlinked)

**Title sync:** When loading a workout, if a block has exerciseId, fetch current exercise title and update block.title if it differs.

## Workout Compilation

**When:** User taps "Start" on a workout.

**Function:** `compileWorkout(workout: Workout, exercises: Exercise[]): CompiledWorkout`

**Steps:**

1. **Flatten structure** — Expand sections by repeating blocks × loops, with section preparation rest between loops

2. **Apply global circles** — Repeat flattened sequence × workout.circles, with systemRestSec between rounds

3. **Expand two-sided exercises** — For work blocks linked to two-sided exercises:
   ```
   Original: { title: "Side Plank", duration: 30 }

   Becomes:
   - { type: 'work', title: "Side Plank", duration: 30 }
   - { type: 'rest', title: "Switch sides", duration: 10 }
   - { type: 'work', title: "Side Plank (other side)", duration: 30 }
   ```

   Rest duration between sides: fixed 10 seconds.

4. **Return flat array** — TrainingPlayer receives simple ExecutionBlock[] to run.

## File Changes

### New Files
- `src/types/exercise.ts` — Exercise interface
- `src/db/exercises.ts` — CRUD operations
- `src/components/ExerciseLibrary.tsx` — Library screen
- `src/components/ui/combobox.tsx` — Autocomplete component
- `src/utils/compileWorkout.ts` — Workout compilation

### Modified Files
- `src/types/workout.ts` — Add exerciseId to WorkBlock, add ExecutionBlock
- `src/db/index.ts` — DB version 2, add exercises store
- `src/components/WorkoutEditor.tsx` — Combobox for title, title sync on load
- `src/components/TrainingPlayer.tsx` — Accept compiled workout
- `src/components/HomeScreen.tsx` — Add library button, compile on start
- `src/App.tsx` — Add /library route

## Migration

Version 1 → 2 upgrade creates empty exercises store. Existing workouts work unchanged (blocks without exerciseId are unlinked).

## Design Decisions

- **Dedicated library page** over inline-only management for discoverability
- **Button on home screen** over nav bar for simplicity
- **Optional linking** — plain text titles still work, library is opt-in
- **Title syncs, duration doesn't** — titles are about correctness, durations vary intentionally
- **Basic CRUD only** — no categories/tags for now, add later if needed
- **Compile on start** — keeps workout plan clean, expansion is runtime-only
- **Fixed 10s rest for two-sided** — simple, no per-exercise configuration
