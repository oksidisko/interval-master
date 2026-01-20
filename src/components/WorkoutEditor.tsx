import { ArrowLeft, GripVertical, Trash2, Plus, Settings2, Check, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getWorkout, saveWorkout } from "@/db/workouts";
import { getSettings, updateDefaultRestTitle } from "@/db/settings";
import type { Workout, Block, SectionBlock, WorkBlock, RestBlock } from "@/types/workout";
import { isSectionBlock } from "@/utils/blockTypeGuards";
import { SortableSectionItem } from "@/components/SortableSectionItem";
import { SectionSettingsDialog } from "@/components/SectionSettingsDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SortableBlockItemProps {
  block: Block;
  index: number;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
}

const SortableBlockItem = ({ block, index, onEdit, onDelete }: SortableBlockItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => !isDragging && onEdit(block)}
      className={`rounded-xl p-4 flex items-center gap-3 border-l-4 cursor-pointer transition-opacity ${
        block.type === "work"
          ? "bg-work/10 border-work"
          : "bg-rest/10 border-rest"
      } ${isDragging ? 'z-50' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center touch-manipulation cursor-grab active:cursor-grabbing"
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
        onClick={(e) => {
          e.stopPropagation();
          onDelete(block.id);
        }}
        className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Delete block"
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </button>
    </div>
  );
};

const WorkoutEditor = ({ workoutId, onNavigate }: WorkoutEditorProps) => {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [editBlockDialogOpen, setEditBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [durationInput, setDurationInput] = useState<string>("");
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [sectionSettingsDialogOpen, setSectionSettingsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionBlock | null>(null);
  const [editingSectionParentId, setEditingSectionParentId] = useState<string | null>(null);
  const [defaultRestTitle, setDefaultRestTitle] = useState<string>('Rest');
  const isCancelingRef = useRef(false);
  const isSavingRef = useRef(false);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,        // 250ms press-and-hold before drag starts
        tolerance: 5,      // Allow 5px movement during the delay
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,       // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadWorkout();
    loadSettings();
  }, [workoutId]);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setDefaultRestTitle(settings.defaultRestTitle);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadWorkout = async () => {
    try {
      if (workoutId) {
        const data = await getWorkout(workoutId);
        if (data) {
          setWorkout(data);
        }
      } else {
        const newWorkout: Workout = {
          id: crypto.randomUUID(),
          name: 'New Workout',
          blocks: [],
          systemRestSec: 10,
          circles: 3,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        setWorkout(newWorkout);
      }
    } catch (error) {
      console.error('Failed to load workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkout = async (updatedWorkout: Workout) => {
    try {
      await saveWorkout(updatedWorkout);
      setWorkout(updatedWorkout);
    } catch (error) {
      console.error('Failed to save workout:', error);
    }
  };

  const handleNameChange = (name: string) => {
    if (!workout) return;
    const updated = { ...workout, name, updatedAt: Date.now() };
    setWorkout(updated);
    handleSaveWorkout(updated);
  };

  const handleAddBlock = (type: "work" | "rest") => {
    if (!workout) return;
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      title: type === 'work' ? 'Work' : defaultRestTitle,
      duration: 30
    };
    const updated = { ...workout, blocks: [...workout.blocks, newBlock], updatedAt: Date.now() };
    setWorkout(updated);
    handleSaveWorkout(updated);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!workout) return;
    const updated = {
      ...workout,
      blocks: workout.blocks.filter(b => b.id !== blockId),
      updatedAt: Date.now()
    };
    setWorkout(updated);
    handleSaveWorkout(updated);
  };

  const handleOpenEditDialog = (block: Block) => {
    // Only work/rest blocks can be edited (not sections)
    if (isSectionBlock(block)) return;

    setEditingBlock({ ...block }); // Clone to allow cancellation
    setDurationInput(block.duration.toString());
    setEditingSectionParentId(null); // Top-level block
    setEditBlockDialogOpen(true);
  };

  const handleSaveEditedBlock = async () => {
    if (!workout || !editingBlock) return;

    // Validation
    if (!editingBlock.title.trim()) {
      alert('Title cannot be empty');
      return;
    }

    // Parse duration input (seconds only)
    const parsedDuration = parseInt(durationInput, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      alert('Duration must be a valid positive number in seconds');
      return;
    }

    // Save rest title as default if it's a rest block
    if (editingBlock.type === 'rest' && editingBlock.title !== defaultRestTitle) {
      try {
        await updateDefaultRestTitle(editingBlock.title);
        setDefaultRestTitle(editingBlock.title);
      } catch (error) {
        console.error('Failed to save default rest title:', error);
      }
    }

    const updatedBlock = {
      ...editingBlock,
      duration: parsedDuration
    };

    let updatedBlocks: Block[];

    if (editingSectionParentId) {
      // Editing a block inside a section
      updatedBlocks = workout.blocks.map(b => {
        if (isSectionBlock(b) && b.id === editingSectionParentId) {
          const updatedSection = {
            ...b,
            blocks: b.blocks.map(child =>
              child.id === updatedBlock.id ? (updatedBlock as WorkBlock | RestBlock) : child
            )
          };
          return { ...updatedSection, title: generateSectionTitle(updatedSection) };
        }
        return b;
      });
    } else {
      // Editing a top-level block
      updatedBlocks = workout.blocks.map(b =>
        b.id === updatedBlock.id ? updatedBlock : b
      );
    }

    const updated = {
      ...workout,
      blocks: updatedBlocks,
      updatedAt: Date.now()
    };

    setWorkout(updated);
    handleSaveWorkout(updated);
    isSavingRef.current = true;
    setEditBlockDialogOpen(false);
    setEditingBlock(null);
    setEditingSectionParentId(null);
  };

  const handleCancelEditDialog = () => {
    isCancelingRef.current = true;
    setEditBlockDialogOpen(false);
    setEditingBlock(null);
    setEditingSectionParentId(null);
  };

  const handleEditDialogOpenChange = async (open: boolean) => {
    // If opening the dialog, just set state
    if (open) {
      setEditBlockDialogOpen(true);
      return;
    }

    // If explicitly saving via button, don't auto-save (already saved)
    if (isSavingRef.current) {
      isSavingRef.current = false;
      return;
    }

    // If explicitly canceling, don't auto-save
    if (isCancelingRef.current) {
      isCancelingRef.current = false;
      return;
    }

    // If closing, auto-save changes if valid
    if (!workout || !editingBlock) {
      setEditBlockDialogOpen(false);
      setEditingBlock(null);
      setEditingSectionParentId(null);
      return;
    }

    // Validate before auto-saving
    if (!editingBlock.title.trim()) {
      // Invalid: keep dialog open
      return;
    }

    const parsedDuration = parseInt(durationInput, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      // Invalid: keep dialog open
      return;
    }

    // Valid: auto-save changes
    // Save rest title as default if it's a rest block
    if (editingBlock.type === 'rest' && editingBlock.title !== defaultRestTitle) {
      try {
        await updateDefaultRestTitle(editingBlock.title);
        setDefaultRestTitle(editingBlock.title);
      } catch (error) {
        console.error('Failed to save default rest title:', error);
      }
    }

    const updatedBlock = {
      ...editingBlock,
      duration: parsedDuration
    };

    let updatedBlocks: Block[];

    if (editingSectionParentId) {
      // Editing a block inside a section
      updatedBlocks = workout.blocks.map(b => {
        if (isSectionBlock(b) && b.id === editingSectionParentId) {
          const updatedSection = {
            ...b,
            blocks: b.blocks.map(child =>
              child.id === updatedBlock.id ? (updatedBlock as WorkBlock | RestBlock) : child
            )
          };
          return { ...updatedSection, title: generateSectionTitle(updatedSection) };
        }
        return b;
      });
    } else {
      // Editing a top-level block
      updatedBlocks = workout.blocks.map(b =>
        b.id === updatedBlock.id ? updatedBlock : b
      );
    }

    const updated = {
      ...workout,
      blocks: updatedBlocks,
      updatedAt: Date.now()
    };

    setWorkout(updated);
    handleSaveWorkout(updated);
    setEditBlockDialogOpen(false);
    setEditingBlock(null);
    setEditingSectionParentId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !workout) {
      return;
    }

    const oldIndex = workout.blocks.findIndex(b => b.id === active.id);
    const newIndex = workout.blocks.findIndex(b => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedBlocks = arrayMove(workout.blocks, oldIndex, newIndex);

    const updated = {
      ...workout,
      blocks: reorderedBlocks,
      updatedAt: Date.now()
    };

    setWorkout(updated);
    handleSaveWorkout(updated);
  };

  // Helper to generate section title from work blocks
  const generateSectionTitle = (section: SectionBlock): string => {
    const workBlocks = section.blocks.filter(b => b.type === 'work');
    if (workBlocks.length === 0) {
      return 'Section';
    }
    return workBlocks.map(b => b.title).join(', ');
  };

  // Section handlers
  const handleAddSection = () => {
    if (!workout) return;
    const newSection: SectionBlock = {
      id: crypto.randomUUID(),
      type: 'section',
      title: 'Section',
      preparationTime: 10,
      loops: 3,
      blocks: []
    };
    const updated = { ...workout, blocks: [...workout.blocks, newSection], updatedAt: Date.now() };
    setWorkout(updated);
    handleSaveWorkout(updated);
  };

  const handleEditSection = (sectionId: string) => {
    if (!workout) return;
    const section = workout.blocks.find(b => b.id === sectionId);
    if (section && isSectionBlock(section)) {
      setEditingSection(section);
      setEditingSectionParentId(null);
      setSectionSettingsDialogOpen(true);
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!workout) return;
    const section = workout.blocks.find(b => b.id === sectionId);
    if (section && isSectionBlock(section) && section.blocks.length > 0) {
      if (!confirm(`Delete section "${section.title}" and its ${section.blocks.length} intervals?`)) {
        return;
      }
    }
    const updated = {
      ...workout,
      blocks: workout.blocks.filter(b => b.id !== sectionId),
      updatedAt: Date.now()
    };
    setWorkout(updated);
    handleSaveWorkout(updated);
  };

  const handleSaveSectionSettings = (updatedSection: SectionBlock) => {
    if (!workout) return;
    const updatedBlocks = workout.blocks.map(b =>
      b.id === updatedSection.id ? updatedSection : b
    );
    const updated = {
      ...workout,
      blocks: updatedBlocks,
      updatedAt: Date.now()
    };
    setWorkout(updated);
    handleSaveWorkout(updated);
  };

  const handleAddBlockToSection = (sectionId: string, blockType: 'work' | 'rest') => {
    if (!workout) return;
    const newBlock: WorkBlock | RestBlock = {
      id: crypto.randomUUID(),
      type: blockType,
      title: blockType === 'work' ? 'Work' : defaultRestTitle,
      duration: 30
    };

    const updatedBlocks = workout.blocks.map(block => {
      if (isSectionBlock(block) && block.id === sectionId) {
        const updatedSection = { ...block, blocks: [...block.blocks, newBlock] };
        return { ...updatedSection, title: generateSectionTitle(updatedSection) };
      }
      return block;
    });

    const updated = { ...workout, blocks: updatedBlocks, updatedAt: Date.now() };
    setWorkout(updated);
    handleSaveWorkout(updated);
  };

  const handleEditBlockInSection = (sectionId: string, blockId: string) => {
    if (!workout) return;
    const section = workout.blocks.find(b => b.id === sectionId);
    if (section && isSectionBlock(section)) {
      const block = section.blocks.find(b => b.id === blockId);
      if (block) {
        setEditingBlock({ ...block });
        setDurationInput(block.duration.toString());
        setEditingSectionParentId(sectionId);
        setEditBlockDialogOpen(true);
      }
    }
  };

  const handleDeleteBlockFromSection = (sectionId: string, blockId: string) => {
    if (!workout) return;
    const updatedBlocks = workout.blocks.map(block => {
      if (isSectionBlock(block) && block.id === sectionId) {
        const updatedSection = { ...block, blocks: block.blocks.filter(b => b.id !== blockId) };
        return { ...updatedSection, title: generateSectionTitle(updatedSection) };
      }
      return block;
    });

    const updated = { ...workout, blocks: updatedBlocks, updatedAt: Date.now() };
    setWorkout(updated);
    handleSaveWorkout(updated);
  };

  const handleReorderInSection = (sectionId: string, activeId: string, overId: string) => {
    if (!workout) return;
    const updatedBlocks = workout.blocks.map(block => {
      if (isSectionBlock(block) && block.id === sectionId) {
        const oldIndex = block.blocks.findIndex(b => b.id === activeId);
        const newIndex = block.blocks.findIndex(b => b.id === overId);
        const updatedSection = { ...block, blocks: arrayMove(block.blocks, oldIndex, newIndex) };
        return { ...updatedSection, title: generateSectionTitle(updatedSection) };
      }
      return block;
    });

    const updated = { ...workout, blocks: updatedBlocks, updatedAt: Date.now() };
    setWorkout(updated);
    handleSaveWorkout(updated);
  };

  const handleSaveSettings = () => {
    if (!workout) return;

    // Validation
    if (workout.circles < 1) {
      alert('Rounds must be at least 1');
      return;
    }
    if (workout.systemRestSec < 0) {
      alert('Prep time cannot be negative');
      return;
    }

    setSettingsDialogOpen(false);
  };

  if (loading || !workout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading workout...</p>
      </div>
    );
  }

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
            value={workout.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Workout Name"
            className="w-full bg-transparent text-2xl font-bold placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <button
          onClick={() => setSettingsDialogOpen(true)}
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
            <p className="text-3xl font-bold tabular-nums">{workout.circles}</p>
          </div>
          <div className="flex-1 bg-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prep Time</p>
            <p className="text-3xl font-bold tabular-nums">{workout.systemRestSec}s</p>
          </div>
        </div>
      </div>

      {/* Block List */}
      <main className="flex-1 px-4 py-4 pb-32 overflow-y-auto">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Intervals</p>

        {workout.blocks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No intervals yet. Add Work or Rest blocks below.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={workout.blocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {workout.blocks.map((block, index) =>
                  isSectionBlock(block) ? (
                    <SortableSectionItem
                      key={block.id}
                      section={block}
                      onEditSection={handleEditSection}
                      onDeleteSection={handleDeleteSection}
                      onAddToSection={handleAddBlockToSection}
                      onEditBlockInSection={handleEditBlockInSection}
                      onDeleteBlockFromSection={handleDeleteBlockFromSection}
                      onReorderInSection={handleReorderInSection}
                    />
                  ) : (
                    <SortableBlockItem
                      key={block.id}
                      block={block}
                      index={index}
                      onEdit={handleOpenEditDialog}
                      onDelete={handleDeleteBlock}
                    />
                  )
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* Edit Block Dialog */}
      <Dialog open={editBlockDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="sm:max-w-[425px]" hideCloseButton>
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle>Edit Interval</DialogTitle>
                <DialogDescription>
                  Modify the title, duration, and type of this interval.
                </DialogDescription>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={handleCancelEditDialog}
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSaveEditedBlock}
                  className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Save"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
          </DialogHeader>

          {editingBlock && !isSectionBlock(editingBlock) && (
            <div className="grid gap-4 py-4">
              {/* Type Toggle */}
              <div className="grid gap-2">
                <Label htmlFor="block-type">Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={editingBlock.type === 'work' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setEditingBlock({ ...editingBlock, type: 'work' })}
                  >
                    Work
                  </Button>
                  <Button
                    type="button"
                    variant={editingBlock.type === 'rest' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setEditingBlock({ ...editingBlock, type: 'rest' })}
                  >
                    Rest
                  </Button>
                </div>
              </div>

              {/* Title Input */}
              <div className="grid gap-2">
                <Label htmlFor="block-title">Title</Label>
                <Input
                  id="block-title"
                  value={editingBlock.title}
                  onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                  placeholder="e.g., Push-ups, Break"
                />
              </div>

              {/* Duration Input */}
              <div className="grid gap-2">
                <Label htmlFor="block-duration">Duration (seconds)</Label>
                <Input
                  id="block-duration"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Enter duration in seconds (e.g., 30, 60, 90)
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Workout Settings</DialogTitle>
            <DialogDescription>
              Configure rounds and preparation time for this workout.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Rounds Slider */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="circles">Rounds</Label>
                <span className="text-2xl font-bold tabular-nums">{workout.circles}</span>
              </div>
              <Slider
                id="circles"
                min={1}
                max={20}
                step={1}
                value={[workout.circles]}
                onValueChange={(value) => {
                  const updated = { ...workout, circles: value[0], updatedAt: Date.now() };
                  setWorkout(updated);
                  handleSaveWorkout(updated);
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Number of times to repeat all intervals
              </p>
            </div>

            {/* Prep Time Slider */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="systemRestSec">Prep Time</Label>
                <span className="text-2xl font-bold tabular-nums">{workout.systemRestSec}s</span>
              </div>
              <Slider
                id="systemRestSec"
                min={0}
                max={30}
                step={5}
                value={[workout.systemRestSec]}
                onValueChange={(value) => {
                  const updated = { ...workout, systemRestSec: value[0], updatedAt: Date.now() };
                  setWorkout(updated);
                  handleSaveWorkout(updated);
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Countdown before workout starts
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="dialog" onClick={handleSaveSettings}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Settings Dialog */}
      <SectionSettingsDialog
        section={editingSection}
        open={sectionSettingsDialogOpen}
        onOpenChange={setSectionSettingsDialogOpen}
        onSave={handleSaveSectionSettings}
      />

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-background/95 backdrop-blur-sm border-t border-border/50">
        <div className="flex gap-2">
          <button
            onClick={() => handleAddBlock("work")}
            className="flex-1 h-14 bg-work/20 text-work border border-work/30 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Plus className="w-5 h-5" />
            Work
          </button>
          <button
            onClick={() => handleAddBlock("rest")}
            className="flex-1 h-14 bg-rest/20 text-rest border border-rest/30 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Plus className="w-5 h-5" />
            Rest
          </button>
          <button
            onClick={handleAddSection}
            className="flex-1 h-14 bg-section/20 text-section border border-section/30 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Plus className="w-5 h-5" />
            Section
          </button>
        </div>
        <button
          onClick={() => onNavigate("home")}
          className="w-full h-14 mt-3 bg-primary text-primary-foreground rounded-xl text-lg font-bold active:scale-[0.98] transition-transform"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default WorkoutEditor;
