import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { SectionBlock } from "@/types/workout";

interface SectionSettingsDialogProps {
  section: SectionBlock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedSection: SectionBlock) => void;
}

export const SectionSettingsDialog = ({
  section,
  open,
  onOpenChange,
  onSave,
}: SectionSettingsDialogProps) => {
  const [loops, setLoops] = useState(3);
  const [preparationTime, setPreparationTime] = useState(10);

  useEffect(() => {
    if (section) {
      setLoops(section.loops);
      setPreparationTime(section.preparationTime);
    }
  }, [section]);

  const handleSave = () => {
    if (!section) return;

    onSave({
      ...section,
      loops,
      preparationTime,
    });

    onOpenChange(false);
  };

  if (!section) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] dialog-content">
        <DialogHeader>
          <DialogTitle>Section Settings</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Loops Slider */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="loops">Loops</Label>
              <span className="text-2xl font-bold tabular-nums">{loops}</span>
            </div>
            <Slider
              id="loops"
              min={1}
              max={20}
              step={1}
              value={[loops]}
              onValueChange={(value) => setLoops(value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Number of times to repeat the intervals in this section
            </p>
          </div>

          {/* Preparation Time Slider */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="prep-time">Preparation Time</Label>
              <span className="text-2xl font-bold tabular-nums">{preparationTime}s</span>
            </div>
            <Slider
              id="prep-time"
              min={0}
              max={60}
              step={5}
              value={[preparationTime]}
              onValueChange={(value) => setPreparationTime(value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Countdown before each loop of this section
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="dialog" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
