import { GripVertical, Settings, Trash2, Plus } from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable as useNestedSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SectionBlock, WorkBlock, RestBlock } from "@/types/workout";

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${secs}s`;
};

interface SortableSectionItemProps {
  section: SectionBlock;
  onEditSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddToSection: (sectionId: string, blockType: 'work' | 'rest') => void;
  onEditBlockInSection: (sectionId: string, blockId: string) => void;
  onDeleteBlockFromSection: (sectionId: string, blockId: string) => void;
  onReorderInSection: (sectionId: string, activeId: string, overId: string) => void;
}

interface NestedBlockItemProps {
  block: WorkBlock | RestBlock;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

const NestedBlockItem = ({ block, index, onEdit, onDelete }: NestedBlockItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useNestedSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => !isDragging && onEdit()}
      className={`rounded-lg p-3 flex items-center gap-2 border-l-4 cursor-pointer transition-opacity ${
        block.type === "work"
          ? "bg-work/10 border-work"
          : "bg-rest/10 border-rest"
      } ${isDragging ? 'z-50' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center touch-manipulation cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
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
        <p className="text-sm font-semibold mt-0.5 truncate">{block.title}</p>
      </div>

      <div className="text-right">
        <p className="text-lg font-bold tabular-nums">
          {formatDuration(block.duration)}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Delete block"
      >
        <Trash2 className="w-3 h-3 text-destructive" />
      </button>
    </div>
  );
};

export const SortableSectionItem = ({
  section,
  onEditSection,
  onDeleteSection,
  onAddToSection,
  onEditBlockInSection,
  onDeleteBlockFromSection,
  onReorderInSection,
}: SortableSectionItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleNestedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderInSection(section.id, active.id as string, over.id as string);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="section-block"
    >
      <div className="flex items-start gap-3">
        {/* Drag handle for moving entire section */}
        <button
          {...attributes}
          {...listeners}
          className="w-10 h-10 mt-1 rounded-lg bg-secondary/50 flex items-center justify-center touch-manipulation cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder section"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Accordion for section content */}
        <div className="flex-1 min-w-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="section-content" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2">
                <div className="flex items-center gap-3 flex-1">
                  <Badge className="section-badge text-[10px] font-bold uppercase">
                    SECTION
                  </Badge>
                  <span className="text-lg font-semibold">{section.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {section.loops} {section.loops === 1 ? 'loop' : 'loops'} • {section.preparationTime}s prep
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-3">
                <div className="section-nested-blocks">
                  {section.blocks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No intervals in this section. Add Work or Rest blocks below.
                    </p>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleNestedDragEnd}
                    >
                      <SortableContext
                        items={section.blocks.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {section.blocks.map((block, idx) => (
                            <NestedBlockItem
                              key={block.id}
                              block={block}
                              index={idx}
                              onEdit={() => onEditBlockInSection(section.id, block.id)}
                              onDelete={() => onDeleteBlockFromSection(section.id, block.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}

                  {/* Buttons to add blocks to this section */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddToSection(section.id, 'work')}
                      className="flex-1 bg-work/5 border-work/20 hover:bg-work/10"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Work
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddToSection(section.id, 'rest')}
                      className="flex-1 bg-rest/5 border-rest/20 hover:bg-rest/10"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Rest
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Settings and delete buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onEditSection(section.id)}
            className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Section settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteSection(section.id)}
            className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Delete section"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
};
