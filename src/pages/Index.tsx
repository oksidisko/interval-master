import { useState, useEffect } from "react";
import HomeScreen from "@/components/HomeScreen";
import WorkoutEditor from "@/components/WorkoutEditor";
import TrainingPlayer from "@/components/TrainingPlayer";
import { ImportWorkoutDialog } from "@/components/ImportWorkoutDialog";
import { CompactWorkout, decodeBase64Unicode } from "@/utils/shareWorkout";
import { saveWorkout } from "@/db/workouts";
import { useToast } from "@/hooks/use-toast";
import type { Workout } from "@/types/workout";

type Screen = "home" | "editor" | "player";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | undefined>();
  const [sharedWorkout, setSharedWorkout] = useState<CompactWorkout | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const workoutParam = params.get('workout');

    if (workoutParam) {
      try {
        // URL-safe decode
        const base64 = workoutParam.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeBase64Unicode(base64);
        const compact = JSON.parse(json);

        // Basic validation
        if (compact.n && Array.isArray(compact.b) && compact.r !== undefined && compact.c !== undefined) {
          setSharedWorkout(compact);
        } else {
          throw new Error('Invalid workout data');
        }
      } catch (error) {
        toast({
          title: "Invalid workout link",
          description: "The shared workout could not be loaded.",
          variant: "destructive"
        });
      }

      // Clean URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  const handleNavigate = (screen: Screen, workoutId?: string) => {
    setCurrentScreen(screen);
    setActiveWorkoutId(workoutId);
  };

  const handleImportWorkout = async (workout: Workout) => {
    try {
      await saveWorkout(workout);
      setSharedWorkout(null);
      toast({ title: `"${workout.name}" imported successfully!` });
      // Refresh the home screen to show the new workout
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Failed to import workout",
        description: "An error occurred while saving the workout.",
        variant: "destructive"
      });
    }
  };

  const handleCancelImport = () => {
    setSharedWorkout(null);
  };

  return (
    <div className="min-h-screen">
      {currentScreen === "home" && (
        <HomeScreen key={refreshKey} onNavigate={handleNavigate} />
      )}
      {currentScreen === "editor" && (
        <WorkoutEditor workoutId={activeWorkoutId} onNavigate={handleNavigate} />
      )}
      {currentScreen === "player" && activeWorkoutId && (
        <TrainingPlayer workoutId={activeWorkoutId} onNavigate={handleNavigate} />
      )}
      {sharedWorkout && (
        <ImportWorkoutDialog
          compactWorkout={sharedWorkout}
          onImport={handleImportWorkout}
          onCancel={handleCancelImport}
        />
      )}
    </div>
  );
};

export default Index;
