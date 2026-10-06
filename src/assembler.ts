import { AssemblyStep, OverlapCandidate } from './types.js';

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
  const maxPossible = Math.min(prefix.length, suffix.length);
  const maxLen = Math.max(prefix.length, suffix.length);

  for (let len = maxPossible; len >= minOverlap; len--) {
    if (len >= maxLen) {
      continue;
    }
    const endOfPrefix = prefix.slice(prefix.length - len);
    const startOfSuffix = suffix.slice(0, len);
    if (endOfPrefix === startOfSuffix) {
      return len;
    }
  }

  return 0;
}

/**
 * Compare candidates using REQ-001 strict three-tier deterministic total order:
 * 1. Longest overlap match length (descending)
 * 2. Lexicographically smaller prefix fragment (ascending)
 * 3. Lexicographically smaller suffix fragment (ascending)
 */
export function compareCandidates(
  a: OverlapCandidate,
  b: OverlapCandidate
): number {
  if (a.matchLength !== b.matchLength) {
    return b.matchLength - a.matchLength;
  }
  if (a.prefix !== b.prefix) {
    return a.prefix.localeCompare(b.prefix);
  }
  return a.suffix.localeCompare(b.suffix);
}

/**
 * Find the single best overlap candidate across all ordered fragment pairs.
 */
export function findBestOverlap(
  pool: readonly string[],
  minOverlap: number
): OverlapCandidate | null {
  const candidates: OverlapCandidate[] = [];

  for (let i = 0; i < pool.length; i++) {
    for (let j = 0; j < pool.length; j++) {
      if (i === j) {
        continue;
      }
      const prefix = pool[i];
      const suffix = pool[j];
      if (prefix === suffix) {
        continue;
      }
      const matchLength = calculateOverlap(prefix, suffix, minOverlap);
      if (matchLength >= minOverlap) {
        candidates.push({ prefix, suffix, matchLength });
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort(compareCandidates);
  return candidates[0];
}

/**
 * Merge two fragments along an overlapping boundary.
 */
export function mergePair(
  prefix: string,
  suffix: string,
  overlapLen: number
): string {
  return prefix + suffix.slice(overlapLen);
}

/**
 * Check if s1 is a proper substring of s2.
 */
export function isProperSubstringOf(s1: string, s2: string): boolean {
  return s1 !== s2 && s2.includes(s1);
}

/**
 * Eliminate exact duplicates and any fragments fully contained as proper
 * substrings inside longer fragments.
 */
export function filterContainedFragments(
  fragments: readonly string[]
): { readonly kept: string[]; readonly removed: string[] } {
  // Preserve order of first appearance for duplicates
  const uniqueFragments = Array.from(new Set(fragments));
  const removed: string[] = [];
  const kept: string[] = [];

  for (const f of uniqueFragments) {
    const isContained = uniqueFragments.some(
      other => isProperSubstringOf(f, other)
    );
    if (isContained) {
      removed.push(f);
    } else {
      kept.push(f);
    }
  }

  // Also track exact duplicate instances that were dropped
  const duplicateCounts = new Map<string, number>();
  for (const f of fragments) {
    duplicateCounts.set(f, (duplicateCounts.get(f) ?? 0) + 1);
  }
  for (const [f, count] of duplicateCounts.entries()) {
    if (count > 1 && !removed.includes(f)) {
      removed.push(`${f} (${count - 1} duplicate copy)`);
    }
  }

  return { kept, removed };
}

/**
 * Sort contigs into canonical output order:
 * 1. Descending sequence length (longer first)
 * 2. Ascending lexicographical sequence order
 */
export function sortCanonical(contigs: readonly string[]): string[] {
  return [...contigs].sort((a, b) => {
    if (b.length !== a.length) {
      return b.length - a.length;
    }
    return a.localeCompare(b);
  });
}

export interface AssemblyResult {
  readonly contigs: readonly string[];
  readonly steps: readonly AssemblyStep[];
}

/**
 * Assemble fragments into contigs while capturing an immutable trace
 * of animation steps.
 */
export function assembleWithTrace(
  rawFragments: readonly string[],
  minOverlap: number
): AssemblyResult {
  if (minOverlap < 1) {
    throw new Error(
      `Invalid minimum overlap: must be >= 1 (got ${minOverlap})`
    );
  }
  if (rawFragments.some(f => f.length === 0)) {
    throw new Error('Empty fragment encountered in input.');
  }

  const steps: AssemblyStep[] = [];
  let stepIndex = 0;

  // Step 0: Initial Raw Pool
  steps.push({
    stepIndex: stepIndex++,
    type: 'init',
    pool: [...rawFragments],
    description: `Initialised raw pool with ${rawFragments.length} fragments.`
  });

  // Step 1: Pre-processing deduplication & containment filtering
  const { kept: initialPool, removed: initialRemoved } =
    filterContainedFragments(rawFragments);

  steps.push({
    stepIndex: stepIndex++,
    type: 'filter-initial',
    pool: [...initialPool],
    removedFragments: initialRemoved,
    description:
      initialRemoved.length > 0
        ? `Filtered ${initialRemoved.length} redundant fragments ` +
          `(duplicates/substrings). Active pool: ${initialPool.length}.`
        : `All ${initialPool.length} fragments are unique and uncontained.`
  });

  // Iterative reduction loop
  let pool = [...initialPool];

  while (pool.length > 1) {
    const candidate = findBestOverlap(pool, minOverlap);
    if (!candidate) {
      break;
    }

    // Step: Selected best overlap pair
    steps.push({
      stepIndex: stepIndex++,
      type: 'find-overlap',
      pool: [...pool],
      candidate,
      description:
        `Found best overlap of length ${candidate.matchLength} between ` +
        `prefix "${candidate.prefix}" and suffix "${candidate.suffix}".`
    });

    // Step: Merge pair
    const merged = mergePair(
      candidate.prefix,
      candidate.suffix,
      candidate.matchLength
    );
    const remaining = pool.filter(
      f => f !== candidate.prefix && f !== candidate.suffix
    );
    const preFilteredPool = [merged, ...remaining];

    steps.push({
      stepIndex: stepIndex++,
      type: 'merge-pair',
      pool: preFilteredPool,
      candidate,
      mergedFragment: merged,
      description:
        `Merged "${candidate.prefix}" and "${candidate.suffix}" into ` +
        `"${merged}".`
    });

    // Step: Dynamic containment filtering
    const { kept: updatedPool, removed: dynamicRemoved } =
      filterContainedFragments(preFilteredPool);

    if (dynamicRemoved.length > 0) {
      steps.push({
        stepIndex: stepIndex++,
        type: 'filter-dynamic',
        pool: [...updatedPool],
        removedFragments: dynamicRemoved,
        mergedFragment: merged,
        description:
          `Dynamic containment: eliminated ${dynamicRemoved.join(', ')} ` +
          `engulfed by new sequence.`
      });
    }

    pool = updatedPool;
  }

  // Final Step: Canonical sort
  const sortedContigs = sortCanonical(pool);

  steps.push({
    stepIndex: stepIndex++,
    type: 'canonical-sort',
    pool: sortedContigs,
    description:
      `Canonical sort: ${sortedContigs.length} contig(s) ordered by length, ` +
      `then alphabetically.`
  });

  steps.push({
    stepIndex: stepIndex++,
    type: 'completed',
    pool: sortedContigs,
    description:
      `Assembly complete: reconstructed ${sortedContigs.length} contig(s).`
  });

  return {
    contigs: sortedContigs,
    steps
  };
}
