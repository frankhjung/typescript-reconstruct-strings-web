import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { alignContigsToSource } from '../src/alignment.js';

describe('Alignment - Reference Comparison', () => {
  it('reports perfect match when single contig matches source', () => {
    const report = alignContigsToSource('ATGGCGTGCA', ['ATGGCGTGCA']);
    assert.equal(report.perfectMatch, true);
    assert.equal(report.coveragePercent, 100);
    assert.equal(report.uncoveredSpans.length, 0);
    assert.ok(report.summary.includes('PERFECT RECONSTRUCTION'));
  });

  it('reports coverage gaps when fragments leave regions uncovered', () => {
    const report = alignContigsToSource('ABCDEFGHIJK', ['ABC', 'IJK']);
    assert.equal(report.perfectMatch, false);
    assert.ok(report.coveragePercent < 100);
    assert.ok(report.uncoveredSpans.length > 0);
    assert.ok(report.summary.includes('PARTIAL ASSEMBLY'));
  });

  it('detects chimeric / misassembled contigs', () => {
    const report = alignContigsToSource('ABCDEF', ['ZZZZZZZZ']);
    assert.equal(report.perfectMatch, false);
    assert.ok(report.unalignedContigs.includes('ZZZZZZZZ'));
    assert.ok(report.summary.includes('MISASSEMBLY DETECTED'));
  });
});
