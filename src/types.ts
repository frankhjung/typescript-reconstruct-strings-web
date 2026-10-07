/**
 * Core domain types and state interfaces for the OLC sequence assembler.
 */

export interface OverlapCandidate {
  readonly prefix: string
  readonly suffix: string
  readonly matchLength: number
}

export interface BaseAssemblyStep {
  readonly stepIndex: number
  readonly pool: readonly string[]
  readonly description: string
}

export interface InitStep extends BaseAssemblyStep {
  readonly type: 'init'
}

export interface FilterInitialStep extends BaseAssemblyStep {
  readonly type: 'filter-initial'
  readonly removedFragments?: readonly string[]
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
  readonly removedFragments?: readonly string[]
  readonly mergedFragment?: string
}

export interface CanonicalSortStep extends BaseAssemblyStep {
  readonly type: 'canonical-sort'
}

export interface CompletedStep extends BaseAssemblyStep {
  readonly type: 'completed'
}

export type AssemblyStep =
  | InitStep
  | FilterInitialStep
  | FindOverlapStep
  | MergePairStep
  | FilterDynamicStep
  | CanonicalSortStep
  | CompletedStep

export type StepType = AssemblyStep['type']

export interface GeneratorParams {
  readonly source: string
  readonly n: number // minimum overlap threshold
  readonly a: number // minimum fragment length
  readonly b: number // maximum fragment length
  readonly m: number // number of random fragments
}

export interface Span {
  readonly start: number // 0-based inclusive
  readonly end: number // 0-based exclusive
}

export interface ContigAlignment {
  readonly contig: string
  readonly sourceStart: number
  readonly length: number
  readonly isExact: boolean
}

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

export interface Preset {
  readonly name: string
  readonly description: string
  readonly params: GeneratorParams
  readonly defaultFragments?: readonly string[]
}
