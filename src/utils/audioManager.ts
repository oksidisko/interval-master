/**
 * AudioManager - Web Audio API wrapper for generating beep sounds
 *
 * Provides countdown beeps (3-2-1 seconds) and transition beeps (block changes).
 * Must be initialized on user gesture to comply with browser autoplay policies.
 */

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private initialized = false;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;

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

      // Load speech synthesis voices
      this.loadVoices();

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
   * Load available speech synthesis voices
   * Handles async voice loading in Chrome/Edge
   */
  private loadVoices(): void {
    const loadVoicesList = () => {
      if ('speechSynthesis' in window) {
        this.voices = window.speechSynthesis.getVoices();
        this.voicesLoaded = this.voices.length > 0;
      }
    };

    loadVoicesList();

    // Chrome/Edge load voices asynchronously
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoicesList;
    }
  }

  /**
   * Detect language from text (Russian vs English)
   * @param text - Text to analyze
   * @returns Language code ('ru-RU' or 'en-US')
   */
  private detectLanguage(text: string): 'ru-RU' | 'en-US' {
    return /[а-яА-ЯёЁ]/.test(text) ? 'ru-RU' : 'en-US';
  }

  /**
   * Select best available voice for language
   * Prioritizes Premium/Enhanced voices, then Natural, then any match
   * @param lang - Language code (e.g., 'ru-RU', 'en-US')
   * @returns Selected voice or null for browser default
   */
  private selectVoice(lang: string): SpeechSynthesisVoice | null {
    const langPrefix = lang.slice(0, 2); // 'ru' or 'en'
    const matchingVoices = this.voices.filter(v => v.lang.startsWith(langPrefix));

    if (matchingVoices.length === 0) return null;

    // Try Premium/Enhanced voices first
    const premium = matchingVoices.find(v =>
      v.name.includes('Premium') || v.name.includes('Enhanced')
    );
    if (premium) return premium;

    // Try Natural voices
    const natural = matchingVoices.find(v => v.name.includes('Natural'));
    if (natural) return natural;

    // Return first matching voice
    return matchingVoices[0];
  }

  /**
   * Announce next block title with text-to-speech
   * @param title - Block title to announce (e.g., "Push-ups", "Отжимания")
   */
  public announceNextBlock(title: string): void {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      return;
    }

    try {
      // Detect language and build announcement text
      const lang = this.detectLanguage(title);
      const prefix = lang === 'ru-RU' ? 'Приготовьтесь к' : 'Get ready for';
      const text = `${prefix} ${title}`;

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      // Select best voice if available
      const voice = this.selectVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      // Handle errors (e.g., Brave browser blocking)
      utterance.onerror = (e) => {
        if (e.error === 'synthesis-failed') {
          console.warn('Speech synthesis blocked by browser. Enable in browser settings (Brave: disable shields).');
        }
      };

      // Cancel any ongoing speech and speak
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Speech announcement failed:', error);
    }
  }

  /**
   * Cancel any ongoing speech
   * Call when pausing or stopping workout
   */
  public cancelSpeech(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Cleanup AudioContext and speech synthesis
   * Call this when component unmounts
   */
  public cleanup(): void {
    this.cancelSpeech();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.initialized = false;
    this.voices = [];
    this.voicesLoaded = false;
  }
}
