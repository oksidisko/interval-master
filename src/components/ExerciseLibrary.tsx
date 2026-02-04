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
