// src/components/ui/exercise-combobox.tsx
import * as React from "react";
import { Check, ChevronsUpDown, Clock, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Exercise } from "@/types/exercise";

interface ExerciseComboboxProps {
  exercises: Exercise[];
  value: string; // current title text
  exerciseId?: string; // current linked exercise ID
  onSelect: (title: string, duration: number, exerciseId?: string) => void;
  onChange: (title: string) => void;
  placeholder?: string;
}

export function ExerciseCombobox({
  exercises,
  value,
  exerciseId,
  onSelect,
  onChange,
  placeholder = "Search exercises...",
}: ExerciseComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredExercises = exercises.filter((exercise) =>
    exercise.title.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise.title, exercise.defaultDuration, exercise.id);
    setInputValue(exercise.title);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {inputValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue ? (
                <span className="text-muted-foreground">
                  Using "{inputValue}" as custom title
                </span>
              ) : (
                "Type to search or enter custom title"
              )}
            </CommandEmpty>
            {filteredExercises.length > 0 && (
              <CommandGroup heading="From Library">
                {filteredExercises.map((exercise) => (
                  <CommandItem
                    key={exercise.id}
                    value={exercise.id}
                    onSelect={() => handleSelect(exercise)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          exerciseId === exercise.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{exercise.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 ml-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exercise.defaultDuration}s
                      </span>
                      {exercise.isTwoSided && (
                        <ArrowLeftRight className="w-3 h-3" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
