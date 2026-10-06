/**
 * Core domain types and state interfaces for the OLC sequence assembler.
 */

export interface OverlapCandidate {
  readonly prefix: string;
  readonly suffix: string;
  readonly matchLength: number;
}

export type StepType =
  | 'init'
  | 'filter-initial'
  | 'find-overlap'
  | 'merge-pair'
  | 'filter-dynamic'
  | 'canonical-sort'
  | 'completed';

export interface AssemblyStep {
  readonly stepIndex: number;
  readonly type: StepType;
  readonly pool: readonly string[];
  readonly candidate?: OverlapCandidate | null;
  readonly removedFragments?: readonly string[];
  readonly mergedFragment?: string;
  readonly description: string;
}

export interface GeneratorParams {
  readonly source: string;
  readonly n: number; // minimum overlap threshold
  readonly a: number; // minimum fragment length
  readonly b: number; // maximum fragment length
  readonly m: number; // number of random fragments
}

export interface Span {
  readonly start: number; // 0-based inclusive
  readonly end: number;   // 0-based exclusive
}

export interface ContigAlignment {
  readonly contig: string;
  readonly sourceStart: number;
  readonly length: number;
  readonly isExact: boolean;
}

export interface AlignmentReport {
  readonly source: string;
  readonly contigs: readonly string[];
  readonly perfectMatch: boolean;
  readonly coveredPositions: readonly boolean[];
  readonly coveragePercent: number;
  readonly coveredSpans: readonly Span[];
  readonly uncoveredSpans: readonly Span[];
  readonly alignments: readonly ContigAlignment[];
  readonly unalignedContigs: readonly string[];
  readonly summary: string;
}

export interface Preset {
  readonly name: string;
  readonly description: string;
  readonly params: GeneratorParams;
  readonly defaultFragments?: readonly string[];
}
