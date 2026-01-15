import { useState } from "react";
import HomeScreen from "@/components/HomeScreen";
import WorkoutEditor from "@/components/WorkoutEditor";
import TrainingPlayer from "@/components/TrainingPlayer";

type Screen = "home" | "editor" | "player";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | undefined>();

  const handleNavigate = (screen: Screen, workoutId?: string) => {
    setCurrentScreen(screen);
    setActiveWorkoutId(workoutId);
  };

  return (
    <div className="min-h-screen">
      {currentScreen === "home" && (
        <HomeScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === "editor" && (
        <WorkoutEditor workoutId={activeWorkoutId} onNavigate={handleNavigate} />
      )}
      {currentScreen === "player" && activeWorkoutId && (
        <TrainingPlayer workoutId={activeWorkoutId} onNavigate={handleNavigate} />
      )}
    </div>
  );
};

export default Index;
