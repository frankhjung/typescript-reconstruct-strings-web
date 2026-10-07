import type {
  AssemblyStep,
  OverlapCandidate,
  RemovedFragment
} from '../types.js'

/** Step data that the views highlight, uniform across step types. */
export interface StepDetails {
  readonly candidate: OverlapCandidate | undefined
  readonly mergedFragment: string | undefined
  readonly removed: readonly RemovedFragment[]
}

const NO_DETAILS: StepDetails = {
  candidate: undefined,
  mergedFragment: undefined,
  removed: []
}

function assertNever(value: never): never {
  throw new Error(`Unhandled assembly step: ${JSON.stringify(value)}`)
}

/**
 * Extract the highlightable details of a step. Switching on the
 * discriminant keeps this exhaustive: adding a step type fails to compile
 * until it is handled here.
 */
export function stepDetails(step: AssemblyStep): StepDetails {
  switch (step.type) {
    case 'init':
    case 'canonical-sort':
    case 'completed':
      return NO_DETAILS
    case 'filter-initial':
      return { ...NO_DETAILS, removed: step.removedFragments ?? [] }
    case 'find-overlap':
      return { ...NO_DETAILS, candidate: step.candidate }
    case 'merge-pair':
      return {
        ...NO_DETAILS,
        candidate: step.candidate,
        mergedFragment: step.mergedFragment
      }
    case 'filter-dynamic':
      return {
        candidate: step.candidate,
        mergedFragment: step.mergedFragment,
        removed: step.removedFragments ?? []
      }
    default:
      return assertNever(step)
  }
}
