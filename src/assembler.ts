import type {
  AssemblyStep,
  OverlapCandidate,
  ReductionEvent,
  ReductionSession,
  RemovedFragment
} from './types.js'

/**
 * Compare two strings in UTF-16 code unit order.
 *
 * This comparison is locale-independent, ensuring deterministic code point
 * ordering across all runtime environments.
 */
export function compareStrings(a: string, b: string): number {
  if (a < b) {
    return -1
  }
  return a > b ? 1 : 0
}

/**
 * Calculate the longest suffix-prefix overlap between two distinct fragments.
 * Returns 0 if no match meeting or exceeding minOverlap is found,
 * or if match length equals or exceeds the longer fragment.
 */
export function calculateOverlap(
  prefix: string,
  suffix: string,
  minOverlap: number
): number {
  const maxPossible = Math.min(prefix.length, suffix.length)
  const maxLen = Math.max(prefix.length, suffix.length)

  for (let len = maxPossible; len >= minOverlap; len--) {
    if (len >= maxLen) {
      continue
    }
    const endOfPrefix = prefix.slice(prefix.length - len)
    const startOfSuffix = suffix.slice(0, len)
    if (endOfPrefix === startOfSuffix) {
      return len
    }
  }

  return 0
}

/**
 * Compare candidates using a strict three-tier deterministic total order:
 * 1. Longest overlap match length (descending)
 * 2. Smaller prefix fragment in UTF-16 code unit order (ascending)
 * 3. Smaller suffix fragment in UTF-16 code unit order (ascending)
 */
export function compareCandidates(
  a: OverlapCandidate,
  b: OverlapCandidate
): number {
  if (a.matchLength !== b.matchLength) {
    return b.matchLength - a.matchLength
  }
  if (a.prefix !== b.prefix) {
    return compareStrings(a.prefix, b.prefix)
  }
  return compareStrings(a.suffix, b.suffix)
}

/**
 * Find the single best overlap candidate across all ordered fragment pairs
 * in the active pool according to the deterministic total order.
 */
export function findBestOverlap(
  pool: readonly string[],
  minOverlap: number
): OverlapCandidate | null {
  let best: OverlapCandidate | null = null

  for (let i = 0; i < pool.length; i++) {
    for (let j = 0; j < pool.length; j++) {
      const prefix = pool[i]
      const suffix = pool[j]
      if (
        i === j ||
        prefix === undefined ||
        suffix === undefined ||
        prefix === suffix
      ) {
        continue
      }
      const matchLength = calculateOverlap(prefix, suffix, minOverlap)
      if (matchLength < minOverlap) {
        continue
      }
      const candidate: OverlapCandidate = { prefix, suffix, matchLength }
      if (best === null || compareCandidates(candidate, best) < 0) {
        best = candidate
      }
    }
  }

  return best
}

/**
 * Merge two fragments along an exact suffix-prefix overlapping boundary.
 * Concatenates the prefix fragment with the non-overlapping remainder
 * of the suffix fragment.
 */
export function mergePair(
  prefix: string,
  suffix: string,
  overlapLen: number
): string {
  return prefix + suffix.slice(overlapLen)
}

/**
 * Test whether candidate string s1 is a proper substring of container s2
 * (contained within s2 and strictly not equal to s2).
 */
export function isProperSubstringOf(s1: string, s2: string): boolean {
  return s1 !== s2 && s2.includes(s1)
}

/**
 * Eliminate exact duplicates and any fragments fully contained as proper
 * substrings inside longer fragments within the pool.
 */
export function filterContainedFragments(fragments: readonly string[]): {
  readonly kept: readonly string[]
  readonly removed: readonly RemovedFragment[]
} {
  const uniqueFragments = Array.from(new Set(fragments))
  const contained: RemovedFragment[] = []
  const kept: string[] = []

  for (const fragment of uniqueFragments) {
    const isContained = uniqueFragments.some((other) =>
      isProperSubstringOf(fragment, other)
    )
    if (isContained) {
      contained.push({ fragment, reason: 'contained' })
    } else {
      kept.push(fragment)
    }
  }

  const counts = new Map<string, number>()
  for (const fragment of fragments) {
    counts.set(fragment, (counts.get(fragment) ?? 0) + 1)
  }
  const duplicates: RemovedFragment[] = []
  for (const [fragment, count] of counts) {
    if (count > 1 && kept.includes(fragment)) {
      duplicates.push({ fragment, reason: 'duplicate', copies: count - 1 })
    }
  }

  return { kept, removed: [...contained, ...duplicates] }
}

/**
 * Format a human-readable text explanation of why a fragment was removed
 * from the pool (duplicate or proper substring containment).
 */
export function describeRemoved(removed: RemovedFragment): string {
  if (removed.reason === 'contained') {
    return removed.fragment
  }
  const copies = removed.copies ?? 1
  const noun = copies === 1 ? 'duplicate copy' : 'duplicate copies'
  return `${removed.fragment} (${copies} ${noun})`
}

/**
 * Sort contigs into canonical output order:
 * 1. Descending sequence length (longer first)
 * 2. Ascending sequence order (UTF-16 code unit order)
 */
export function sortCanonical(contigs: readonly string[]): readonly string[] {
  return [...contigs].sort((a, b) => {
    if (b.length !== a.length) {
      return b.length - a.length
    }
    return compareStrings(a, b)
  })
}

/**
 * Validate input preconditions for sequence assembly:
 * - Minimum overlap must be an integer >= 1
 * - Fragment pool must not contain empty strings
 */
export function validateAssemblyInputs(
  rawFragments: readonly string[],
  minOverlap: number
): void {
  if (!Number.isInteger(minOverlap) || minOverlap < 1) {
    throw new Error(
      `Invalid minimum overlap: must be an integer >= 1 (got ${minOverlap})`
    )
  }
  if (rawFragments.some((f) => f.length === 0)) {
    throw new Error('Empty fragment encountered in input.')
  }
}

/**
 * Assemble raw fragments into contigs using greedy overlap reduction.
 *
 * Performs deterministic pre-filtering, iterative best-overlap merging with
 * dynamic containment elimination, and canonical contig sorting. Returns
 * assembled contigs directly without intermediate animation trace overhead.
 */
export function assemble(
  rawFragments: readonly string[],
  minOverlap: number
): readonly string[] {
  validateAssemblyInputs(rawFragments, minOverlap)
  const { kept: initialPool } = filterContainedFragments(rawFragments)
  let pool = [...initialPool]

  while (pool.length > 1) {
    const candidate = findBestOverlap(pool, minOverlap)
    if (!candidate) {
      break
    }
    const merged = mergePair(
      candidate.prefix,
      candidate.suffix,
      candidate.matchLength
    )
    const remaining = pool.filter(
      (f) => f !== candidate.prefix && f !== candidate.suffix
    )
    const { kept } = filterContainedFragments([merged, ...remaining])
    pool = [...kept]
  }

  return sortCanonical(pool)
}

/**
 * Initialise an immutable reduction session for stepwise assembly.
 *
 * Prepares the active pool and marks the session ready for iterative
 * execution via {@link stepSession}.
 */
export function startSession(
  rawFragments: readonly string[],
  minOverlap: number
): ReductionSession {
  validateAssemblyInputs(rawFragments, minOverlap)
  return {
    pool: [...rawFragments],
    minOverlap,
    isComplete: false,
    stage: 'init'
  }
}

/**
 * Advance an assembly reduction session by a single discrete transition.
 *
 * Returns the updated immutable session and the corresponding domain event
 * (initial filtering, candidate selection, merging, dynamic containment,
 * or assembly completion).
 */
export function stepSession(
  session: ReductionSession
): { readonly session: ReductionSession; readonly event: ReductionEvent } {
  if (session.isComplete || session.stage === 'done') {
    const contigs = sortCanonical(session.pool)
    return {
      session: {
        ...session,
        pool: contigs,
        isComplete: true,
        stage: 'done'
      },
      event: {
        kind: 'assembly-completed',
        pool: contigs,
        contigs
      }
    }
  }

  const stage = session.stage ?? 'init'

  if (stage === 'init') {
    const { kept, removed } = filterContainedFragments(session.pool)
    return {
      session: {
        ...session,
        pool: kept,
        stage: 'select'
      },
      event: {
        kind: 'initial-filtered',
        pool: kept,
        removed
      }
    }
  }

  if (stage === 'select') {
    if (session.pool.length <= 1) {
      const contigs = sortCanonical(session.pool)
      return {
        session: {
          ...session,
          pool: contigs,
          isComplete: true,
          stage: 'done'
        },
        event: {
          kind: 'assembly-completed',
          pool: contigs,
          contigs
        }
      }
    }

    const candidate = findBestOverlap(session.pool, session.minOverlap)
    if (!candidate) {
      const contigs = sortCanonical(session.pool)
      return {
        session: {
          ...session,
          pool: contigs,
          isComplete: true,
          stage: 'done'
        },
        event: {
          kind: 'assembly-completed',
          pool: contigs,
          contigs
        }
      }
    }

    return {
      session: {
        ...session,
        pendingCandidate: candidate,
        stage: 'merge'
      },
      event: {
        kind: 'candidate-selected',
        pool: session.pool,
        candidate
      }
    }
  }

  if (stage === 'merge') {
    const candidate = session.pendingCandidate!
    const merged = mergePair(
      candidate.prefix,
      candidate.suffix,
      candidate.matchLength
    )
    const remaining = session.pool.filter(
      (f) => f !== candidate.prefix && f !== candidate.suffix
    )
    const preFilteredPool = [merged, ...remaining]
    const { kept, removed } = filterContainedFragments(preFilteredPool)

    if (removed.length > 0) {
      return {
        session: {
          ...session,
          pool: kept,
          pendingCandidate: candidate,
          pendingMerged: merged,
          pendingDynamicRemoved: removed,
          stage: 'dynamic-filter'
        },
        event: {
          kind: 'pair-merged',
          pool: preFilteredPool,
          candidate,
          mergedFragment: merged
        }
      }
    }

    return {
      session: {
        pool: kept,
        minOverlap: session.minOverlap,
        isComplete: false,
        stage: 'select'
      },
      event: {
        kind: 'pair-merged',
        pool: preFilteredPool,
        candidate,
        mergedFragment: merged
      }
    }
  }

  return {
    session: {
      pool: session.pool,
      minOverlap: session.minOverlap,
      isComplete: false,
      stage: 'select'
    },
    event: {
      kind: 'dynamic-filtered',
      pool: session.pool,
      removed: session.pendingDynamicRemoved ?? [],
      mergedFragment: session.pendingMerged ?? ''
    }
  }
}

/**
 * Execute greedy overlap reduction while capturing an immutable sequence
 * of pure domain {@link ReductionEvent} records for animation playback.
 */
export function traceAssembly(
  rawFragments: readonly string[],
  minOverlap: number
): readonly ReductionEvent[] {
  let session = startSession(rawFragments, minOverlap)
  const events: ReductionEvent[] = []

  while (!session.isComplete) {
    const step = stepSession(session)
    session = step.session
    events.push(step.event)
  }

  return events
}

/** Final contigs plus the full animation trace. */
export interface AssemblyResult {
  readonly contigs: readonly string[]
  readonly steps: readonly AssemblyStep[]
}

/**
 * Backward-compatible Strangler Fig delegation adapter for legacy UI callers.
 *
 * Unfolds the pure session via {@link traceAssembly} and projects domain
 * reduction events into legacy {@link AssemblyStep} view models.
 */
export function assembleWithTrace(
  rawFragments: readonly string[],
  minOverlap: number
): AssemblyResult {
  validateAssemblyInputs(rawFragments, minOverlap)

  const steps: AssemblyStep[] = []
  let stepIndex = 0

  steps.push({
    stepIndex: stepIndex++,
    type: 'init',
    pool: [...rawFragments],
    description: `Initialised raw pool with ${rawFragments.length} fragments.`
  })

  const events = traceAssembly(rawFragments, minOverlap)
  let lastCandidate: OverlapCandidate | undefined

  for (const event of events) {
    switch (event.kind) {
      case 'initial-filtered':
        steps.push({
          stepIndex: stepIndex++,
          type: 'filter-initial',
          pool: [...event.pool],
          removedFragments: event.removed,
          description:
            event.removed.length > 0
              ? `Filtered ${event.removed.length} redundant fragments ` +
                `(duplicates/substrings). Active pool: ${event.pool.length}.`
              : `All ${event.pool.length} fragments are unique and uncontained.`
        })
        break

      case 'candidate-selected':
        lastCandidate = event.candidate
        steps.push({
          stepIndex: stepIndex++,
          type: 'find-overlap',
          pool: [...event.pool],
          candidate: event.candidate,
          description:
            `Found best overlap of length ${event.candidate.matchLength} ` +
            `between prefix "${event.candidate.prefix}" and suffix ` +
            `"${event.candidate.suffix}".`
        })
        break

      case 'pair-merged':
        steps.push({
          stepIndex: stepIndex++,
          type: 'merge-pair',
          pool: [...event.pool],
          candidate: event.candidate,
          mergedFragment: event.mergedFragment,
          description:
            `Merged "${event.candidate.prefix}" and ` +
            `"${event.candidate.suffix}" into "${event.mergedFragment}".`
        })
        break

      case 'dynamic-filtered': {
        const step = {
          stepIndex: stepIndex++,
          type: 'filter-dynamic' as const,
          pool: [...event.pool],
          removedFragments: event.removed,
          mergedFragment: event.mergedFragment,
          description:
            `Dynamic containment: eliminated ` +
            `${event.removed.map(describeRemoved).join(', ')} ` +
            `engulfed by new sequence.`
        }
        if (lastCandidate !== undefined) {
          steps.push({ ...step, candidate: lastCandidate })
        } else {
          steps.push(step)
        }
        break
      }

      case 'assembly-completed':
        steps.push({
          stepIndex: stepIndex++,
          type: 'canonical-sort',
          pool: event.contigs,
          description:
            `Canonical sort: ${event.contigs.length} contig(s) ordered ` +
            `by length, then alphabetically.`
        })
        steps.push({
          stepIndex,
          type: 'completed',
          pool: event.contigs,
          description:
            `Assembly complete: reconstructed ${event.contigs.length} ` +
            `contig(s).`
        })
        break
    }
  }

  const finalContigs =
    events.find((e) => e.kind === 'assembly-completed')?.contigs ?? []

  return {
    contigs: finalContigs,
    steps
  }
}
