import type {
  OverlapCandidate,
  ReductionEvent,
  RemovedFragment
} from '../types.js'

/**
 * Step presentation model consumed uniformly by the view tier.
 */
export interface StepViewModel {
  readonly pool: readonly string[]
  readonly candidate?: OverlapCandidate
  readonly mergedFragment?: string
  readonly removed: readonly RemovedFragment[]
  readonly description: string
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
 * Pure projection mapping domain ReductionEvent records to uniform
 * presentation view models.
 */
export function projectStepView(event: ReductionEvent): StepViewModel {
  switch (event.kind) {
    case 'initial-filtered': {
      const desc =
        event.removed.length > 0
          ? `Filtered ${event.removed.length} redundant fragments ` +
            `(duplicates/substrings). Active pool: ${event.pool.length}.`
          : `All ${event.pool.length} fragments are unique and uncontained.`
      return {
        pool: event.pool,
        removed: event.removed,
        description: desc
      }
    }

    case 'candidate-selected':
      return {
        pool: event.pool,
        candidate: event.candidate,
        removed: [],
        description:
          `Found best overlap of length ${event.candidate.matchLength} ` +
          `between prefix "${event.candidate.prefix}" and suffix ` +
          `"${event.candidate.suffix}".`
      }

    case 'pair-merged':
      return {
        pool: event.pool,
        candidate: event.candidate,
        mergedFragment: event.mergedFragment,
        removed: [],
        description:
          `Merged "${event.candidate.prefix}" and ` +
          `"${event.candidate.suffix}" into "${event.mergedFragment}".`
      }

    case 'dynamic-filtered':
      return {
        pool: event.pool,
        mergedFragment: event.mergedFragment,
        removed: event.removed,
        description:
          `Dynamic containment: eliminated ` +
          `${event.removed.map(describeRemoved).join(', ')} ` +
          `engulfed by new sequence.`
      }

    case 'assembly-completed':
      return {
        pool: event.contigs,
        removed: [],
        description:
          `Assembly complete: reconstructed ${event.contigs.length} ` +
          `contig(s).`
      }
  }
}
