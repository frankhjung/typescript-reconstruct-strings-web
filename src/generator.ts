import type { GeneratorParams } from './types.js'

export const MAX_SOURCE_LENGTH = 10000
export const MAX_FRAGMENT_COUNT = 500

/** Smallest overlap the UI accepts; shorter overlaps are not meaningful. */
export const MIN_OVERLAP_THRESHOLD = 2

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validate the minimum overlap threshold (n).
 */
function validateMinOverlap(minOverlap: number): void {
  if (!Number.isInteger(minOverlap) || minOverlap < MIN_OVERLAP_THRESHOLD) {
    throw new ValidationError(
      `Minimum overlap (n) must be an integer >= ${MIN_OVERLAP_THRESHOLD}.`
    )
  }
}

/**
 * Validate generator parameters and enforce the resource bounds that guard
 * against excessive computation.
 */
export function validateGeneratorParams(params: GeneratorParams): void {
  const { source, minOverlap, minLength, maxLength, fragmentCount } = params

  if (source.length === 0) {
    throw new ValidationError('Source string must not be empty.')
  }

  if (source.length > MAX_SOURCE_LENGTH) {
    throw new ValidationError(
      `Source string length (${source.length}) exceeds maximum limit ` +
        `(${MAX_SOURCE_LENGTH}).`
    )
  }

  validateMinOverlap(minOverlap)

  if (!Number.isInteger(minLength) || minLength < 2) {
    throw new ValidationError(
      'Minimum fragment length (a) must be an integer >= 2.'
    )
  }

  if (!Number.isInteger(maxLength) || maxLength < minLength) {
    throw new ValidationError(
      'Maximum fragment length (b) must be >= minimum length (a).'
    )
  }

  if (minLength > source.length) {
    throw new ValidationError(
      'Minimum fragment length (a) cannot exceed source string length.'
    )
  }

  if (!Number.isInteger(fragmentCount) || fragmentCount < 2) {
    throw new ValidationError('Fragment count (m) must be an integer >= 2.')
  }

  if (fragmentCount > MAX_FRAGMENT_COUNT) {
    throw new ValidationError(
      `Fragment count (m=${fragmentCount}) exceeds maximum limit ` +
        `(${MAX_FRAGMENT_COUNT}).`
    )
  }
}

/**
 * Validate a manually supplied fragment pool (and its reference source)
 * against the same bounds applied to generated pools.
 */
export function validateCustomFragments(
  fragments: readonly string[],
  minOverlap: number,
  source: string
): void {
  if (source.length > MAX_SOURCE_LENGTH) {
    throw new ValidationError(
      `Source string length (${source.length}) exceeds maximum limit ` +
        `(${MAX_SOURCE_LENGTH}).`
    )
  }

  if (fragments.length === 0) {
    throw new ValidationError('Fragment pool cannot be empty.')
  }

  if (fragments.length > MAX_FRAGMENT_COUNT) {
    throw new ValidationError(
      `Fragment count (${fragments.length}) exceeds maximum limit ` +
        `(${MAX_FRAGMENT_COUNT}).`
    )
  }

  const longest = Math.max(...fragments.map((f) => f.length))
  if (longest > MAX_SOURCE_LENGTH) {
    throw new ValidationError(
      `Fragment length (${longest}) exceeds maximum limit ` +
        `(${MAX_SOURCE_LENGTH}).`
    )
  }

  validateMinOverlap(minOverlap)
}

/**
 * Extract fragmentCount random substrings from source text.
 * Uses optional random function for deterministic testing.
 */
export function generateFragments(
  params: GeneratorParams,
  randomFn: () => number = Math.random
): readonly string[] {
  validateGeneratorParams(params)

  const { source, minLength, maxLength, fragmentCount } = params
  const sourceLen = source.length
  const effectiveMax = Math.min(maxLength, sourceLen)
  const fragments: string[] = []

  for (let i = 0; i < fragmentCount; i++) {
    // Length in [minLength, effectiveMax]
    const span = effectiveMax - minLength + 1
    const len = minLength + Math.floor(randomFn() * span)

    // Start offset in [0, sourceLen - len]
    const maxOffset = sourceLen - len
    const offset = Math.floor(randomFn() * (maxOffset + 1))

    fragments.push(source.substring(offset, offset + len))
  }

  return fragments
}
