import { ArrowLeft, GripVertical, Trash2, Plus, Settings2 } from "lucide-react";

interface Block {
  id: string;
  type: "work" | "rest";
  title: string;
  duration: number; // seconds
}

const mockBlocks: Block[] = [
  { id: "1", type: "work", title: "Sprint", duration: 30 },
  { id: "2", type: "rest", title: "Recovery", duration: 15 },
  { id: "3", type: "work", title: "Burpees", duration: 45 },
  { id: "4", type: "rest", title: "Rest", duration: 30 },
  { id: "5", type: "work", title: "Jump Squats", duration: 30 },
  { id: "6", type: "rest", title: "Recovery", duration: 15 },
];

interface WorkoutEditorProps {
  workoutId?: string;
  onNavigate: (screen: "home" | "editor" | "player", workoutId?: string) => void;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${secs}s`;
};

const WorkoutEditor = ({ workoutId, onNavigate }: WorkoutEditorProps) => {
  const isNew = !workoutId;

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
          <input
            type="text"
            defaultValue={isNew ? "" : "HIIT Burner"}
            placeholder="Workout Name"
            className="w-full bg-transparent text-2xl font-bold placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <button
          className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Settings"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </header>

      {/* Global Settings */}
      <div className="px-4 py-4 border-b border-border/30">
        <div className="flex gap-4">
          <div className="flex-1 bg-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rounds</p>
            <p className="text-3xl font-bold tabular-nums">3</p>
          </div>
          <div className="flex-1 bg-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prep Time</p>
            <p className="text-3xl font-bold tabular-nums">10s</p>
          </div>
        </div>
      </div>

      {/* Block List */}
      <main className="flex-1 px-4 py-4 pb-32 overflow-y-auto">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Intervals</p>
        <div className="space-y-2">
          {mockBlocks.map((block, index) => (
            <div
              key={block.id}
              className={`rounded-xl p-4 flex items-center gap-3 border-l-4 ${
                block.type === "work"
                  ? "bg-work/10 border-work"
                  : "bg-rest/10 border-rest"
              }`}
            >
              <button
                className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center touch-manipulation"
                aria-label="Drag to reorder"
              >
                <GripVertical className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      block.type === "work"
                        ? "bg-work text-work-foreground"
                        : "bg-rest text-rest-foreground"
                    }`}
                  >
                    {block.type}
                  </span>
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                </div>
                <p className="text-lg font-semibold mt-1 truncate">{block.title}</p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">
                  {formatDuration(block.duration)}
                </p>
              </div>

              <button
                className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Delete block"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom glass">
        <div className="flex gap-3">
          <button className="flex-1 h-14 bg-work/20 text-work border border-work/30 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <Plus className="w-5 h-5" />
            Work
          </button>
          <button className="flex-1 h-14 bg-rest/20 text-rest border border-rest/30 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <Plus className="w-5 h-5" />
            Rest
          </button>
        </div>
        <button
          onClick={() => onNavigate("player", workoutId || "1")}
          className="w-full h-14 mt-3 bg-primary text-primary-foreground rounded-xl text-lg font-bold active:scale-[0.98] transition-transform"
        >
          Start Workout
        </button>
      </div>
    </div>
  );
};

export default WorkoutEditor;
