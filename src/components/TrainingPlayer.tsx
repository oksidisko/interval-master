import { useState, useEffect, useRef } from "react";
import { X, SkipBack, Play, Pause, SkipForward, ChevronLeft, ChevronRight } from "lucide-react";
import { getWorkout } from "@/db/workouts";
import type { Workout, Block } from "@/types/workout";
import { VisibilityManager } from "@/utils/visibilityManager";
import { vibrateTransition } from "@/utils/hapticFeedback";
import { AudioManager } from "@/utils/audioManager";
import WorkoutCompletionOverlay from "./WorkoutCompletionOverlay";

type IntervalType = "prepare" | "work" | "rest";

interface ExecutionBlock {
  type: IntervalType;
  title: string;
  duration: number;
  circle: number;
}

interface TrainingPlayerProps {
  workoutId: string;
  onNavigate: (screen: "home" | "editor" | "player", workoutId?: string) => void;
}

const TrainingPlayer = ({ workoutId, onNavigate }: TrainingPlayerProps) => {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [executionSequence, setExecutionSequence] = useState<ExecutionBlock[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const visibilityManagerRef = useRef<VisibilityManager | null>(null);
  const audioManagerRef = useRef<AudioManager>(new AudioManager());
  const lastBeepSecondRef = useRef<number | null>(null);
  const completionDurationRef = useRef<number>(0);

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  // Cleanup audio manager on unmount
  useEffect(() => {
    return () => {
      audioManagerRef.current.cleanup();
    };
  }, []);

  const loadWorkout = async () => {
    try {
      const data = await getWorkout(workoutId);
      if (data) {
        setWorkout(data);
        const sequence = buildExecutionSequence(data);
        setExecutionSequence(sequence);
        setTimeRemaining(sequence[0]?.duration || 0);
      }
    } catch (error) {
      console.error('Failed to load workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildExecutionSequence = (workout: Workout): ExecutionBlock[] => {
    const sequence: ExecutionBlock[] = [];

    for (let circle = 1; circle <= workout.circles; circle++) {
      if (circle === 1) {
        sequence.push({
          type: 'prepare',
          title: 'Get Ready',
          duration: workout.systemRestSec,
          circle: 1
        });
      }

      for (const block of workout.blocks) {
        sequence.push({
          type: block.type,
          title: block.title,
          duration: block.duration,
          circle
        });
      }

      if (circle < workout.circles) {
        sequence.push({
          type: 'prepare',
          title: 'Rest Between Rounds',
          duration: workout.systemRestSec,
          circle: circle + 1
        });
      }
    }

    return sequence;
  };

  const currentBlock = executionSequence[currentBlockIndex];
  const nextBlock = executionSequence[currentBlockIndex + 1];

  const goToPrev = () => {
    if (currentBlockIndex > 0) {
      vibrateTransition();
      setCurrentBlockIndex(prev => prev - 1);
      setTimeRemaining(executionSequence[currentBlockIndex - 1].duration);
      startTimeRef.current = null;
    }
  };

  const goToNext = () => {
    if (currentBlockIndex < executionSequence.length - 1) {
      vibrateTransition();
      setCurrentBlockIndex(prev => prev + 1);
      setTimeRemaining(executionSequence[currentBlockIndex + 1].duration);
      startTimeRef.current = null;
    }
  };

  useEffect(() => {
    if (!isPlaying || !currentBlock) {
      // Cleanup visibility manager when not playing
      if (visibilityManagerRef.current) {
        visibilityManagerRef.current.cleanup();
        visibilityManagerRef.current = null;
      }
      return;
    }

    // Initialize visibility manager when playing starts
    if (!visibilityManagerRef.current) {
      visibilityManagerRef.current = new VisibilityManager((elapsedMs) => {
        // When returning from background, adjust startTime to account for elapsed time
        if (startTimeRef.current !== null) {
          startTimeRef.current -= elapsedMs;
        }
      });
    }

    const tick = () => {
      const now = performance.now();
      const start = startTimeRef.current || now;

      if (!startTimeRef.current) {
        startTimeRef.current = start;
      }

      const elapsed = (now - start) / 1000;
      const remaining = currentBlock.duration - elapsed;
      const remainingSeconds = Math.floor(remaining);

      // Play countdown beeps at 3, 2, 1 (short beeps)
      if (remaining > 0 && remainingSeconds >= 1 && remainingSeconds <= 3) {
        if (lastBeepSecondRef.current !== remainingSeconds) {
          audioManagerRef.current.playCountdownBeep();
          lastBeepSecondRef.current = remainingSeconds;
        }
      }

      // Play longer beep at 0 (same tone, 3x longer)
      if (remaining > 0 && remainingSeconds === 0 && lastBeepSecondRef.current !== 0) {
        audioManagerRef.current.playTransitionBeep();
        lastBeepSecondRef.current = 0;
      }

      if (remaining <= 0) {
        // Don't play beep here since we already played it at remainingSeconds = 0
        lastBeepSecondRef.current = null; // Reset for next block

        // Trigger haptic feedback on block transition
        vibrateTransition();

        if (currentBlockIndex < executionSequence.length - 1) {
          setCurrentBlockIndex(prev => prev + 1);
          setTimeRemaining(executionSequence[currentBlockIndex + 1].duration);
          startTimeRef.current = null;
        } else {
          // Workout completed - last block finished
          setIsPlaying(false);
          setTimeRemaining(0);
          startTimeRef.current = null;

          // Calculate total workout duration
          const totalSeconds = executionSequence.reduce((sum, block) => sum + block.duration, 0);
          completionDurationRef.current = totalSeconds;

          // Show completion overlay
          setShowCompletion(true);
        }
      } else {
        setTimeRemaining(remaining);
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isPlaying, currentBlockIndex, currentBlock, executionSequence]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateStyles = () => {
    if (!currentBlock) return "bg-background";
    switch (currentBlock.type) {
      case "work":
        return "bg-work";
      case "rest":
        return "bg-rest";
      case "prepare":
        return "bg-prepare";
    }
  };

  const getTextColor = () => {
    if (!currentBlock) return "text-foreground";
    return currentBlock.type === "prepare" ? "text-prepare-foreground" : "text-foreground";
  };

  const getStateLabel = () => {
    if (!currentBlock) return "LOADING";
    switch (currentBlock.type) {
      case "work":
        return "WORK";
      case "rest":
        return "REST";
      case "prepare":
        return "PREPARE";
    }
  };

  if (loading || !workout || !currentBlock) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading workout...</p>
      </div>
    );
  }

  return (
    <div className={`dark min-h-screen flex flex-col state-transition no-select ${getStateStyles()}`}>
      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => onNavigate("home")}
          className={`w-12 h-12 rounded-full bg-black/20 flex items-center justify-center active:scale-95 transition-transform ${getTextColor()}`}
          aria-label="Exit workout"
        >
          <X className="w-6 h-6" />
        </button>

        <div className={`text-center ${getTextColor()}`}>
          <p className="text-sm font-medium opacity-80">{workout.name}</p>
          <p className="text-xs opacity-60">Round {currentBlock.circle} of {workout.circles}</p>
        </div>

        <div className="w-12 h-12" />
      </header>

      {/* State Indicator */}
      <div className={`mx-4 mt-2 px-4 py-2 rounded-xl bg-black/15 text-center ${getTextColor()}`}>
        <p className="text-2xl font-black tracking-wider">{getStateLabel()}</p>
      </div>

      {/* Next Up Preview */}
      {nextBlock && (
        <div className={`mx-4 mt-3 px-4 py-3 rounded-xl bg-black/15 ${getTextColor()}`}>
          <p className="text-xs uppercase tracking-wider opacity-70">Next Up</p>
          <div className="flex items-baseline justify-between mt-0.5">
            <p className="text-lg font-semibold">{nextBlock.title}</p>
            <p className="text-lg font-bold tabular-nums">{formatTime(nextBlock.duration)}</p>
          </div>
        </div>
      )}

      {/* Main Timer Display */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <p className={`text-sm font-bold uppercase tracking-[0.2em] mb-2 ${getTextColor()} opacity-80`}>
          {currentBlock.title.toUpperCase()}
        </p>
        <p className={`timer-display tabular-nums ${getTextColor()}`}>
          {formatTime(timeRemaining)}
        </p>
      </main>

      {/* State Navigation */}
      <div className={`mx-4 mb-4 flex items-center justify-between ${getTextColor()}`}>
        <button
          onClick={goToPrev}
          disabled={currentBlockIndex === 0}
          className="flex items-center gap-1 px-4 py-3 rounded-xl bg-black/20 active:scale-95 transition-transform disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold">Prev</span>
        </button>

        <div className="text-sm font-medium">
          {currentBlockIndex + 1} / {executionSequence.length}
        </div>

        <button
          onClick={goToNext}
          disabled={currentBlockIndex === executionSequence.length - 1}
          className="flex items-center gap-1 px-4 py-3 rounded-xl bg-black/20 active:scale-95 transition-transform disabled:opacity-30"
        >
          <span className="font-semibold">Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="px-4 pb-4 safe-bottom">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={goToPrev}
            className={`w-16 h-16 rounded-full bg-black/20 flex items-center justify-center active:scale-95 transition-transform ${getTextColor()}`}
            aria-label="Skip to previous interval"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={async () => {
              if (!isPlaying) {
                // Initialize audio on first play (user gesture required)
                await audioManagerRef.current.initialize();
              }
              setIsPlaying(!isPlaying);
            }}
            className={`w-24 h-24 rounded-full bg-black/30 flex items-center justify-center active:scale-95 transition-transform shadow-2xl ${getTextColor()}`}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 fill-current" />
            ) : (
              <Play className="w-10 h-10 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={goToNext}
            className={`w-16 h-16 rounded-full bg-black/20 flex items-center justify-center active:scale-95 transition-transform ${getTextColor()}`}
            aria-label="Skip to next interval"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>
        </div>
      </div>

      {/* Workout Completion Overlay */}
      {showCompletion && workout && (
        <WorkoutCompletionOverlay
          workoutName={workout.name}
          totalDuration={completionDurationRef.current}
          blocksCompleted={executionSequence.length}
          onDismiss={() => {
            setShowCompletion(false);
            onNavigate("home");
          }}
        />
      )}
    </div>
  );
};

export default TrainingPlayer;
