export function triggerHaptic(pattern) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // silently fail on unsupported devices
    }
  }
}

export const haptics = {
  maybe: () => triggerHaptic(15),
  nope: () => triggerHaptic([10, 50, 10]),
  undo: () => triggerHaptic(20),
  pickForUs: () => triggerHaptic([30, 50, 30, 50, 30]),
  winnerLands: () => triggerHaptic([100, 30, 100]),
  letsGo: () => triggerHaptic(200),
};