import { AlignmentReport, ContigAlignment, Span } from './types.js';

/**
 * Find all start indices where needle appears as exact substring of haystack.
 */
function findAllOccurrences(haystack: string, needle: string): number[] {
  const indices: number[] = [];
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    indices.push(pos);
    pos += 1;
  }
  return indices;
}

/**
 * Find the best local alignment window of contig against source.
 */
function findBestWindow(
  source: string,
  contig: string
): { start: number; matches: number; isExact: boolean } {
  // Check exact match first
  const exactPos = source.indexOf(contig);
  if (exactPos !== -1) {
    return { start: exactPos, matches: contig.length, isExact: true };
  }

  // If contig is longer than source, or no exact match, sliding window
  let bestStart = 0;
  let maxMatches = -1;

  const maxOffset = Math.max(0, source.length - contig.length);
  for (let offset = 0; offset <= maxOffset; offset++) {
    let currentMatches = 0;
    const compareLen = Math.min(contig.length, source.length - offset);
    for (let j = 0; j < compareLen; j++) {
      if (source[offset + j] === contig[j]) {
        currentMatches++;
      }
    }
    if (currentMatches > maxMatches) {
      maxMatches = currentMatches;
      bestStart = offset;
    }
  }

  return {
    start: bestStart,
    matches: maxMatches,
    isExact: maxMatches === contig.length
  };
}

/**
 * Compare assembled contigs against original source sequence.
 */
export function alignContigsToSource(
  source: string,
  contigs: readonly string[]
): AlignmentReport {
  const sourceLen = source.length;
  const coveredPositions = new Array<boolean>(sourceLen).fill(false);
  const alignments: ContigAlignment[] = [];
  const unalignedContigs: string[] = [];

  const perfectMatch = contigs.length === 1 && contigs[0] === source;

  for (const contig of contigs) {
    const exactOccurrences = findAllOccurrences(source, contig);
    if (exactOccurrences.length > 0) {
      // Pick the first occurrence that helps cover uncovered positions
      let chosenStart = exactOccurrences[0];
      for (const occ of exactOccurrences) {
        let coversNew = false;
        for (let i = occ; i < occ + contig.length; i++) {
          if (!coveredPositions[i]) {
            coversNew = true;
            break;
          }
        }
        if (coversNew) {
          chosenStart = occ;
          break;
        }
      }

      alignments.push({
        contig,
        sourceStart: chosenStart,
        length: contig.length,
        isExact: true
      });

      for (let i = chosenStart; i < chosenStart + contig.length; i++) {
        coveredPositions[i] = true;
      }
    } else {
      // Inexact or chimeric contig
      const best = findBestWindow(source, contig);
      if (best.matches >= Math.floor(contig.length * 0.5)) {
        alignments.push({
          contig,
          sourceStart: best.start,
          length: contig.length,
          isExact: false
        });
        const end = Math.min(sourceLen, best.start + contig.length);
        for (let i = best.start; i < end; i++) {
          if (source[i] === contig[i - best.start]) {
            coveredPositions[i] = true;
          }
        }
      } else {
        unalignedContigs.push(contig);
      }
    }
  }

  // Calculate covered and uncovered spans
  const coveredSpans: Span[] = [];
  const uncoveredSpans: Span[] = [];

  let inCovered = false;
  let spanStart = 0;

  for (let i = 0; i < sourceLen; i++) {
    if (coveredPositions[i] && !inCovered) {
      if (i > spanStart) {
        uncoveredSpans.push({ start: spanStart, end: i });
      }
      spanStart = i;
      inCovered = true;
    } else if (!coveredPositions[i] && inCovered) {
      coveredSpans.push({ start: spanStart, end: i });
      spanStart = i;
      inCovered = false;
    }
  }

  if (inCovered) {
    coveredSpans.push({ start: spanStart, end: sourceLen });
  } else {
    uncoveredSpans.push({ start: spanStart, end: sourceLen });
  }

  const coveredCount = coveredPositions.filter(Boolean).length;
  const coveragePercent =
    sourceLen > 0 ? (coveredCount / sourceLen) * 100 : 0;

  let summary: string;
  if (perfectMatch) {
    summary = 'PERFECT RECONSTRUCTION (100% Identity, 0 errors)';
  } else if (uncoveredSpans.length > 0 && unalignedContigs.length === 0) {
    const gapCount = uncoveredSpans.length;
    summary =
      `PARTIAL ASSEMBLY: ${coveragePercent.toFixed(1)}% coverage with ` +
      `${gapCount} coverage gap(s). Increase fragment count (m) or ` +
      `lower overlap threshold (n).`;
  } else if (unalignedContigs.length > 0) {
    summary =
      `MISASSEMBLY DETECTED: ${unalignedContigs.length} contig(s) contain ` +
      `chimeric joins not present in source.`;
  } else {
    summary =
      `FRAGMENTED ASSEMBLY: ${contigs.length} contigs covering ` +
      `${coveragePercent.toFixed(1)}% of source.`;
  }

  return {
    source,
    contigs,
    perfectMatch,
    coveredPositions,
    coveragePercent,
    coveredSpans,
    uncoveredSpans,
    alignments,
    unalignedContigs,
    summary
  };
}
