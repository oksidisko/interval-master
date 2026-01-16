# PRD: Interval Training PWA (Resilient Mobile-First)

## 1. Product Goal

Build a 100% offline-first Interval Training application as a PWA. The app must function like a native utility: zero server dependency, persistent state across OS cleanups, and a high-precision timer that handles background/foreground transitions gracefully on both iOS and Android.

---

## 2. Target Platform & UX

* **Platform:** PWA (Mobile Chrome & Safari).
* **Design:** **Mobile-Only Priority.** * Thumb-zone navigation (controls at bottom).
* High-contrast, large-scale typography for visibility during movement.
* No hover dependencies; strictly touch-optimized.



---

## 3. Storage Architecture

To ensure maximum reliability, the app uses a dual-layered storage strategy.

### 3.1 App Shell (Cache Storage)

* **Assets:** `index.html`, `main.js`, `styles.css`, fonts, and pre-loaded audio files.
* **Strategy:** `Cache-only` or `Cache-first` via Service Worker.
* **Version Control:** Hash-based filenames (e.g., `main.abc123.js`) to manage updates.

### 3.2 User Data (IndexedDB)

* **Content:** Workout templates, user settings, and training history.
* **Rationale:** IndexedDB is more resilient to OS-initiated cache clearing than the Cache API or LocalStorage.
* **Implementation:** Use the `idb` library for a promised-based interface. Stores: `programs` and `settings`.

---

## 4. Service Worker & Offline Bootstrap

The app must be functional from the very first interaction.

* **Registration:** Immediate Service Worker registration on load.
* **Controller Change:** Force a page reload when a new Service Worker takes control to ensure the app is immediately served from the cache.
```javascript
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});

```


* **Cold-Start Detection:** Implement a `bootKey` in LocalStorage. If missing, the app detects a "clean slate" (either first run or OS wipe) and re-populates default workouts from the App Shell.

---

## 5. Workout Data Model (Editor)

```typescript
interface Block {
  id: string;
  type: 'work' | 'rest';
  title?: string;
  durationSec: number;
}

interface Workout {
  id: string;
  name: string;
  blocks: Block[];
  systemRestSec: number; // Preparation time
  circles: number;       // Global repetitions
}

```

---

## 6. High-Precision Timer Engine

The timer must remain accurate regardless of JS event loop delays or mobile browser tab throttling.

* **Logic:** Timestamp-based delta calculation using `performance.now()`.
* **Loop:** Use `requestAnimationFrame` for the UI tick to ensure visual smoothness and synchronization with the screen refresh rate.
* **Resiliency:** On `visibilitychange` (background -> foreground), the engine calculates elapsed time via timestamps to "jump" the timer to the correct state, preventing drift.

---

## 7. Sound & Haptics

* **Audio:** Pre-loaded via the App Shell.
* **Trigger:** Use the Web Audio API for low-latency playback. Note: Must be initialized via a user gesture (Start Workout button).
* **Beeps:** 3-2-1 countdown (short) and transition start (long).
* **Haptics:** Trigger `navigator.vibrate([200])` on block transitions (Android support).

---

## 8. PWA Manifest Configuration

The app must be indistinguishable from a native app when added to the home screen.

```json
{
  "name": "Interval Timer",
  "short_name": "Timer",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#000000"
}

```

---

## 9. UI Screens (Mobile Optimized)

### 9.1 Workout Editor

* Flat list with **Touch-friendly Drag & Drop** (using `dnd-kit`).
* Swipe-to-delete actions.
* "Quick Clone" button for repetitive intervals.

### 9.2 Training Player

* **Immense Timer Display:** Centered, filling 50% of the screen.
* **Dynamic Backgrounds:** Color-coded by state (e.g., Work = Green, Rest = Red/Yellow).
* **Large Bottom Controls:** * Center: Huge Play/Pause.
* Left/Right: Skip/Previous.


* **Next Up:** Small preview text at the top showing the title of the upcoming block.

---

## 10. Success Criteria

* **First-Load Ready:** App is fully functional offline after the first visit.
* **Persistence:** Workouts survive browser tab closures and standard OS cache cleanups.
* **Accuracy:** Timer drift is <100ms over 60 minutes of training.
* **UX:** 100% of controls are reachable via thumb in a single-handed grip.
