import { Check } from "lucide-react";

interface WorkoutCompletionOverlayProps {
  workoutName: string;
  totalDuration: number; // seconds
  blocksCompleted: number;
  onDismiss: () => void;
}

const WorkoutCompletionOverlay = ({
  workoutName,
  totalDuration,
  blocksCompleted,
  onDismiss,
}: WorkoutCompletionOverlayProps) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass animate-in fade-in duration-300">
      <div className="w-full max-w-md mx-4 bg-card rounded-3xl p-8 animate-in slide-in-from-bottom-4 duration-500">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-rest flex items-center justify-center">
            <Check className="w-12 h-12 text-rest-foreground" strokeWidth={3} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center mb-2">
          Workout Complete!
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Great job finishing your workout
        </p>

        {/* Stats Grid */}
        <div className="space-y-4 mb-8">
          <div className="bg-secondary rounded-2xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Workout</p>
            <p className="text-xl font-bold">{workoutName}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary rounded-2xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Duration</p>
              <p className="text-2xl font-bold tabular-nums">{formatDuration(totalDuration)}</p>
            </div>

            <div className="bg-secondary rounded-2xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Blocks</p>
              <p className="text-2xl font-bold tabular-nums">{blocksCompleted}</p>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onDismiss}
          className="w-full h-14 bg-primary text-primary-foreground rounded-2xl text-lg font-bold active:scale-[0.98] transition-transform"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default WorkoutCompletionOverlay;
