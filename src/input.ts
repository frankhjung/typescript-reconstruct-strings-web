/**
 * Pure helpers for interpreting raw user input from the controls.
 */

/**
 * Split free text into fragments. Fragments may be separated by newlines
 * and/or commas; surrounding whitespace and empty entries are discarded.
 */
export function parseFragments(text: string): readonly string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Bounds of the playback delay, in milliseconds. */
export const MIN_STEP_DELAY_MS = 200
export const MAX_STEP_DELAY_MS = 2000
export const STEP_DELAY_INCREMENT_MS = 100
export const DEFAULT_STEP_DELAY_MS = 1000

/**
 * Convert a speed slider position to a playback delay. The slider is
 * inverted so that moving right (a higher value) means faster playback.
 */
export function sliderToDelay(sliderValue: number): number {
  return MAX_STEP_DELAY_MS + MIN_STEP_DELAY_MS - sliderValue
}

/**
 * Convert a playback delay to a speed slider position. This is the inverse
 * of {@link sliderToDelay}.
 */
export function delayToSlider(delayMs: number): number {
  return MAX_STEP_DELAY_MS + MIN_STEP_DELAY_MS - delayMs
}
