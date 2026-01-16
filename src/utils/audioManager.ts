/**
 * AudioManager - Web Audio API wrapper for generating beep sounds
 *
 * Provides countdown beeps (3-2-1 seconds) and transition beeps (block changes).
 * Must be initialized on user gesture to comply with browser autoplay policies.
 */

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private initialized = false;

  /**
   * Initialize AudioContext on user gesture (Play button)
   * Must be called from user interaction due to browser autoplay policy
   * @returns true if initialization succeeded, false otherwise
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Create AudioContext (supports webkit prefix for Safari)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Resume if suspended (iOS requirement)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.warn('AudioContext initialization failed:', error);
      return false;
    }
  }

  /**
   * Play countdown beep (short beep for 3, 2, 1)
   * Frequency: 880Hz, Duration: 100ms, Square wave for classic beep sound
   */
  public playCountdownBeep(): void {
    if (!this.audioContext || !this.initialized) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 880; // Hz (A5 note - classic beep pitch)
    oscillator.type = 'square'; // Square wave for beep-like sound

    // Short envelope for crisp beep
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * Play transition beep (longer beep for block completion at 0)
   * Same frequency as countdown but 3x longer (300ms)
   */
  public playTransitionBeep(): void {
    if (!this.audioContext || !this.initialized) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 880; // Hz (same as countdown - A5 note)
    oscillator.type = 'square'; // Square wave for beep-like sound

    // 3x longer than countdown beep (300ms vs 100ms)
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  /**
   * Cleanup AudioContext
   * Call this when component unmounts
   */
  public cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.initialized = false;
  }
}
