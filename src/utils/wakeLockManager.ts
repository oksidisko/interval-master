/**
 * WakeLockManager - Screen Wake Lock API wrapper to prevent device sleep
 *
 * Keeps the screen awake while the workout timer is running.
 * Uses the Screen Wake Lock API with automatic re-acquisition on visibility change.
 * Gracefully degrades on unsupported browsers.
 */

export class WakeLockManager {
  private wakeLock: WakeLockSentinel | null = null;
  private isRequested = false;

  /**
   * Check if the Screen Wake Lock API is supported
   */
  private isSupported(): boolean {
    return 'wakeLock' in navigator;
  }

  /**
   * Request a screen wake lock to prevent device sleep
   * @returns true if wake lock was acquired, false otherwise
   */
  async request(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    // Already have an active wake lock
    if (this.wakeLock !== null) {
      return true;
    }

    this.isRequested = true;

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');

      // Handle wake lock release (happens when tab is hidden)
      this.wakeLock.addEventListener('release', () => {
        this.wakeLock = null;
      });

      // Set up visibility change handler to re-acquire when tab becomes visible
      this.setupVisibilityHandler();

      return true;
    } catch (error) {
      // Wake lock request can fail if:
      // - Page is not visible
      // - Low battery mode is enabled
      // - Permission denied
      console.warn('Wake lock request failed:', error);
      return false;
    }
  }

  /**
   * Release the wake lock, allowing device to sleep normally
   */
  async release(): Promise<void> {
    this.isRequested = false;

    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch (error) {
        // Ignore errors during release (lock may already be released)
      }
      this.wakeLock = null;
    }
  }

  /**
   * Set up visibility change handler to re-acquire wake lock when page becomes visible
   * The Wake Lock API automatically releases the lock when the page is hidden,
   * so we need to re-acquire it when the page becomes visible again.
   */
  private setupVisibilityHandler(): void {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && this.isRequested && !this.wakeLock) {
        try {
          this.wakeLock = await navigator.wakeLock.request('screen');
          this.wakeLock.addEventListener('release', () => {
            this.wakeLock = null;
          });
        } catch (error) {
          // Re-acquisition may fail, that's okay
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Store handler reference for cleanup
    this.visibilityHandler = handleVisibilityChange;
  }

  private visibilityHandler: (() => void) | null = null;

  /**
   * Full cleanup - release wake lock and remove event listeners
   * Call this when component unmounts
   */
  cleanup(): void {
    this.isRequested = false;

    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}
