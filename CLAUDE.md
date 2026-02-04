# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **offline-first PWA interval training timer** built with React, TypeScript, Vite, and shadcn-ui. The app is designed to be 100% mobile-first and resilient across background/foreground transitions on iOS and Android.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build
npm preview

# Run linter
npm run lint

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Architecture

### Storage Strategy (Dual-Layer)

The app uses a **dual-layered storage system** for maximum reliability:

1. **App Shell (Service Worker Cache)**: Static assets (HTML, JS, CSS, fonts, icons) are cached via Service Worker using `vite-plugin-pwa` with Workbox
2. **User Data (IndexedDB)**: Workout templates and settings stored in IndexedDB (via `idb` library) for persistence across OS cache cleanups

Database structure:
- `workouts` store: Stores `Workout` objects with `by-updated` index
- `settings` store: General app settings

See `src/db/index.ts` for database initialization.

### Bootstrap Flow

On first load (or after OS cache wipe), the app:
1. Checks for `workout-timer-initialized` key in `localStorage`
2. If missing, seeds default workouts into IndexedDB
3. Sets the boot key to prevent re-seeding

This logic is in `src/utils/bootstrap.ts` and runs before React mounts.

### Core Data Model

```typescript
interface Block {
  id: string;
  type: 'work' | 'rest';
  title: string;
  duration: number; // seconds
}

interface Workout {
  id: string;
  name: string;
  blocks: Block[];
  systemRestSec: number;  // Preparation time between rounds
  circles: number;        // Global repetitions (rounds)
  createdAt: number;
  updatedAt: number;
}
```

### High-Precision Timer Engine

The timer (in `TrainingPlayer.tsx`) uses:
- **Timestamp-based calculation** via `performance.now()` to avoid drift
- **`requestAnimationFrame`** for smooth UI updates (synced to screen refresh)
- **`VisibilityManager`** class to handle background/foreground transitions:
  - When page goes hidden: saves timestamp
  - When page becomes visible: calculates elapsed time and "jumps" timer to correct state

This ensures timer accuracy (<100ms drift over 60 minutes) even when app is backgrounded.

### Audio & Haptics

**Audio** (`src/utils/audioManager.ts`):
- Uses Web Audio API for low-latency beeps
- Countdown beeps (3-2-1): 880Hz, 100ms square wave
- Transition beeps: 880Hz, 300ms square wave
- **Text-to-Speech**: Announces next block title with auto-detection of language (Russian/English)
- Must be initialized on user gesture (Play button) per browser autoplay policies

**Haptics** (`src/utils/hapticFeedback.ts`):
- Uses `navigator.vibrate([200])` on block transitions (Android support)

### Workout Compiler

The workout compiler (`src/utils/compileWorkout.ts`) transforms a `Workout` definition into an executable sequence of `ExecutionBlock`s. Key features:

- **Two-sided exercises**: Exercises marked `isTwoSided` expand to: `work (side 1) → rest (10s switch) → work (side 2)`
- **Section loops**: Sections with `loops > 1` repeat their child blocks
- **Preparation blocks**: Adds "Get Ready" and "Rest Between Rounds" blocks based on `systemRestSec`
- **Language detection**: Auto-detects Russian (Cyrillic) for localized "Switch sides" text

**Duration calculation** (`src/utils/calculateWorkoutDuration.ts`): Uses the compiler to get accurate total duration, accounting for two-sided expansion.

### Component Structure

**Main Components**:
- `HomeScreen.tsx`: Workout list with create/edit/delete/start actions (uses compiled duration)
- `WorkoutEditor.tsx`: Edit workout details with drag-and-drop block reordering (via `@dnd-kit`)
  - Auto-scrolls to bottom when adding new blocks
  - Auto-opens edit dialog when adding Work blocks (saves extra tap)
  - Default durations: Work 30s, Rest 10s
- `TrainingPlayer.tsx`: Timer UI with play/pause/skip controls, dynamic color-coded backgrounds

**UI Components**: `src/components/ui/` contains shadcn-ui components (Radix UI + Tailwind)

**Routing**: Simple React Router setup in `App.tsx` with home (`/`) and catch-all 404 routes

### PWA Configuration

PWA manifest and service worker configured in `vite.config.ts`:
- Standalone display mode, portrait orientation
- Black theme (`#000000` background/theme)
- Cache-first strategy for fonts
- Auto-updates via `registerType: 'autoUpdate'`

Icons should be in `public/icons/` (192x192 and 512x512).

### Mobile-First Design

- **Touch-optimized**: No hover dependencies, large touch targets
- **Thumb-zone navigation**: Controls at bottom of screen
- **High-contrast typography**: Large text for visibility during movement
- **Drag-and-drop**: Configured with `TouchSensor` and `MouseSensor` with activation constraints to prevent accidental drags

### Testing

Tests use Vitest + React Testing Library with jsdom environment. Setup is in `src/test/setup.ts` which includes `matchMedia` mock for compatibility.

## Path Aliasing

`@/` maps to `src/` directory (configured in both `vite.config.ts` and `tsconfig.json`).

## Key Technical Patterns

1. **Offline-first**: All functionality works without network after first load
2. **Timestamp-based timing**: Never rely on interval callbacks for time-critical logic
3. **Visibility handling**: Always handle `visibilitychange` events for background timer accuracy
4. **User gesture requirement**: Audio features require initialization from user interaction
5. **Mobile gestures**: Touch sensors configured with activation delays to prevent conflicts with native scrolling
