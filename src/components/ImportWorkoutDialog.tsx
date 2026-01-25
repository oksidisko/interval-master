import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Repeat } from 'lucide-react';
import { CompactWorkout, CompactBlock, expandWorkout } from '@/utils/shareWorkout';
import { Workout } from '@/types/workout';

interface ImportWorkoutDialogProps {
  compactWorkout: CompactWorkout;
  onImport: (workout: Workout) => void;
  onCancel: () => void;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const calculateCompactBlockDuration = (block: CompactBlock): number => {
  if (block.t === 's') {
    // Section: (child blocks duration + prep time) * loops
    const childDuration = (block.b || []).reduce((sum, child) => sum + child.d, 0);
    return (childDuration + (block.p || 0)) * (block.l || 1);
  }
  return block.d;
};

const calculateTotalDuration = (compactWorkout: CompactWorkout): string => {
  const blocksDuration = compactWorkout.b.reduce((sum, block) => sum + calculateCompactBlockDuration(block), 0);
  const totalSeconds = (blocksDuration + compactWorkout.r) * compactWorkout.c;
  return formatDuration(totalSeconds);
};

const countIntervals = (compactWorkout: CompactWorkout): number => {
  return compactWorkout.b.length;
};

export function ImportWorkoutDialog({ compactWorkout, onImport, onCancel }: ImportWorkoutDialogProps) {
  const handleImport = () => {
    const expanded = expandWorkout(compactWorkout);
    const workout: Workout = {
      ...expanded,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    onImport(workout);
  };

  const totalDuration = calculateTotalDuration(compactWorkout);
  const totalIntervals = countIntervals(compactWorkout);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Workout</DialogTitle>
          <DialogDescription>
            Add "{compactWorkout.n}" to your workouts?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{totalDuration}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Repeat className="w-4 h-4 text-muted-foreground" />
            <span>{totalIntervals} intervals</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Rounds:</span>
            <span>{compactWorkout.c}x</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleImport}>Import Workout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
