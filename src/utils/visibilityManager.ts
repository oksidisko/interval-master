/**
 * VisibilityManager - Handles page visibility changes to maintain timer accuracy
 *
 * Tracks when the page becomes hidden (user switches apps/tabs) and calculates
 * elapsed time when the page becomes visible again. This ensures the timer
 * continues accurately even when the app is in the background.
 */

export class VisibilityManager {
  private hiddenAt: number | null = null;
  private onVisibilityChange: ((elapsedMs: number) => void) | null = null;

  /**
   * Creates a new VisibilityManager
   * @param onVisibilityChange - Callback invoked when page becomes visible with elapsed time in ms
   */
  constructor(onVisibilityChange: (elapsedMs: number) => void) {
    this.onVisibilityChange = onVisibilityChange;
    this.setupListeners();
  }

  /**
   * Sets up the visibility change event listener
   */
  private setupListeners(): void {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Handles visibility changes
   * - When hidden: saves current timestamp
   * - When visible: calculates elapsed time and invokes callback
   */
  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      // Page became hidden, save timestamp
      this.hiddenAt = performance.now();
    } else {
      // Page became visible, calculate elapsed time
      if (this.hiddenAt !== null && this.onVisibilityChange) {
        const elapsed = performance.now() - this.hiddenAt;
        this.onVisibilityChange(elapsed);
        this.hiddenAt = null;
      }
    }
  };

  /**
   * Cleanup: removes event listeners and resets state
   * Call this when the timer stops or component unmounts
   */
  public cleanup(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.hiddenAt = null;
    this.onVisibilityChange = null;
  }
}
