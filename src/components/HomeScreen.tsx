import { Play, Pencil, Clock, Repeat, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getAllWorkouts } from "@/db/workouts";
import type { Workout as DBWorkout, Block } from "@/types/workout";
import { isSectionBlock } from "@/utils/blockTypeGuards";
import { compactWorkout } from "@/utils/shareWorkout";
import { useToast } from "@/hooks/use-toast";

interface WorkoutDisplay {
  id: string;
  name: string;
  totalDuration: string;
  intervals: number;
}

interface HomeScreenProps {
  onNavigate: (screen: "home" | "editor" | "player", workoutId?: string) => void;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const calculateBlockDuration = (block: Block): number => {
  if (isSectionBlock(block)) {
    // Calculate section duration: (child blocks duration + prep time) * loops
    const childDuration = block.blocks.reduce((sum, child) => sum + child.duration, 0);
    return (childDuration + block.preparationTime) * block.loops;
  }
  // Regular work/rest block (TypeScript knows it's WorkBlock | RestBlock here)
  return (block as { duration: number }).duration;
};

const calculateTotalDuration = (workout: DBWorkout): string => {
  const blocksDuration = workout.blocks.reduce((sum, block) => sum + calculateBlockDuration(block), 0);
  const totalSeconds = (blocksDuration + workout.systemRestSec) * workout.circles;
  return formatDuration(totalSeconds);
};

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const [workouts, setWorkouts] = useState<WorkoutDisplay[]>([]);
  const [fullWorkouts, setFullWorkouts] = useState<DBWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const dbWorkouts = await getAllWorkouts();
      setFullWorkouts(dbWorkouts);
      const displayWorkouts: WorkoutDisplay[] = dbWorkouts.map(workout => ({
        id: workout.id,
        name: workout.name,
        totalDuration: calculateTotalDuration(workout),
        intervals: workout.blocks.length
      }));
      setWorkouts(displayWorkouts);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (workoutId: string) => {
    try {
      const workout = fullWorkouts.find(w => w.id === workoutId);
      if (!workout) {
        toast({ title: "Workout not found", variant: "destructive" });
        return;
      }

      const compactData = compactWorkout(workout);
      const json = JSON.stringify(compactData);
      const base64 = btoa(json);
      const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const shareUrl = `${window.location.origin}?workout=${urlSafe}`;

      console.log('Share URL:', shareUrl);
      console.log('Share URL length:', shareUrl.length);
      console.log('Navigator.share available:', !!navigator.share);

      if (navigator.share) {
        const shareData = {
          title: workout.name,
          text: `Check out my "${workout.name}" workout!`,
          url: shareUrl
        };

        // Check if the data can be shared (Android compatibility check)
        if (navigator.canShare && !navigator.canShare(shareData)) {
          console.error('Cannot share this data:', shareData);
          // Fallback to clipboard
          await navigator.clipboard.writeText(shareUrl);
          toast({ title: "Link copied to clipboard!" });
          return;
        }

        console.log('Attempting to share:', shareData);
        await navigator.share(shareData);
        console.log('Share successful');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied to clipboard!" });
      }
    } catch (error) {
      console.error('Share error:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: "Failed to share",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading workouts...</p>
      </div>
    );
  }

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
          {workouts.map((workout) => (
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
                      {workout.intervals}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(workout.id);
                      }}
                      className="ml-1 p-1 hover:bg-secondary rounded active:scale-95 transition-transform"
                      aria-label="Share workout"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
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
