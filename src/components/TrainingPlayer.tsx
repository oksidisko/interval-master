import { useState } from "react";
import { X, SkipBack, Play, Pause, SkipForward, ChevronLeft, ChevronRight } from "lucide-react";

type TimerState = "prepare" | "work" | "rest";

interface TrainingPlayerProps {
  workoutId: string;
  onNavigate: (screen: "home" | "editor" | "player", workoutId?: string) => void;
}

const states: TimerState[] = ["prepare", "work", "rest"];

const TrainingPlayer = ({ workoutId, onNavigate }: TrainingPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [stateIndex, setStateIndex] = useState(0);
  const currentState = states[stateIndex];

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

  const goToPrev = () => {
    setStateIndex((prev) => (prev - 1 + states.length) % states.length);
  };

  const goToNext = () => {
    setStateIndex((prev) => (prev + 1) % states.length);
  };

  const getStateStyles = () => {
    switch (currentState) {
      case "work":
        return "bg-work"; // Red
      case "rest":
        return "bg-rest"; // Green
      case "prepare":
        return "bg-prepare"; // Yellow
    }
  };

  const getTextColor = () => {
    return currentState === "prepare" ? "text-prepare-foreground" : "text-foreground";
  };

  const getStateLabel = () => {
    switch (currentState) {
      case "work":
        return "WORK";
      case "rest":
        return "REST";
      case "prepare":
        return "PREPARE";
    }
  };

  return (
    <div className={`min-h-screen flex flex-col state-transition no-select ${getStateStyles()}`}>
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
          <p className="text-sm font-medium opacity-80">HIIT Burner</p>
          <p className="text-xs opacity-60">Round {data.round}</p>
        </div>

        <div className="w-12 h-12" />
      </header>

      {/* State Indicator */}
      <div className={`mx-4 mt-2 px-4 py-2 rounded-xl bg-black/15 text-center ${getTextColor()}`}>
        <p className="text-2xl font-black tracking-wider">{getStateLabel()}</p>
      </div>

      {/* Next Up Preview */}
      <div className={`mx-4 mt-3 px-4 py-3 rounded-xl bg-black/15 ${getTextColor()}`}>
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

      {/* State Navigation */}
      <div className={`mx-4 mb-4 flex items-center justify-between ${getTextColor()}`}>
        <button
          onClick={goToPrev}
          className="flex items-center gap-1 px-4 py-3 rounded-xl bg-black/20 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold">Prev</span>
        </button>

        <div className="flex gap-2">
          {states.map((state, idx) => (
            <div
              key={state}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === stateIndex ? "bg-white scale-125" : "bg-white/40"
              }`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          className="flex items-center gap-1 px-4 py-3 rounded-xl bg-black/20 active:scale-95 transition-transform"
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
            onClick={() => setIsPlaying(!isPlaying)}
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
    </div>
  );
};

export default TrainingPlayer;
