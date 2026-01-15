import { Play, Pencil, Clock, Repeat } from "lucide-react";

interface Workout {
  id: string;
  name: string;
  totalDuration: string;
  intervals: number;
}

const mockWorkouts: Workout[] = [
  { id: "1", name: "HIIT Burner", totalDuration: "20:00", intervals: 8 },
  { id: "2", name: "Tabata Classic", totalDuration: "4:00", intervals: 8 },
  { id: "3", name: "Endurance Builder", totalDuration: "45:00", intervals: 12 },
  { id: "4", name: "Quick Warm-Up", totalDuration: "5:00", intervals: 4 },
];

interface HomeScreenProps {
  onNavigate: (screen: "home" | "editor" | "player", workoutId?: string) => void;
}

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col no-select">
      {/* Header */}
      <header className="safe-top px-5 pt-6 pb-4">
        <h1 className="text-4xl font-bold tracking-tight">Timer</h1>
        <p className="text-muted-foreground mt-1">Your workouts</p>
      </header>

      {/* Workout List */}
      <main className="flex-1 px-4 pb-32 overflow-y-auto">
        <div className="space-y-3">
          {mockWorkouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-card rounded-2xl p-5 border border-border/50 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold truncate">{workout.name}</h2>
                  <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {workout.totalDuration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Repeat className="w-4 h-4" />
                      {workout.intervals} intervals
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate("editor", workout.id)}
                    className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="Edit workout"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onNavigate("player", workout.id)}
                    className="w-12 h-12 rounded-xl bg-work flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="Start workout"
                  >
                    <Play className="w-5 h-5 text-work-foreground fill-current" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-background/95 backdrop-blur-sm border-t border-border/50">
        <button
          onClick={() => onNavigate("editor")}
          className="w-full h-16 bg-primary text-primary-foreground rounded-2xl text-lg font-bold active:scale-[0.98] transition-transform"
        >
          Add New Workout
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
