/**
 * Haptic Feedback - Type-safe wrapper around the Vibration API
 *
 * Provides vibration feedback for block transitions and countdown events.
 * Automatically detects device support and gracefully handles unsupported devices.
 */

/**
 * Check if haptic feedback is supported on this device
 * @returns true if navigator.vibrate() is available
 */
export const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Trigger haptic feedback for block transition
 * Single 200ms vibration (medium-impact feedback)
 */
export const vibrateTransition = (): void => {
  if (!isHapticSupported()) {
    return;
  }

  try {
    navigator.vibrate(200); // 200ms vibration
  } catch (error) {
    console.warn('Vibration failed:', error);
  }
};

/**
 * Trigger haptic feedback for countdown (lighter feedback)
 * Single 50ms vibration
 */
export const vibrateCountdown = (): void => {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(50); // 50ms for countdown
  } catch (error) {
    console.warn('Vibration failed:', error);
  }
};

/**
 * Cancel any ongoing vibration
 */
export const cancelVibration = (): void => {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(0);
  } catch (error) {
    console.warn('Cancel vibration failed:', error);
  }
};
