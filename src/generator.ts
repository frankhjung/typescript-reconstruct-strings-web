import { GeneratorParams } from './types.js'

export const MAX_SOURCE_LENGTH = 10000
export const MAX_FRAGMENT_COUNT = 500

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validate generator parameters according to REQ-003 constraints and DoS bounds.
 */
export function validateGeneratorParams(params: GeneratorParams): void {
  const { source, n, a, b, m } = params

  if (!source || source.length === 0) {
    throw new ValidationError('Source string must not be empty.')
  }

  if (source.length > MAX_SOURCE_LENGTH) {
    throw new ValidationError(
      `Source string length (${source.length}) exceeds maximum limit (${MAX_SOURCE_LENGTH}).`
    )
  }

  if (!Number.isInteger(n) || n < 2) {
    throw new ValidationError('Minimum overlap (n) must be an integer >= 2.')
  }

  if (!Number.isInteger(a) || a < 2) {
    throw new ValidationError(
      'Minimum fragment length (a) must be an integer >= 2.'
    )
  }

  if (!Number.isInteger(b) || b < a) {
    throw new ValidationError(
      'Maximum fragment length (b) must be >= minimum length (a).'
    )
  }

  if (a > source.length) {
    throw new ValidationError(
      'Minimum fragment length (a) cannot exceed source string length.'
    )
  }

  if (!Number.isInteger(m) || m < 2) {
    throw new ValidationError(
      'Fragment count (m) must be an integer >= 2.'
    )
  }

  if (m > MAX_FRAGMENT_COUNT) {
    throw new ValidationError(
      `Fragment count (m=${m}) exceeds maximum limit (${MAX_FRAGMENT_COUNT}).`
    )
  }
}

/**
 * Extract m random substrings from source text.
 * Uses optional random function for deterministic testing.
 */
export function generateFragments(
  params: GeneratorParams,
  randomFn: () => number = Math.random
): string[] {
  validateGeneratorParams(params)

  const { source, a, b, m } = params
  const sourceLen = source.length
  const effectiveMax = Math.min(b, sourceLen)
  const fragments: string[] = []

  for (let i = 0; i < m; i++) {
    // Length in [a, effectiveMax]
    const span = effectiveMax - a + 1
    const len = a + Math.floor(randomFn() * span)

    // Start offset in [0, sourceLen - len]
    const maxOffset = sourceLen - len
    const offset = Math.floor(randomFn() * (maxOffset + 1))

    fragments.push(source.substring(offset, offset + len))
  }

  return fragments
}
