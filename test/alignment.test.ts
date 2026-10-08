import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  alignContigsToSource,
  findAllOccurrences,
  findBestWindow,
  calculateSpans
} from '../src/alignment.js'

describe('Alignment - Reference Comparison', () => {
  it('reports perfect match when single contig matches source', () => {
    const report = alignContigsToSource('ATGGCGTGCA', ['ATGGCGTGCA'])
    assert.equal(report.perfectMatch, true)
    assert.equal(report.coveragePercent, 100)
    assert.equal(report.uncoveredSpans.length, 0)
  })

  it('reports coverage gaps when fragments leave regions uncovered', () => {
    const report = alignContigsToSource('ABCDEFGHIJK', ['ABC', 'IJK'])
    assert.equal(report.perfectMatch, false)
    assert.ok(report.coveragePercent < 100)
    assert.ok(report.uncoveredSpans.length > 0)
  })

  it('detects chimeric / misassembled contigs', () => {
    const report = alignContigsToSource('ABCDEF', ['ZZZZZZZZ'])
    assert.equal(report.perfectMatch, false)
    assert.ok(report.unalignedContigs.includes('ZZZZZZZZ'))
  })
})

describe('findAllOccurrences (Pure String Search)', () => {
  it('finds multiple exact occurrences', () => {
    assert.deepEqual(findAllOccurrences('ABABAB', 'AB'), [0, 2, 4])
  })
  it('returns empty array if not found', () => {
    assert.deepEqual(findAllOccurrences('ABABAB', 'C'), [])
  })
})

describe('findBestWindow (Sliding Window Search)', () => {
  it('finds exact match early', () => {
    assert.deepEqual(findBestWindow('ABCDEFG', 'CDE'), {
      start: 2,
      matches: 3,
      isExact: true
    })
  })
  it('finds best inexact match', () => {
    assert.deepEqual(findBestWindow('ABCDEFG', 'CDXF'), {
      start: 2,
      matches: 3,
      isExact: false
    })
  })
})

describe('calculateSpans (Interval Math)', () => {
  it('calculates alternating spans of booleans', () => {
    const positions = [true, true, false, false, true, false]
    const spans = calculateSpans(positions)
    assert.deepEqual(spans.coveredSpans, [
      { start: 0, end: 2 },
      { start: 4, end: 5 }
    ])
    assert.deepEqual(spans.uncoveredSpans, [
      { start: 2, end: 4 },
      { start: 5, end: 6 }
    ])
  })
})
