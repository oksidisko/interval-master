import { useState } from "react";
import { X, SkipBack, Play, Pause, SkipForward } from "lucide-react";

type TimerState = "prepare" | "work" | "rest";

interface TrainingPlayerProps {
  workoutId: string;
  onNavigate: (screen: "home" | "editor" | "player", workoutId?: string) => void;
}

const TrainingPlayer = ({ workoutId, onNavigate }: TrainingPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentState, setCurrentState] = useState<TimerState>("prepare");

  // Mock data for display
  const mockData = {
    prepare: {
      time: "00:07",
      label: "GET READY",
      next: "Sprint",
      nextDuration: "30s",
      round: "1 of 3",
    },
    work: {
      time: "00:24",
      label: "SPRINT",
      next: "Recovery",
      nextDuration: "15s",
      round: "1 of 3",
    },
    rest: {
      time: "00:12",
      label: "RECOVERY",
      next: "Burpees",
      nextDuration: "45s",
      round: "1 of 3",
    },
  };

  const data = mockData[currentState];

  // Cycle through states for demo
  const cycleState = () => {
    const states: TimerState[] = ["prepare", "work", "rest"];
    const currentIndex = states.indexOf(currentState);
    setCurrentState(states[(currentIndex + 1) % states.length]);
  };

  const getStateStyles = () => {
    switch (currentState) {
      case "work":
        return "bg-work";
      case "rest":
        return "bg-rest";
      case "prepare":
        return "bg-prepare";
    }
  };

  const getTextColor = () => {
    return currentState === "prepare" ? "text-prepare-foreground" : "text-foreground";
  };

  return (
    <div
      className={`min-h-screen flex flex-col state-transition no-select ${getStateStyles()}`}
      onClick={cycleState}
    >
      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate("home");
          }}
          className={`w-12 h-12 rounded-full bg-black/20 flex items-center justify-center active:scale-95 transition-transform ${getTextColor()}`}
          aria-label="Exit workout"
        >
          <X className="w-6 h-6" />
        </button>

        <div className={`text-center ${getTextColor()}`}>
          <p className="text-sm font-medium opacity-80">HIIT Burner</p>
          <p className="text-xs opacity-60">Round {data.round}</p>
        </div>

        <div className="w-12 h-12" /> {/* Spacer for alignment */}
      </header>

      {/* Next Up Preview */}
      <div className={`mx-4 mt-2 px-4 py-3 rounded-xl bg-black/15 ${getTextColor()}`}>
        <p className="text-xs uppercase tracking-wider opacity-70">Next Up</p>
        <div className="flex items-baseline justify-between mt-0.5">
          <p className="text-lg font-semibold">{data.next}</p>
          <p className="text-lg font-bold tabular-nums">{data.nextDuration}</p>
        </div>
      </div>

      {/* Main Timer Display */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <p className={`text-sm font-bold uppercase tracking-[0.2em] mb-2 ${getTextColor()} opacity-80`}>
          {data.label}
        </p>
        <p className={`timer-display tabular-nums ${getTextColor()}`}>
          {data.time}
        </p>
      </main>

      {/* Bottom Controls */}
      <div className="px-4 pb-4 safe-bottom">
        <div className="flex items-center justify-center gap-4">
          {/* Skip Back */}
          <button
            onClick={(e) => e.stopPropagation()}
            className={`w-16 h-16 rounded-full bg-black/20 flex items-center justify-center active:scale-95 transition-transform ${getTextColor()}`}
            aria-label="Skip to previous interval"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          {/* Play/Pause - Largest button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
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

          {/* Skip Forward */}
          <button
            onClick={(e) => e.stopPropagation()}
            className={`w-16 h-16 rounded-full bg-black/20 flex items-center justify-center active:scale-95 transition-transform ${getTextColor()}`}
            aria-label="Skip to next interval"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>
        </div>

        {/* Tap hint */}
        <p className={`text-center text-xs mt-4 opacity-50 ${getTextColor()}`}>
          Tap anywhere to preview states
        </p>
      </div>
    </div>
  );
};

export default TrainingPlayer;
