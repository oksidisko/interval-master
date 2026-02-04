# Exercise Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an exercise library feature allowing users to manage reusable exercises with default durations and two-sided support.

**Architecture:** New `exercises` IndexedDB store with CRUD operations. WorkBlocks optionally link to exercises via `exerciseId`. Workout compilation expands two-sided exercises into paired work/rest/work sequences at runtime.

**Tech Stack:** React, TypeScript, IndexedDB (idb), cmdk (existing Command component), Radix UI

---

## Task 1: Add Exercise Type

**Files:**
- Create: `src/types/exercise.ts`

**Step 1: Create the Exercise interface**

```typescript
// src/types/exercise.ts
export interface Exercise {
  id: string;
  title: string;
  defaultDuration: number; // seconds
  isTwoSided: boolean;
  createdAt: number;
  updatedAt: number;
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types/exercise.ts
git commit -m "feat: add Exercise type definition"
```

---

## Task 2: Add exerciseId to WorkBlock

**Files:**
- Modify: `src/types/workout.ts:1-6`

**Step 1: Update WorkBlock interface**

Change `src/types/workout.ts` lines 1-6 from:

```typescript
export interface WorkBlock {
  id: string;
  type: 'work';
  title: string;
  duration: number; // seconds
}
```

To:

```typescript
export interface WorkBlock {
  id: string;
  type: 'work';
  title: string;
  duration: number; // seconds
  exerciseId?: string; // optional link to library exercise
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors (exerciseId is optional, so existing code compiles)

**Step 3: Run existing tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/types/workout.ts
git commit -m "feat: add optional exerciseId to WorkBlock"
```

---

## Task 3: Add Exercises Store to IndexedDB

**Files:**
- Modify: `src/db/index.ts`

**Step 1: Update database schema and version**

Replace entire `src/db/index.ts` with:

```typescript
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
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/db/index.ts
git commit -m "feat: add exercises store to IndexedDB (version 2)"
```

---

## Task 4: Create Exercise CRUD Operations

**Files:**
- Create: `src/db/exercises.ts`

**Step 1: Create exercises database operations**

```typescript
// src/db/exercises.ts
import { initDB } from './index';
import { Exercise } from '../types/exercise';

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await initDB();
  const exercises = await db.getAllFromIndex('exercises', 'by-title');
  return exercises;
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  const db = await initDB();
  return db.get('exercises', id);
}

export async function saveExercise(exercise: Exercise): Promise<void> {
  if (!exercise.title.trim()) {
    throw new Error('Exercise title cannot be empty');
  }
  if (exercise.defaultDuration <= 0) {
    throw new Error('Exercise duration must be positive');
  }

  const db = await initDB();
  exercise.updatedAt = Date.now();
  await db.put('exercises', exercise);
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('exercises', id);
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/db/exercises.ts
git commit -m "feat: add exercise CRUD operations"
```

---

## Task 5: Create Exercise Library Screen

**Files:**
- Create: `src/components/ExerciseLibrary.tsx`

**Step 1: Create the library component**

```typescript
// src/components/ExerciseLibrary.tsx
import { ArrowLeft, Plus, Trash2, Clock, ArrowLeftRight } from "lucide-react";
import { useState, useEffect } from "react";
import { getAllExercises, saveExercise, deleteExercise } from "@/db/exercises";
import type { Exercise } from "@/types/exercise";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ExerciseLibraryProps {
  onNavigate: (screen: "home" | "editor" | "player" | "library", workoutId?: string) => void;
}

const ExerciseLibrary = ({ onNavigate }: ExerciseLibraryProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("30");
  const [isTwoSided, setIsTwoSided] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await getAllExercises();
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingExercise(null);
    setTitle("");
    setDuration("30");
    setIsTwoSided(false);
    setDialogOpen(true);
  };

  const openEditDialog = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setTitle(exercise.title);
    setDuration(exercise.defaultDuration.toString());
    setIsTwoSided(exercise.isTwoSided);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert('Title cannot be empty');
      return;
    }

    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      alert('Duration must be a positive number');
      return;
    }

    const exercise: Exercise = editingExercise
      ? {
          ...editingExercise,
          title: trimmedTitle,
          defaultDuration: parsedDuration,
          isTwoSided,
          updatedAt: Date.now(),
        }
      : {
          id: crypto.randomUUID(),
          title: trimmedTitle,
          defaultDuration: parsedDuration,
          isTwoSided,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

    try {
      await saveExercise(exercise);
      await loadExercises();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save exercise:', error);
      alert('Failed to save exercise');
    }
  };

  const handleDelete = async () => {
    if (!editingExercise) return;

    if (!confirm(`Delete "${editingExercise.title}"?`)) {
      return;
    }

    try {
      await deleteExercise(editingExercise.id);
      await loadExercises();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete exercise:', error);
      alert('Failed to delete exercise');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading exercises...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col no-select">
      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border/50">
        <button
          onClick={() => onNavigate("home")}
          className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">Exercise Library</h1>
        </div>
      </header>

      {/* Exercise List */}
      <main className="flex-1 px-4 py-4 pb-32 overflow-y-auto">
        {exercises.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No exercises yet. Add your first exercise to build your library.
          </p>
        ) : (
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                onClick={() => openEditDialog(exercise)}
                className="rounded-xl p-4 bg-card border border-border/50 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold truncate">{exercise.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {exercise.defaultDuration}s
                      </span>
                      {exercise.isTwoSided && (
                        <span className="flex items-center gap-1">
                          <ArrowLeftRight className="w-4 h-4" />
                          Two-sided
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-background/95 backdrop-blur-sm border-t border-border/50">
        <button
          onClick={openAddDialog}
          className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Plus className="w-5 h-5" />
          Add Exercise
        </button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingExercise ? 'Edit Exercise' : 'Add Exercise'}</DialogTitle>
            <DialogDescription>
              {editingExercise ? 'Modify this exercise.' : 'Create a new exercise for your library.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="exercise-title">Title</Label>
              <Input
                id="exercise-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Push-ups, Squats"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exercise-duration">Default Duration (seconds)</Label>
              <Input
                id="exercise-duration"
                type="number"
                inputMode="numeric"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="two-sided"
                checked={isTwoSided}
                onCheckedChange={(checked) => setIsTwoSided(checked === true)}
              />
              <Label htmlFor="two-sided" className="text-sm font-normal cursor-pointer">
                Two-sided (e.g., left/right)
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2">
            {editingExercise && (
              <Button type="button" variant="destructive" onClick={handleDelete} className="flex-1">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button type="button" variant="dialog" onClick={handleSave} className="flex-1">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExerciseLibrary;
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ExerciseLibrary.tsx
git commit -m "feat: add ExerciseLibrary screen component"
```

---

## Task 6: Add Library Route and Navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Index.tsx`

**Step 1: Check Index.tsx structure**

Run: Read `src/pages/Index.tsx` to understand current navigation structure.

**Step 2: Update Index.tsx to add library screen**

Add import at top:
```typescript
import ExerciseLibrary from "@/components/ExerciseLibrary";
```

Update the screen type to include "library":
```typescript
const [currentScreen, setCurrentScreen] = useState<"home" | "editor" | "player" | "library">("home");
```

Update the onNavigate handler type and add the library case in the render:
```typescript
// In render, add after player case:
{currentScreen === "library" && (
  <ExerciseLibrary onNavigate={handleNavigate} />
)}
```

**Step 3: Update HomeScreen to add library button**

Modify `src/components/HomeScreen.tsx`:

Update the props interface:
```typescript
interface HomeScreenProps {
  onNavigate: (screen: "home" | "editor" | "player" | "library", workoutId?: string) => void;
}
```

Add library button in the bottom section, between the workout list and the "Add New Workout" button. Find the fixed bottom div and update it:

```typescript
{/* Fixed Bottom Action */}
<div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-background/95 backdrop-blur-sm border-t border-border/50">
  <button
    onClick={() => onNavigate("library")}
    className="w-full h-12 mb-3 bg-secondary text-secondary-foreground rounded-xl font-semibold active:scale-[0.98] transition-transform"
  >
    Exercise Library
  </button>
  <button
    onClick={() => onNavigate("editor")}
    className="w-full h-16 bg-primary text-primary-foreground rounded-2xl text-lg font-bold active:scale-[0.98] transition-transform"
  >
    Add New Workout
  </button>
</div>
```

**Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/pages/Index.tsx src/components/HomeScreen.tsx
git commit -m "feat: add library navigation and button on home screen"
```

---

## Task 7: Create ExerciseCombobox Component

**Files:**
- Create: `src/components/ui/exercise-combobox.tsx`

**Step 1: Create the combobox component**

```typescript
// src/components/ui/exercise-combobox.tsx
import * as React from "react";
import { Check, ChevronsUpDown, Clock, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Exercise } from "@/types/exercise";

interface ExerciseComboboxProps {
  exercises: Exercise[];
  value: string; // current title text
  exerciseId?: string; // current linked exercise ID
  onSelect: (title: string, duration: number, exerciseId?: string) => void;
  onChange: (title: string) => void;
  placeholder?: string;
}

export function ExerciseCombobox({
  exercises,
  value,
  exerciseId,
  onSelect,
  onChange,
  placeholder = "Search exercises...",
}: ExerciseComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredExercises = exercises.filter((exercise) =>
    exercise.title.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise.title, exercise.defaultDuration, exercise.id);
    setInputValue(exercise.title);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {inputValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue ? (
                <span className="text-muted-foreground">
                  Using "{inputValue}" as custom title
                </span>
              ) : (
                "Type to search or enter custom title"
              )}
            </CommandEmpty>
            {filteredExercises.length > 0 && (
              <CommandGroup heading="From Library">
                {filteredExercises.map((exercise) => (
                  <CommandItem
                    key={exercise.id}
                    value={exercise.id}
                    onSelect={() => handleSelect(exercise)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          exerciseId === exercise.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{exercise.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 ml-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exercise.defaultDuration}s
                      </span>
                      {exercise.isTwoSided && (
                        <ArrowLeftRight className="w-3 h-3" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ui/exercise-combobox.tsx
git commit -m "feat: add ExerciseCombobox component"
```

---

## Task 8: Integrate Combobox into WorkoutEditor

**Files:**
- Modify: `src/components/WorkoutEditor.tsx`

**Step 1: Add imports**

Add at top of file:
```typescript
import { getAllExercises } from "@/db/exercises";
import type { Exercise } from "@/types/exercise";
import { ExerciseCombobox } from "@/components/ui/exercise-combobox";
```

**Step 2: Add exercises state**

After the existing state declarations (around line 138), add:
```typescript
const [exercises, setExercises] = useState<Exercise[]>([]);
```

**Step 3: Load exercises on mount**

Update the `useEffect` that calls `loadWorkout()` and `loadSettings()` to also load exercises:
```typescript
useEffect(() => {
  loadWorkout();
  loadSettings();
  loadExercises();
}, [workoutId]);
```

Add the load function after `loadSettings`:
```typescript
const loadExercises = async () => {
  try {
    const data = await getAllExercises();
    setExercises(data);
  } catch (error) {
    console.error('Failed to load exercises:', error);
  }
};
```

**Step 4: Replace title input with combobox in edit dialog**

In the edit block dialog (around line 746-752), replace the title input section:

From:
```typescript
{/* Title Input */}
<div className="grid gap-2">
  <Label htmlFor="block-title">Title</Label>
  <Input
    id="block-title"
    value={editingBlock.title}
    onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
    placeholder="e.g., Push-ups, Break"
  />
</div>
```

To:
```typescript
{/* Title Input */}
<div className="grid gap-2">
  <Label htmlFor="block-title">Title</Label>
  {editingBlock.type === 'work' ? (
    <ExerciseCombobox
      exercises={exercises}
      value={editingBlock.title}
      exerciseId={'exerciseId' in editingBlock ? editingBlock.exerciseId : undefined}
      onSelect={(title, duration, exerciseId) => {
        setEditingBlock({ ...editingBlock, title, exerciseId } as WorkBlock);
        setDurationInput(duration.toString());
      }}
      onChange={(title) => {
        // Clear exerciseId when typing custom text
        setEditingBlock({ ...editingBlock, title, exerciseId: undefined } as WorkBlock);
      }}
      placeholder="Search exercises or type custom..."
    />
  ) : (
    <Input
      id="block-title"
      value={editingBlock.title}
      onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
      placeholder="e.g., Break, Recovery"
    />
  )}
</div>
```

**Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/components/WorkoutEditor.tsx
git commit -m "feat: integrate ExerciseCombobox into WorkoutEditor"
```

---

## Task 9: Add Title Sync on Workout Load

**Files:**
- Modify: `src/components/WorkoutEditor.tsx`

**Step 1: Create sync function**

Add this function after `loadExercises`:

```typescript
const syncExerciseTitles = async (workout: Workout, exerciseList: Exercise[]): Promise<Workout> => {
  const exerciseMap = new Map(exerciseList.map(e => [e.id, e]));
  let hasChanges = false;

  const syncBlock = (block: WorkBlock | RestBlock): WorkBlock | RestBlock => {
    if (block.type === 'work' && 'exerciseId' in block && block.exerciseId) {
      const exercise = exerciseMap.get(block.exerciseId);
      if (exercise && exercise.title !== block.title) {
        hasChanges = true;
        return { ...block, title: exercise.title };
      }
    }
    return block;
  };

  const syncedBlocks = workout.blocks.map(block => {
    if (isSectionBlock(block)) {
      const syncedChildren = block.blocks.map(syncBlock);
      const childrenChanged = syncedChildren.some((child, i) => child !== block.blocks[i]);
      if (childrenChanged) {
        hasChanges = true;
        return { ...block, blocks: syncedChildren };
      }
      return block;
    }
    return syncBlock(block as WorkBlock | RestBlock);
  });

  if (hasChanges) {
    const updated = { ...workout, blocks: syncedBlocks, updatedAt: Date.now() };
    await saveWorkout(updated);
    return updated;
  }

  return workout;
};
```

**Step 2: Update loadWorkout to sync titles**

Modify the `loadWorkout` function to sync titles after loading both workout and exercises:

```typescript
const loadWorkout = async () => {
  try {
    // Load exercises first
    const exerciseList = await getAllExercises();
    setExercises(exerciseList);

    if (workoutId) {
      let data = await getWorkout(workoutId);
      if (data) {
        // Sync titles from library
        data = await syncExerciseTitles(data, exerciseList);
        setWorkout(data);
      }
    } else {
      const newWorkout: Workout = {
        id: crypto.randomUUID(),
        name: 'New Workout',
        blocks: [],
        systemRestSec: 10,
        circles: 3,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setWorkout(newWorkout);
    }
  } catch (error) {
    console.error('Failed to load workout:', error);
  } finally {
    setLoading(false);
  }
};
```

**Step 3: Remove separate loadExercises call from useEffect**

Update the useEffect to only call loadWorkout (which now loads exercises too):

```typescript
useEffect(() => {
  loadWorkout();
  loadSettings();
}, [workoutId]);
```

Remove the separate `loadExercises` function since it's now incorporated into `loadWorkout`.

**Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/components/WorkoutEditor.tsx
git commit -m "feat: sync exercise titles from library on workout load"
```

---

## Task 10: Create Workout Compiler with Two-Sided Support

**Files:**
- Create: `src/utils/compileWorkout.ts`

**Step 1: Create the compiler utility**

```typescript
// src/utils/compileWorkout.ts
import type { Workout, Block, SectionBlock, WorkBlock, RestBlock } from '@/types/workout';
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
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/utils/compileWorkout.ts
git commit -m "feat: add workout compiler with two-sided exercise support"
```

---

## Task 11: Integrate Compiler into TrainingPlayer

**Files:**
- Modify: `src/components/TrainingPlayer.tsx`

**Step 1: Add imports**

Add at top of file:
```typescript
import { compileWorkout, CompiledWorkout, ExecutionBlock as CompiledExecutionBlock } from "@/utils/compileWorkout";
import { getAllExercises } from "@/db/exercises";
```

**Step 2: Remove local ExecutionBlock interface**

Delete lines 13-18 (the local ExecutionBlock interface) since we're now importing it.

Update the type reference: change `ExecutionBlock` to `CompiledExecutionBlock` or update the import to rename:
```typescript
import { compileWorkout, CompiledWorkout, ExecutionBlock } from "@/utils/compileWorkout";
```

**Step 3: Remove buildExecutionSequence and expandSection functions**

Delete the `expandSection` function (lines 70-97) and `buildExecutionSequence` function (lines 99-140) since the compiler now handles this.

**Step 4: Update loadWorkout to use compiler**

Replace the `loadWorkout` function:

```typescript
const loadWorkout = async () => {
  try {
    const data = await getWorkout(workoutId);
    if (data) {
      setWorkout(data);

      // Load exercises and compile workout
      const exercises = await getAllExercises();
      const compiled = compileWorkout(data, exercises);
      setExecutionSequence(compiled.blocks);
      setTimeRemaining(compiled.blocks[0]?.duration || 0);
    }
  } catch (error) {
    console.error('Failed to load workout:', error);
  } finally {
    setLoading(false);
  }
};
```

**Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/components/TrainingPlayer.tsx
git commit -m "feat: integrate workout compiler into TrainingPlayer"
```

---

## Task 12: Write Tests for Workout Compiler

**Files:**
- Create: `src/utils/compileWorkout.test.ts`

**Step 1: Create test file**

```typescript
// src/utils/compileWorkout.test.ts
import { describe, it, expect } from 'vitest';
import { compileWorkout } from './compileWorkout';
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
```

**Step 2: Run the tests**

Run: `npm test src/utils/compileWorkout.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/utils/compileWorkout.test.ts
git commit -m "test: add tests for workout compiler"
```

---

## Task 13: Final Integration Test

**Files:** None (manual testing)

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Manual test checklist**

1. **Exercise Library:**
   - [ ] Navigate to library from home screen
   - [ ] Add a new exercise
   - [ ] Add a two-sided exercise (e.g., "Side Plank")
   - [ ] Edit an exercise
   - [ ] Delete an exercise

2. **WorkoutEditor:**
   - [ ] Create new workout
   - [ ] Add work block, see combobox with library exercises
   - [ ] Select exercise from library, duration auto-fills
   - [ ] Type custom title, block becomes unlinked
   - [ ] Add rest block (should use regular input, not combobox)

3. **Title sync:**
   - [ ] Create workout with linked exercise
   - [ ] Edit exercise title in library
   - [ ] Reopen workout editor, title should update

4. **Two-sided execution:**
   - [ ] Create workout with two-sided exercise
   - [ ] Start workout
   - [ ] Verify: exercise plays → "Switch sides" (10s) → exercise (other side)

**Step 3: Fix any issues found**

If issues found, create additional tasks to fix them.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete exercise library feature"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add Exercise type | `src/types/exercise.ts` |
| 2 | Add exerciseId to WorkBlock | `src/types/workout.ts` |
| 3 | Add exercises store to IndexedDB | `src/db/index.ts` |
| 4 | Create exercise CRUD operations | `src/db/exercises.ts` |
| 5 | Create ExerciseLibrary screen | `src/components/ExerciseLibrary.tsx` |
| 6 | Add library route and navigation | `src/pages/Index.tsx`, `src/components/HomeScreen.tsx` |
| 7 | Create ExerciseCombobox component | `src/components/ui/exercise-combobox.tsx` |
| 8 | Integrate combobox into WorkoutEditor | `src/components/WorkoutEditor.tsx` |
| 9 | Add title sync on workout load | `src/components/WorkoutEditor.tsx` |
| 10 | Create workout compiler | `src/utils/compileWorkout.ts` |
| 11 | Integrate compiler into TrainingPlayer | `src/components/TrainingPlayer.tsx` |
| 12 | Write tests for compiler | `src/utils/compileWorkout.test.ts` |
| 13 | Final integration test | Manual testing |
