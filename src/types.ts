/**
 * Core domain types and state interfaces for the OLC sequence assembler.
 */

/** A pair of fragments that overlap by `matchLength` characters. */
export interface OverlapCandidate {
  /** Fragment whose end overlaps the start of `suffix`. */
  readonly prefix: string
  /** Fragment whose start overlaps the end of `prefix`. */
  readonly suffix: string
  /** Number of overlapping characters. */
  readonly matchLength: number
}

/** Why a fragment was dropped from the pool. */
export type RemovalReason = 'contained' | 'duplicate'

/** A fragment dropped from the pool, with the reason. */
export interface RemovedFragment {
  readonly fragment: string
  readonly reason: RemovalReason
  /** Number of redundant copies dropped (`duplicate` only). */
  readonly copies?: number
}

/**
 * Closed discriminated union of pure domain events emitted during assembly.
 * Unlike AssemblyStep, ReductionEvent contains no presentation strings.
 */
export type ReductionEvent =
  | {
      readonly kind: 'initial-filtered'
      readonly pool: readonly string[]
      readonly removed: readonly RemovedFragment[]
    }
  | {
      readonly kind: 'candidate-selected'
      readonly pool: readonly string[]
      readonly candidate: OverlapCandidate
    }
  | {
      readonly kind: 'pair-merged'
      readonly pool: readonly string[]
      readonly candidate: OverlapCandidate
      readonly mergedFragment: string
    }
  | {
      readonly kind: 'dynamic-filtered'
      readonly pool: readonly string[]
      readonly removed: readonly RemovedFragment[]
      readonly mergedFragment: string
    }
  | {
      readonly kind: 'assembly-completed'
      readonly pool: readonly string[]
      readonly contigs: readonly string[]
    }

/**
 * Immutable snapshot of an in-progress reduction session.
 */
export interface ReductionSession {
  readonly pool: readonly string[]
  readonly minOverlap: number
  readonly isComplete: boolean
  readonly stage?: 'init' | 'select' | 'merge' | 'dynamic-filter' | 'done'
  readonly pendingCandidate?: OverlapCandidate
  readonly pendingMerged?: string
  readonly pendingDynamicRemoved?: readonly RemovedFragment[]
}

/** Fields shared by every step of the assembly trace. */
export interface BaseAssemblyStep {
  readonly stepIndex: number
  /** Active fragment pool after this step. */
  readonly pool: readonly string[]
  /** Human readable explanation of the step. */
  readonly description: string
}

export interface InitStep extends BaseAssemblyStep {
  readonly type: 'init'
}

export interface FilterInitialStep extends BaseAssemblyStep {
  readonly type: 'filter-initial'
  readonly removedFragments?: readonly RemovedFragment[]
}

export interface FindOverlapStep extends BaseAssemblyStep {
  readonly type: 'find-overlap'
  readonly candidate: OverlapCandidate
}

export interface MergePairStep extends BaseAssemblyStep {
  readonly type: 'merge-pair'
  readonly candidate: OverlapCandidate
  readonly mergedFragment: string
}

export interface FilterDynamicStep extends BaseAssemblyStep {
  readonly type: 'filter-dynamic'
  readonly candidate?: OverlapCandidate
  readonly removedFragments?: readonly RemovedFragment[]
  readonly mergedFragment?: string
}

export interface CanonicalSortStep extends BaseAssemblyStep {
  readonly type: 'canonical-sort'
}

export interface CompletedStep extends BaseAssemblyStep {
  readonly type: 'completed'
}

/** Discriminated union of all assembly trace steps. */
export type AssemblyStep =
  | InitStep
  | FilterInitialStep
  | FindOverlapStep
  | MergePairStep
  | FilterDynamicStep
  | CanonicalSortStep
  | CompletedStep

/** Parameters for generating random fragments from a source string. */
export interface GeneratorParams {
  /** Ground-truth sequence to sample fragments from. */
  readonly source: string
  /** Minimum overlap threshold (UI label: n). */
  readonly minOverlap: number
  /** Minimum fragment length (UI label: a). */
  readonly minLength: number
  /** Maximum fragment length (UI label: b). */
  readonly maxLength: number
  /** Number of random fragments (UI label: m). */
  readonly fragmentCount: number
}

/** Half-open interval of source positions. */
export interface Span {
  readonly start: number // 0-based inclusive
  readonly end: number // 0-based exclusive
}

/** Placement of one contig against the source sequence. */
export interface ContigAlignment {
  readonly contig: string
  readonly sourceStart: number
  readonly isExact: boolean
}

/** Result of comparing assembled contigs against the source. */
export interface AlignmentReport {
  readonly source: string
  readonly contigs: readonly string[]
  readonly perfectMatch: boolean
  readonly coveredPositions: readonly boolean[]
  readonly coveragePercent: number
  readonly coveredSpans: readonly Span[]
  readonly uncoveredSpans: readonly Span[]
  readonly alignments: readonly ContigAlignment[]
  readonly unalignedContigs: readonly string[]
  readonly summary: string
}

/** A named example configuration offered in the UI. */
export interface Preset {
  readonly name: string
  readonly description: string
  readonly params: GeneratorParams
  /** Fixed fragments; when absent, fragments are generated randomly. */
  readonly defaultFragments?: readonly string[]
}
